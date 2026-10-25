"""
closet.py – Closet management routes for Fashion Pro.

File-upload safety controls:
  - Extension allowlist (ALLOWED_EXTENSIONS).
  - Magic-byte content validation (imghdr / Pillow) – not just extension.
  - File size capped at MAX_UPLOAD_BYTES (configurable via env).
  - Stored outside the web root in CLOSET_UPLOAD_DIR (not served directly).
  - Served only through an authenticated, ownership-checked endpoint.
  - Filenames are always re-generated (UUID) – original name sanitised but
    never used to derive a serve-path.
  - Files are NEVER executed; they are only read as images by Pillow.

Input validation controls:
  - All form / JSON fields are validated via middleware.validators schemas.
  - Enum fields are checked against whitelists.
  - String fields are length-capped.
"""
import io
import logging
import os
import uuid

from flask import Blueprint, request, jsonify, abort, make_response, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from config.db import db
from models.closet import ClosetItem
from models.user import User
from utils.color_utils import extract_full_palette
from middleware.rate_limiter import authed_limit
from middleware.validators import (
    ValidationError,
    validate_closet_item_json, validate_closet_item_form,
    validate_closet_item_update, validate_availability,
    validate_capsule_generate,
)

logger = logging.getLogger(__name__)

closet_bp = Blueprint('closet', __name__, url_prefix='/api/closet')

# ---------------------------------------------------------------------------
# Upload constraints (all configurable via env)
# ---------------------------------------------------------------------------
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Magic bytes that identify the permitted image formats
_MAGIC_SIGNATURES = {
    b'\xff\xd8\xff':        'jpeg',   # JPEG
    b'\x89PNG\r\n\x1a\n':  'png',    # PNG
    b'RIFF':                'webp',   # WebP (prefix only – verified below)
    b'GIF87a':              'gif',
    b'GIF89a':              'gif',
}

MAX_UPLOAD_BYTES = int(os.environ.get('CLOSET_MAX_UPLOAD_BYTES', 8 * 1024 * 1024))  # 8 MB

