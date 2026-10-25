"""
auth.py – Authentication routes for Fashion Pro.

Security controls applied here:
  - Strict schema validation on every input (middleware.validators).
  - Per-IP AND per-account rate limits via Flask-Limiter.
  - Exponential backoff on repeated login/register failures.
  - Generic error messages to clients; full detail logged server-side only.
  - No stack traces, DB errors, or internal paths exposed to the caller.
"""
import logging
import os
import json
import re
from datetime import datetime, timezone

import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, create_access_token, create_refresh_token,
    get_jwt_identity
)

from config.db import db
from models.user import User
from middleware.rate_limiter import (
    auth_limit, auth_account_limit,
    authed_limit,
    check_auth_backoff, record_auth_failure, record_auth_success,
)
from middleware.validators import (
    ValidationError,
    validate_register, validate_login,
    validate_forgot_password, validate_reset_token_req, validate_reset_password,
)
from services.email_service import (
    generate_reset_token, validate_reset_token, send_password_reset_email
)

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.json')

WEAK_COMMON = {
    'password', '123456', 'qwerty', 'abc123', 'password1',
    'letmein', 'admin', 'welcome', 'iloveyou', '111111', '1234567890',
}


def _strong_password(p):
    if not p or len(p) < 8 or len(p) > 128:
        return False, "Password must be 8-128 characters long."
    if p.lower() in WEAK_COMMON:
        return False, "This password is too common. Please choose a different one."
    needs = [
        (re.search(r"[a-z]", p) is not None, "lowercase letter"),
        (re.search(r"[A-Z]", p) is not None, "uppercase letter"),
        (re.search(r"[0-9]", p) is not None, "number"),
    ]
    missing = [reason for ok, reason in needs if not ok]
    if missing:
        return False, "Password needs at least one " + ", one ".join(missing) + "."
    return True, None


def _load_users_json():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


