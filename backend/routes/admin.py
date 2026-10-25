"""
admin.py – Admin routes for Fashion Pro.

Fixed: admin access + user listing now also consult the legacy users.json
fallback so accounts that only exist there (e.g. the seeded admin) are
recognised as admins and appear in the user table.
"""
import json
import os

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

from config.db import db
from models.user import User
from models.feedback import Feedback

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.json')


def _load_users_json():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _lookup_user(email):
    """Return (user_obj_or_dict, is_admin_bool) checking DB first, then JSON."""
    user = User.query.filter_by(email=email).first() if email else None
    if user:
        return user, bool(user.is_admin or user.role == 'admin')
    users_json = _load_users_json()
    if email in users_json:
        u = users_json[email]
        return u, bool(u.get('is_admin') or u.get('role') == 'admin')
    return None, False


def _all_users():
    """Merge DB users with JSON-only users (DB takes precedence on email)."""
    seen = set()
    result = []
    for u in User.query.order_by(User.created_at.desc()).all():
        result.append(u.to_dict())
        seen.add(u.email)
    for email, u in _load_users_json().items():
        if email in seen:
            continue
        result.append({
            'id': 0,
            'name': u.get('name', ''),
            'email': email,
            'gender': u.get('gender', 'female'),
            'member_since': u.get('memberSince', 'March 2026'),
            'avatar_url': None,
            'is_admin': bool(u.get('is_admin', False)),
            'role': u.get('role', 'user'),
        })
    return result


def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        email = get_jwt_identity()
        _user, is_admin = _lookup_user(email)
        if not _user or not is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    json_count = len(_load_users_json())
    db_count = User.query.count()
    # Dedupe: JSON users that also exist in DB should not double-count
    json_emails = set(_load_users_json().keys())
    db_emails = {u.email for u in User.query.all()}
    total_users = len(json_emails | db_emails)
    feedback_count = Feedback.query.count()
    return jsonify({
        'total_users': total_users,
        'total_feedback': feedback_count
    })


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    return jsonify(_all_users())


@admin_bp.route('/feedback', methods=['GET'])
@admin_required
def get_feedback():
    feedbacks = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify([f.to_dict() for f in feedbacks])