# Storage location – OUTSIDE the web-root static files directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
CLOSET_UPLOAD_DIR = os.path.join(IMAGES_DIR, 'closet')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extension_allowed(filename):
    return (
        '.' in filename
        and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def _validate_image_content(file_storage):
    """
    Read the first few bytes to verify the file is actually a valid image
    (magic-byte check), then verify it can be decoded by Pillow.
    Returns (ok: bool, error_message: str | None, file_bytes: bytes).
    """
    try:
        file_bytes = file_storage.read(MAX_UPLOAD_BYTES + 1)
    except Exception:
        return False, "Failed to read uploaded file.", b""

    if len(file_bytes) > MAX_UPLOAD_BYTES:
        return False, f"File exceeds maximum allowed size ({MAX_UPLOAD_BYTES // (1024*1024)} MB).", b""

    if len(file_bytes) < 8:
        return False, "Uploaded file is too small to be a valid image.", b""

    # Magic-byte check
    matched_fmt = None
    for magic, fmt in _MAGIC_SIGNATURES.items():
        if file_bytes[:len(magic)] == magic:
            matched_fmt = fmt
            break

    if matched_fmt is None:
        return False, "File content does not match an allowed image format.", b""

    # WebP: bytes 8-11 must be 'WEBP'
    if matched_fmt == 'webp' and file_bytes[8:12] != b'WEBP':
        return False, "File content does not match an allowed image format.", b""

    # Pillow decode check – ensures the data is a valid, decodeable image
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()      # raises on corrupt / truncated images
    except Exception:
        return False, "Uploaded file could not be decoded as a valid image.", b""

    return True, None, file_bytes


def _require_user_id():
    """Return the DB user_id for the current JWT identity, auto-provisioning if needed."""
    email = get_jwt_identity()
    if not email:
        return None
    user = User.query.filter_by(email=str(email)).first()
    if user:
        return user.id

    # Auto-provision user in DB so closet storage and outfit generation always work
    try:
        import json, bcrypt
        users_file = os.path.join(BACKEND_DIR, 'users.json')
        user_name = str(email).split('@')[0].capitalize()
        gender = 'female'
        role = 'user'
        is_admin = False
        member_since = 'March 2026'
        hashed_pw = bcrypt.hashpw(b"temporary_secure_pass", bcrypt.gensalt()).decode('utf-8')
        if os.path.exists(users_file):
            try:
                with open(users_file, 'r') as f:
                    u_dict = json.load(f)
                    if email in u_dict:
                        user_name = u_dict[email].get('name', user_name)
                        gender = u_dict[email].get('gender', 'female')
                        role = u_dict[email].get('role', 'user')
                        is_admin = bool(u_dict[email].get('is_admin', False))
                        member_since = u_dict[email].get('memberSince', member_since)
                        stored_pw = u_dict[email].get('password', '')
                        if stored_pw.startswith('$2b$'):
                            hashed_pw = stored_pw
                        elif stored_pw:
                            hashed_pw = bcrypt.hashpw(stored_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            except Exception:
                pass

        new_user = User(
            name=user_name,
            email=str(email),
            hashed_password=hashed_pw,
            gender=gender,
            is_admin=is_admin,
            role=role,
            member_since=member_since
        )
        db.session.add(new_user)
        db.session.commit()
        return new_user.id
    except Exception as e:
        db.session.rollback()
        logger.warning("Could not auto-provision user %s: %s", email, e)
        u = User.query.filter_by(email=str(email)).first()
        return u.id if u else None


def _to_posix(path):
    if not path:
        return path
    return path.replace(os.sep, '/').replace('\\', '/')


def _serialize(item):
    data = item.to_dict()
    image_url = _to_posix(data.get('image_url') or '')
    if image_url.startswith('/images/closet/'):
        data['image_url'] = f'/api/closet/items/{item.id}/image'
    else:
        data['image_url'] = image_url
    return data


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@closet_bp.route('/items', methods=['GET'])
@jwt_required()
@authed_limit()
def get_items():
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    category = request.args.get('category', '')
    occasion = request.args.get('occasion', '')
    season = request.args.get('season', '')
    q = (request.args.get('q', '') or '').strip().lower()

    query = ClosetItem.query.filter_by(user_id=user_id)
    if category and category != 'all':
        query = query.filter_by(category=category)
    if occasion and occasion != 'all':
        query = query.filter(ClosetItem.occasion.in_([occasion, 'all']))
    if season and season != 'all':
        query = query.filter(ClosetItem.season.in_([season, 'all-season']))
    if q:
        like = f"%{q}%"
        query = query.filter(
            (ClosetItem.name.ilike(like))
            | (ClosetItem.color_name.ilike(like))
            | (ClosetItem.sub_category.ilike(like))
            | (ClosetItem.category.ilike(like))
            | (ClosetItem.occasion.ilike(like))
            | (ClosetItem.season.ilike(like))
            | (ClosetItem.brand.ilike(like))
            | (ClosetItem.pattern.ilike(like))
            | (ClosetItem.style.ilike(like))
        )

    items = query.order_by(ClosetItem.created_at.desc()).all()

    all_user_items = ClosetItem.query.filter_by(user_id=user_id).all()
    counts = {
        'total': len(all_user_items),
        'top': sum(1 for i in all_user_items if i.category == 'top'),
        'bottom': sum(1 for i in all_user_items if i.category == 'bottom'),
        'dress': sum(1 for i in all_user_items if i.category == 'dress'),
        'outerwear': sum(1 for i in all_user_items if i.category == 'outerwear'),
        'shoes': sum(1 for i in all_user_items if i.category == 'shoes'),
        'accessory': sum(1 for i in all_user_items if i.category == 'accessory'),
    }

    return jsonify({
        'items': [_serialize(i) for i in items],
        'counts': counts,
        'user_id': user_id,
    }), 200


@closet_bp.route('/items', methods=['POST'])
@jwt_required()
@authed_limit()
def add_item():
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    image_url = ""
    saved_file_path = None
    color_name = ""
    color_hex = ""

    # ------------------------------------------------------------------
    # Branch A: multipart file upload
    # ------------------------------------------------------------------
    if 'image' in request.files:
        try:
            fields = validate_closet_item_form(request.form)
        except ValidationError as ve:
            return ve.to_response()

        name = fields["name"]
        category = fields["category"]
        sub_category = fields["sub_category"]
        occasion = fields["occasion"]
        season = fields["season"]
        brand = fields["brand"]
        color_name = fields["color_name"]
        color_hex = fields["color_hex"]
        secondary_color_name = fields.get("secondary_color_name", "")
        pattern = fields.get("pattern", "solid")
        style = fields.get("style", "casual")
        notes = fields.get("notes", "")
        is_available = True

        file = request.files['image']

        if not file or not file.filename:
            return jsonify({'error': 'No file selected.'}), 400

        if not _extension_allowed(file.filename):
            return jsonify({'error': 'File type not allowed. Please upload a PNG, JPG, JPEG, or WEBP image.'}), 400

        ok, err_msg, file_bytes = _validate_image_content(file)
        if not ok:
            return jsonify({'error': err_msg}), 400

        # Save with a UUID-based filename – never trust the original name for storage
        safe_base = secure_filename(file.filename) or 'item.jpg'
        ext = safe_base.rsplit('.', 1)[-1].lower() if '.' in safe_base else 'jpg'
        filename = f"closet_{uuid.uuid4().hex}_{uuid.uuid4().hex[:4]}.{ext}"
        os.makedirs(CLOSET_UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(CLOSET_UPLOAD_DIR, filename)

        with open(file_path, 'wb') as fout:
            fout.write(file_bytes)

        saved_file_path = os.path.abspath(file_path)

        # Always extract colors first while we have the local file
        if not color_name or not color_hex:
            try:
                detected_name, detected_hex, _, _swatches = extract_full_palette(saved_file_path, k=5)
                color_name = detected_name or color_name or "Classic Neutral"
                color_hex = detected_hex or color_hex or "#4A5568"
            except Exception:
                logger.warning("Auto colour extract failed for %s", saved_file_path)

        use_cloudinary = os.environ.get('USE_CLOUDINARY', 'False').lower() in ('1', 'true', 'yes')
        
        if use_cloudinary:
            cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
            if not cloud_name:
                logger.error("USE_CLOUDINARY is True but CLOUDINARY_CLOUD_NAME is not configured.")
                try:
                    os.remove(saved_file_path)
                except Exception:
                    pass
                return jsonify({'error': 'Cloud storage is enabled but CLOUDINARY credentials are missing in server environment.'}), 500

            try:
                import cloudinary.uploader
                upload_result = cloudinary.uploader.upload(
                    saved_file_path,
                    folder="fashion_pro_closet",
                    resource_type="image"
                )
                image_url = upload_result.get("secure_url")
                # Remove temporary local file after successful upload
                try:
                    os.remove(saved_file_path)
                except Exception:
                    pass
            except Exception as e:
                logger.error("Cloudinary upload failed: %s", e)
                try:
                    os.remove(saved_file_path)
                except Exception:
                    pass
                return jsonify({'error': f'Image upload to cloud failed: {str(e)}'}), 500
        else:
            image_url = _to_posix(f"/images/closet/{filename}")

    # ------------------------------------------------------------------
    # Branch B: JSON body with optional image_url reference
    # ------------------------------------------------------------------
    else:
        try:
            fields = validate_closet_item_json(request.get_json(silent=True) or {})
        except ValidationError as ve:
            return ve.to_response()

        name = fields["name"]
        category = fields["category"]
        sub_category = fields["sub_category"]
        occasion = fields["occasion"]
        season = fields["season"]
        brand = fields["brand"]
        color_name = fields["color_name"]
        color_hex = fields["color_hex"]
        secondary_color_name = fields.get("secondary_color_name", "")
        pattern = fields.get("pattern", "solid")
        style = fields.get("style", "casual")
        notes = fields.get("notes", "")
        is_available = bool(fields.get("is_available", True))
        image_url = _to_posix(fields.get("image_url") or "/images/classic_denim.jpg")

    # Smart descriptive naming if user left name blank or generic
    if not name or name.strip().lower() in ('', 'my garment', 'my top', 'my bottom', 'my dress', 'my outerwear', 'my shoes', 'my accessory'):
        display_color = color_name or "Classic"
        display_sub = sub_category.capitalize() if sub_category else category.capitalize()
        name = f"{display_color} {display_sub}"

    new_item = ClosetItem(
        user_id=user_id,
        name=name,
        category=category,
        sub_category=sub_category,
        color_name=color_name or "Classic Neutral",
        color_hex=color_hex or "#4A5568",
        secondary_color_name=secondary_color_name or None,
        pattern=pattern or 'solid',
        style=style or 'casual',
        occasion=occasion,
        season=season,
        is_available=is_available,
        image_url=image_url,
        brand=brand,
        notes=notes or None,
    )
    try:
        db.session.add(new_item)
        db.session.commit()
    except Exception:
        db.session.rollback()
        # Remove the orphaned uploaded file if the DB write failed
        try:
            if saved_file_path and os.path.isfile(saved_file_path):
                os.remove(saved_file_path)
        except Exception:
            pass
        logger.exception("Failed to save closet item")
        return jsonify({'error': 'Could not save the item. Please try again.'}), 500

    return jsonify({
        'message': 'Closet item saved successfully!',
        'item': _serialize(new_item),
    }), 201


@closet_bp.route('/items/<int:item_id>/image', methods=['GET'])
@jwt_required()
@authed_limit()
def get_item_image(item_id):
    """Serve a closet image – only to the item's owner."""
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    item = ClosetItem.query.filter_by(id=item_id, user_id=user_id).first()
    image_url = _to_posix(item.image_url or '') if item else ''
    if not item or not image_url.startswith('/images/closet/'):
        abort(404)

    # Derive filename only from the stored URL (never from user input)
    filename = os.path.basename(image_url)
    image_path = os.path.join(CLOSET_UPLOAD_DIR, filename)

    # Path-traversal guard
    if not os.path.abspath(image_path).startswith(os.path.abspath(CLOSET_UPLOAD_DIR)):
        abort(404)

    if not os.path.isfile(image_path):
        abort(404)

    response = make_response(send_file(image_path, conditional=True))
    response.headers['Cache-Control'] = 'private, no-store'
    return response


@closet_bp.route('/items/<int:item_id>', methods=['GET'])
@jwt_required()
@authed_limit()
def get_item(item_id):
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404
    item = ClosetItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found.'}), 404
    return jsonify({'item': _serialize(item)}), 200


@closet_bp.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
@authed_limit()
def update_item(item_id):
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    item = ClosetItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found.'}), 404

    try:
        fields = validate_closet_item_update(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    for key, value in fields.items():
        setattr(item, key, value)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("Failed to update closet item %d", item_id)
        return jsonify({'error': 'Could not update the item. Please try again.'}), 500

    return jsonify({'message': 'Item updated successfully.', 'item': _serialize(item)}), 200


@closet_bp.route('/items/<int:item_id>/availability', methods=['PATCH'])
@jwt_required()
@authed_limit()
def set_availability(item_id):
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    item = ClosetItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found.'}), 404

    try:
        data = validate_availability(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    item.is_available = data['is_available']
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Could not update availability.'}), 500

    return jsonify({'message': 'Availability updated.', 'item': _serialize(item)}), 200


@closet_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
@authed_limit()
def delete_item(item_id):
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    item = ClosetItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found.'}), 404

    # Best-effort removal of the physical file
    try:
        if item.image_url and item.image_url.startswith('/images/closet/'):
            fname = item.image_url[len('/images/closet/'):]
            fpath = os.path.join(CLOSET_UPLOAD_DIR, fname)
            # Path-traversal guard
            if os.path.abspath(fpath).startswith(os.path.abspath(CLOSET_UPLOAD_DIR)):
                if os.path.isfile(fpath):
                    os.remove(fpath)
        elif item.image_url and 'res.cloudinary.com' in item.image_url:
            import cloudinary.uploader
            parts = item.image_url.split('/upload/')
            if len(parts) > 1:
                path_parts = parts[1].split('/')
                if path_parts[0].startswith('v') and path_parts[0][1:].isdigit():
                    path_parts = path_parts[1:]
                public_id = '/'.join(path_parts).rsplit('.', 1)[0]
                cloudinary.uploader.destroy(public_id)
    except Exception as e:
        logger.warning("Could not remove image for closet item %d: %s", item_id, e)

    db.session.delete(item)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("Failed to delete closet item %d", item_id)
        return jsonify({'error': 'Could not delete the item.'}), 500
    return jsonify({'message': 'Item deleted successfully.'}), 200


@closet_bp.route('/capsule-generate', methods=['POST'])
@jwt_required()
@authed_limit()
def generate_capsules():
    """Generate intelligent outfit combinations from the user's closet."""
    user_id = _require_user_id()
    if not user_id:
        return jsonify({'error': 'User not found. Please log in again.'}), 404

    try:
        data = validate_capsule_generate(request.get_json(silent=True) or {})
    except ValidationError as ve:
        return ve.to_response()

    target_occasion = data["occasion"]
    target_season = data["season"]

    items = ClosetItem.query.filter_by(user_id=user_id).all()
    # Only available items are used for outfit building
    available = [i for i in items if i.is_available is not False]

    def _season_ok(a_season, target):
        if target in ('', 'all', 'all-season'):
            return True
        return a_season in (target, 'all-season', 'all')

    def _occasion_ok(a_occasion, target):
        if target in ('', 'all'):
            return True
        return a_occasion in (target, 'all')

    available = [i for i in available if _occasion_ok(i.occasion, target_occasion) and _season_ok(i.season, target_season)]

    tops = [i for i in available if i.category == 'top']
    bottoms = [i for i in available if i.category == 'bottom']
    dresses = [i for i in available if i.category == 'dress']
    outerwear = [i for i in available if i.category == 'outerwear']
    shoes = [i for i in available if i.category == 'shoes']
    accessories = [i for i in available if i.category == 'accessory']

    # Graceful fallback: if the requested occasion/season filters everything
    # out, fall back to the full available closet so the user still gets
    # useful combinations instead of an empty result.
    if not tops and not bottoms and not dresses:
        fallback_items = [i for i in ClosetItem.query.filter_by(user_id=user_id).all()
                          if i.is_available is not False]
        tops = [i for i in fallback_items if i.category == 'top']
        bottoms = [i for i in fallback_items if i.category == 'bottom']
        dresses = [i for i in fallback_items if i.category == 'dress']
        outerwear = outerwear or [i for i in fallback_items if i.category == 'outerwear']
        shoes = shoes or [i for i in fallback_items if i.category == 'shoes']
        accessories = accessories or [i for i in fallback_items if i.category == 'accessory']

    def _colors_compatible(hex_a, hex_b):
        """Lightweight color-theory check: neutral pairs always work;
        same-family, analogous (<40°) and complementary (150–210°) hues pair."""
        try:
            from utils.fashion_color_harmony import (
                hex_to_hsl, is_fashion_neutral, hue_distance,
            )
            h1, s1, l1 = hex_to_hsl(hex_a)
            h2, s2, l2 = hex_to_hsl(hex_b)
            if is_fashion_neutral(h1, s1, l1) or is_fashion_neutral(h2, s2, l2):
                return True
            d = hue_distance(h1, h2)
            return d <= 40 or 150 <= d <= 210 or abs(l1 - l2) > 0.55
        except Exception:
            return True

    outfits = []

    for top in tops[:4]:
        for bot in bottoms[:4]:
            score = 0

            # ── 1. COLOR HARMONY (35 pts) – most important in fashion ───
            if top.color_hex and bot.color_hex:
                if _colors_compatible(top.color_hex, bot.color_hex):
                    score += 35
                else:
                    score += 8   # color clash – heavily penalised
            else:
                score += 20  # no data → neutral assumption

            # Exact same color = monotone (stylish but monotonous)
            if (top.color_name and bot.color_name
                    and top.color_name.lower() == bot.color_name.lower()):
                score -= 10

            # ── 2. OCCASION COMPATIBILITY (25 pts) ─────────────────────
            if top.occasion and bot.occasion:
                if top.occasion == bot.occasion:
                    score += 25
                elif 'all' in (top.occasion, bot.occasion):
                    score += 18
                elif (top.occasion, bot.occasion) in (
                    ('casual', 'office'), ('office', 'casual')
                ):
                    score += 10  # tolerable mix
                # else 0 – mismatched vibe

            # ── 3. SEASON MATCH (15 pts) ────────────────────────────────
            if top.season and bot.season:
                if (top.season == bot.season
                        or 'all' in (top.season, bot.season)
                        or 'all-season' in (top.season, bot.season)):
                    score += 15
                else:
                    score += 4  # cross-season

            # ── 4. STYLE COHESION (15 pts) ──────────────────────────────
            if top.style and bot.style:
                if top.style == bot.style:
                    score += 15
                elif (top.style, bot.style) in {
                    ('casual', 'streetwear'), ('streetwear', 'casual'),
                    ('smart', 'office'), ('office', 'smart'),
                    ('formal', 'office'), ('office', 'formal'),
                }:
                    score += 8
                else:
                    score += 2

            # ── 5. VARIETY OFFSET (10 pts) ──────────────────────────────
            # Deterministic per-pair variance so every combo is distinct.
            # Same pair → same score every time (reproducible).
            pair_hash = ((top.id or 0) * 7 + (bot.id or 0) * 13) % 10
            score += pair_hash

            # Accessory completeness bonus
            if shoes:       score += 3
            if accessories: score += 2

            # Clamp: real synergy never claims 100%; max display is 97
            final_score = max(42, min(97, score))

            outfits.append({
                'id': f"outfit_{top.id}_{bot.id}",
                'title': f"{top.color_name} {top.name} + {bot.name}",
                'type': 'Two-Piece Ensemble',
                'occasion': top.occasion if top.occasion != 'all' else bot.occasion,
                'synergy_score': final_score,
                'top': _serialize(top),
                'bottom': _serialize(bot),
                'outerwear': _serialize(outerwear[0]) if outerwear else None,
                'shoes': _serialize(shoes[0]) if shoes else None,
                'accessory': _serialize(accessories[0]) if accessories else None,
                'styling_tip': (
                    f"Pair this {top.color_name} {top.name} with clean "
                    f"{bot.color_name} lines for an effortless {top.occasion} look."
                ),
            })

    for dr in dresses[:3]:
        # Dress synergy: color richness + occasion weight + variety offset
        dr_score = 55
        if dr.color_hex:                           dr_score += 15
        if dr.occasion and dr.occasion != 'all':   dr_score += 12
        if shoes:                                  dr_score += 5
        if accessories:                            dr_score += 4
        dr_score += ((dr.id or 0) * 11) % 9       # variety offset
        dr_score = max(50, min(96, dr_score))

        outfits.append({
            'id': f"outfit_dress_{dr.id}",
            'title': f"{dr.color_name} {dr.name} Statement",
            'type': 'One-Piece Statement',
            'occasion': dr.occasion,
            'synergy_score': dr_score,
            'dress': _serialize(dr),
            'outerwear': _serialize(outerwear[0]) if outerwear else None,
            'shoes': _serialize(shoes[0]) if shoes else None,
            'accessory': _serialize(accessories[0]) if accessories else None,
            'styling_tip': f"Elevate your {dr.name} with minimalist accents and sleek layering.",
        })

    # If tops exist but no bottoms exist (or vice-versa), generate curated pairing looks
    if tops and not bottoms:
        for top in tops[:4]:
            outfits.append({
                'id': f"outfit_top_rec_{top.id}",
                'title': f"{top.color_name} {top.name} + Essential Dark Trouser",
                'type': 'Wardrobe Pairing Look',
                'occasion': top.occasion if top.occasion != 'all' else 'Casual',
                'synergy_score': 90,
                'top': _serialize(top),
                'bottom': {
                    'name': 'Neutral Straight-Leg Trouser',
                    'color_name': 'Charcoal / Navy',
                    'color_hex': '#1E293B',
                    'category': 'bottom',
                    'is_recommended': True,
                    'image_url': '/images/classic_denim.jpg'
                },
                'outerwear': _serialize(outerwear[0]) if outerwear else None,
                'shoes': _serialize(shoes[0]) if shoes else None,
                'accessory': _serialize(accessories[0]) if accessories else None,
                'styling_tip': f"Pair this {top.color_name} {top.name} with structured dark trousers for an elongated silhouette."
            })

    elif bottoms and not tops:
        for bot in bottoms[:4]:
            outfits.append({
                'id': f"outfit_bot_rec_{bot.id}",
                'title': f"Crisp Oxford Top + {bot.color_name} {bot.name}",
                'type': 'Wardrobe Pairing Look',
                'occasion': bot.occasion if bot.occasion != 'all' else 'Casual',
                'synergy_score': 90,
                'top': {
                    'name': 'Crisp White Button-Down',
                    'color_name': 'Pure White',
                    'color_hex': '#FFFFFF',
                    'category': 'top',
                    'is_recommended': True,
                    'image_url': '/images/classic_denim.jpg'
                },
                'bottom': _serialize(bot),
                'outerwear': _serialize(outerwear[0]) if outerwear else None,
                'shoes': _serialize(shoes[0]) if shoes else None,
                'accessory': _serialize(accessories[0]) if accessories else None,
                'styling_tip': f"Elevate your {bot.name} with clean tucked-in tailoring and minimalist footwear."
            })

    missing_staples = []
    if not outerwear:
        missing_staples.append({
            'name': 'Camel Trench or Structured Black Blazer',
            'reason': 'Adding 1 tailored blazer would unlock 6+ new smart-casual and office outfits.',
        })
    if len(shoes) < 2:
        missing_staples.append({
            'name': 'Minimalist White Leather Sneakers',
            'reason': 'White sneakers seamlessly bridge casual and smart streetwear combinations.',
        })
    if len(tops) < 3:
        missing_staples.append({
            'name': 'Crisp White Oxford Button-down',
            'reason': 'An essential layering piece that works under sweaters, over tees, or solo.',
        })
    if len(bottoms) < 2:
        missing_staples.append({
            'name': 'Tailored Dark Indigo Denim / Charcoal Chinos',
            'reason': 'Versatile bottoms anchor tops across all casual and business casual looks.',
        })

    outfits.sort(key=lambda o: o.get('synergy_score', 0), reverse=True)

    # Calculate dominant wardrobe color palette and style blueprint
    colors_in_closet = [i.color_name for i in available if i.color_name]
    top_colors = list(dict.fromkeys(colors_in_closet))[:4]
    
    perfect_style = {
        'aesthetic': 'Modern Smart Minimalist' if len(tops) > 1 else 'Contemporary Everyday',
        'key_rule': f"Your wardrobe excels in {' & '.join(top_colors[:2]) if top_colors else 'classic neutrals'}. Anchor your looks with high-contrast layering.",
        'palette_summary': top_colors,
        'capsule_readiness': 'High (Complete Ensembles)' if len(outfits) >= 4 else 'Developing (Partial Looks)' if len(outfits) >= 1 else 'Starter'
    }

    return jsonify({
        'outfits': outfits[:12],
        'total_combinations': len(outfits),
        'missing_staples': missing_staples,
        'perfect_style': perfect_style,
    }), 200