# ==========================================================================
#  REGISTER
# ==========================================================================
@auth_bp.route('/register', methods=['POST'])
@auth_limit()
@auth_account_limit()
def register():
    ip = request.remote_addr or ""

    # 1. Backoff check
    try:
        data_raw = request.get_json(silent=True) or {}
        email_hint = (data_raw.get("email") or "").strip().lower()
    except Exception:
        email_hint = ""

    blocked = check_auth_backoff(ip, email_hint)
    if blocked:
        return blocked

    # 2. Schema validation
    try:
        data = validate_register(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    email = data["email"]
    password = data["password"]

    # 3. Password strength
    ok_pw, pw_msg = _strong_password(password)
    if not ok_pw:
        return jsonify({'error': pw_msg}), 400

    try:
        if User.query.filter_by(email=email).first():
            # Don't record a backoff failure for duplicate registration – not a brute-force signal
            return jsonify({'error': 'An account with this email already exists.'}), 409

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        member_since = datetime.now().strftime("%B %Y")

        new_user = User(
            name=data['name'],
            email=email,
            hashed_password=hashed,
            gender=data.get('gender', 'female'),
            member_since=member_since
        )
        db.session.add(new_user)
        db.session.commit()

        record_auth_success(ip, email)

        access_token = create_access_token(identity=new_user.email)
        refresh_token = create_refresh_token(identity=new_user.email)
        return jsonify({
            'user': new_user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201

    except Exception:
        db.session.rollback()
        logger.exception("register() – DB error for email=%s", email)
        record_auth_failure(ip, email)
        return jsonify({'error': 'Registration failed. Please try again.'}), 500


# ==========================================================================
#  LOGIN
# ==========================================================================
@auth_bp.route('/login', methods=['POST'])
@auth_limit()
@auth_account_limit()
def login():
    ip = request.remote_addr or ""

    # 1. Schema validation (also gives us the email for backoff lookup)
    try:
        data = validate_login(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    email = data["email"]
    password = data["password"]

    # 2. Backoff check
    blocked = check_auth_backoff(ip, email)
    if blocked:
        return blocked

    # 3. Try DB authentication
    authenticated = False
    user_dict = None
    try:
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8')):
            authenticated = True
            user_dict = user.to_dict()
    except Exception:
        logger.exception("login() – DB error for email=%s", email)
        # Fall through to JSON fallback

    if authenticated and user_dict:
        record_auth_success(ip, email)
        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)
        return jsonify({
            'user': user_dict,
            'access_token': access_token,
            'refresh_token': refresh_token
        })

    # 4. JSON fallback (legacy – remove once all users are in DB)
    users_json = _load_users_json()
    if email in users_json:
        user_data = users_json[email]
        stored_pw = user_data.get('password', '')
        is_match = False
        if stored_pw.startswith('$2b$'):
            try:
                is_match = bcrypt.checkpw(password.encode('utf-8'), stored_pw.encode('utf-8'))
            except Exception:
                pass
        else:
            # Plain-text legacy password – constant-time comparison not feasible here;
            # these accounts should be migrated to hashed ASAP.
            is_match = (password == stored_pw)

        if is_match:
            record_auth_success(ip, email)
            # Auto-migrate legacy user into SQL DB so relationships (closet, likes, recs) work seamlessly
            db_user = None
            try:
                db_user = User.query.filter_by(email=email).first()
                if not db_user:
                    hashed_pw = stored_pw if stored_pw.startswith('$2b$') else bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    db_user = User(
                        name=user_data.get('name', 'User'),
                        email=email,
                        hashed_password=hashed_pw,
                        gender=user_data.get('gender', 'female'),
                        member_since=user_data.get('memberSince', 'March 2026'),
                        is_admin=bool(user_data.get('is_admin', False)),
                        role=user_data.get('role', 'user')
                    )
                    db.session.add(db_user)
                    db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning("Auto-migration of legacy user to DB failed: %s", e)

            user_payload = db_user.to_dict() if db_user else {
                'id': 0,
                'name': user_data['name'],
                'email': email,
                'gender': user_data.get('gender', 'female'),
                'member_since': user_data.get('memberSince', 'March 2026'),
                'is_admin': bool(user_data.get('is_admin', False)),
                'role': user_data.get('role', 'user'),
            }
            access_token = create_access_token(identity=email)
            refresh_token = create_refresh_token(identity=email)
            return jsonify({
                'user': user_payload,
                'access_token': access_token,
                'refresh_token': refresh_token,
            })

    # 5. Both paths failed – record failure and return generic message
    record_auth_failure(ip, email)
    return jsonify({'error': 'Invalid email or password.'}), 401


# ==========================================================================
#  REFRESH
# ==========================================================================
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return jsonify({'access_token': access_token})


# ==========================================================================
#  PROFILE
# ==========================================================================
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
@authed_limit()
def profile():
    email = get_jwt_identity()

    try:
        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({'user': user.to_dict()})
    except Exception:
        logger.exception("profile() – DB error for email=%s", email)

    users_json = _load_users_json()
    if email in users_json:
        u = users_json[email]
        return jsonify({
            'user': {
                'id': 0,
                'name': u['name'],
                'email': email,
                'gender': u.get('gender', 'female'),
                'member_since': u.get('memberSince', 'March 2026'),
                'is_admin': bool(u.get('is_admin', False)),
                'role': u.get('role', 'user'),
            }
        })

    return jsonify({'error': 'User not found.'}), 404


# ==========================================================================
#  PASSWORD RECOVERY
# ==========================================================================

@auth_bp.route('/forgot-password', methods=['POST'])
@auth_limit()
@auth_account_limit()
def forgot_password():
    try:
        data = validate_forgot_password(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    email = data["email"]
    # Generic success message to prevent email enumeration
    _GENERIC_OK = (
        f"If an account exists for {email}, a password reset link has been sent. "
        "Please check your inbox (and spam folder) within the next few minutes."
    )

    base_url = (os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')).rstrip('/')

    try:
        user = User.query.filter_by(email=email).first()
    except Exception:
        logger.exception("forgot_password() – DB error for email=%s", email)
        return jsonify({'message': _GENERIC_OK}), 200

    if user is None:
        return jsonify({'message': _GENERIC_OK}), 200

    try:
        token, expires_at = generate_reset_token(user.email)
        user.reset_token = token
        user.reset_token_expires_at = expires_at
        db.session.commit()

        reset_url = f"{base_url}/reset-password?token={token}"
        ok, mode, err = send_password_reset_email(user.email, user.name, reset_url)
        if not ok:
            logger.error("forgot_password() – SMTP failed for email=%s: %s", user.email, err)
            db.session.rollback()

        payload = {
            'message': _GENERIC_OK,
            'expires_minutes': int(os.environ.get('PASSWORD_RESET_TTL_MIN', 30)),
        }
        # Only expose the reset URL in dev mode (never in production)
        if mode == 'dev_mode_print':
            payload['dev_reset_url'] = reset_url
        return jsonify(payload), 200

    except Exception:
        logger.exception("forgot_password() – unexpected error for email=%s", email)
        db.session.rollback()
        return jsonify({'message': _GENERIC_OK}), 200


@auth_bp.route('/validate-reset-token', methods=['POST'])
@auth_limit()
def validate_reset_token_endpoint():
    try:
        data = validate_reset_token_req(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    token = data["token"]
    email = validate_reset_token(token)
    if not email:
        return jsonify({'valid': False, 'error': 'Reset link is invalid or has expired.'}), 400

    try:
        user = User.query.filter_by(email=email, reset_token=token).first()
        if not user or not user.reset_token_expires_at:
            return jsonify({'valid': False, 'error': 'Reset link is no longer valid.'}), 400

        if user.reset_token_expires_at.tzinfo is None:
            user.reset_token_expires_at = user.reset_token_expires_at.replace(tzinfo=timezone.utc)
        if user.reset_token_expires_at < datetime.now(timezone.utc):
            return jsonify({'valid': False, 'error': 'Reset link has expired. Please request a new one.'}), 400

        return jsonify({
            'valid': True,
            'email': email,
            'user_name': user.name,
            'expires_at_iso': user.reset_token_expires_at.isoformat()
        })
    except Exception:
        logger.exception("validate_reset_token_endpoint() – DB error")
        return jsonify({'valid': False, 'error': 'Unable to validate token. Please try again.'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
@auth_limit()
def reset_password():
    try:
        data = validate_reset_password(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    token = data["token"]
    new_password = data["password"]

    ok_pw, pw_msg = _strong_password(new_password)
    if not ok_pw:
        return jsonify({'error': pw_msg}), 400

    email = validate_reset_token(token)
    if not email:
        return jsonify({'error': 'Reset link is invalid or has expired.'}), 400

    try:
        user = User.query.filter_by(email=email, reset_token=token).first()
        if not user or not user.reset_token_expires_at:
            return jsonify({'error': 'Reset link is no longer valid.'}), 400

        if user.reset_token_expires_at.tzinfo is None:
            user.reset_token_expires_at = user.reset_token_expires_at.replace(tzinfo=timezone.utc)
        if user.reset_token_expires_at < datetime.now(timezone.utc):
            return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400

        if bcrypt.checkpw(new_password.encode('utf-8'), user.hashed_password.encode('utf-8')):
            return jsonify({'error': 'New password cannot be the same as your current password.'}), 400

        user.hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.reset_token = None
        user.reset_token_expires_at = None
        user.updated_at = datetime.utcnow()
        db.session.commit()

        # Reset any backoff on this account since password is now changed
        record_auth_success("", email)

        return jsonify({
            'message': 'Password updated successfully. You can now log in with your new password.',
        })
    except Exception:
        logger.exception("reset_password() – DB error for email=%s", email)
        db.session.rollback()
        return jsonify({'error': 'Password reset failed. Please try again.'}), 500


# ==========================================================================
#  TEST ENDPOINT (authenticated)
# ==========================================================================
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200
