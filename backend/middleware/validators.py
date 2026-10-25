"""
validators.py – Strict schema-based input validation for Fashion Pro API.

Every public-facing field is validated against an explicit schema:
  - type  (str, int, bool …)
  - max / min length / value bounds
  - format  (email regex, hex colour, enum whitelist …)

Validation *rejects* invalid input (returns 400) rather than sanitising it.
Sanitisation (HTML-escaping etc.) is left to the ORM / template layer.
"""

import re
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Compiled regexes
# ---------------------------------------------------------------------------
_EMAIL_RE = re.compile(r"^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$")
_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
_NAME_RE = re.compile(r"^[\w\s'\-\.]{1,100}$", re.UNICODE)  # letters, spaces, apostrophes, hyphens, dots
_TOKEN_RE = re.compile(r"^[\w.\-]{10,512}$")  # JWT / itsdangerous tokens

# Valid enum values
_GENDER_VALUES = {"male", "female", "other", "prefer_not_to_say"}
_CATEGORY_VALUES = {"top", "bottom", "dress", "outerwear", "shoes", "accessory"}
_OCCASION_VALUES = {"casual", "office", "formal", "sport", "evening", "all"}
_SEASON_VALUES = {"spring", "summer", "autumn", "fall", "winter", "all-season", "all"}
_BODY_TYPE_VALUES = {"hourglass", "pear", "apple", "rectangle", "inverted_triangle", ""}


# ---------------------------------------------------------------------------
# ValidationError
# ---------------------------------------------------------------------------
class ValidationError(Exception):
    """Raised when request data fails schema validation."""
    def __init__(self, message, field=None):
        super().__init__(message)
        self.message = message
        self.field = field

    def to_response(self):
        from flask import jsonify
        payload = {"error": self.message}
        if self.field:
            payload["field"] = self.field
        return jsonify(payload), 400


# ---------------------------------------------------------------------------
# Primitive validators (each raises ValidationError on failure)
# ---------------------------------------------------------------------------

def _require_str(value, field, min_len=0, max_len=1000):
    if not isinstance(value, str):
        raise ValidationError(f"'{field}' must be a string.", field)
    stripped = value.strip()
    if len(stripped) < min_len:
        raise ValidationError(f"'{field}' must be at least {min_len} character(s).", field)
    if len(stripped) > max_len:
        raise ValidationError(f"'{field}' must not exceed {max_len} characters.", field)
    return stripped


def _require_email(value, field="email"):
    s = _require_str(value, field, min_len=5, max_len=254)
    if not _EMAIL_RE.match(s):
        raise ValidationError("Please enter a valid email address.", field)
    return s.lower()


def _require_password(value, field="password"):
    """Type + length only — strength checked separately by _strong_password."""
    if not isinstance(value, str):
        raise ValidationError("'password' must be a string.", field)
    if len(value) < 8:
        raise ValidationError("Password must be at least 8 characters.", field)
    if len(value) > 128:
        raise ValidationError("Password must not exceed 128 characters.", field)
    return value


def _optional_str(value, field, max_len=200, default=""):
    if value is None:
        return default
    return _require_str(value, field, min_len=0, max_len=max_len)


def _optional_enum(value, field, valid_values, default=""):
    if value is None or value == "":
        return default
    s = _require_str(value, field, max_len=50).lower()
    if s not in valid_values:
        raise ValidationError(
            f"'{field}' must be one of: {', '.join(sorted(valid_values))}.",
            field,
        )
    return s


def _optional_hex_color(value, field, default=""):
    if not value:
        return default
    s = _require_str(value, field, max_len=7)
    if not _HEX_COLOR_RE.match(s):
        raise ValidationError(f"'{field}' must be a valid hex colour (e.g. #A3C1E0).", field)
    return s


def _require_token(value, field="token"):
    if not isinstance(value, str):
        raise ValidationError("Reset token is required.", field)
    s = value.strip()
    if not s or len(s) < 10 or len(s) > 512:
        raise ValidationError("Reset token is invalid.", field)
    return s


# ---------------------------------------------------------------------------
# Schema validators (each returns cleaned data or raises ValidationError)
# ---------------------------------------------------------------------------

def validate_register(data):
    """POST /api/auth/register"""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    return {
        "email":    _require_email(data.get("email"), "email"),
        "password": _require_password(data.get("password"), "password"),
        "name":     _require_str(data.get("name", ""), "name", min_len=1, max_len=100),
        "gender":   _optional_enum(data.get("gender"), "gender", _GENDER_VALUES, default="female"),
    }


def validate_login(data):
    """POST /api/auth/login"""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    # NOTE: do not enforce the 8-char minimum here — legacy/short passwords
    # should simply fail authentication (401), not be rejected as bad input.
    return {
        "email":    _require_email(data.get("email"), "email"),
        "password": _require_str(data.get("password"), "password", min_len=1, max_len=128),
    }


def validate_forgot_password(data):
    """POST /api/auth/forgot-password"""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    return {
        "email": _require_email(data.get("email"), "email"),
    }


def validate_reset_token_req(data):
    """POST /api/auth/validate-reset-token"""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    return {
        "token": _require_token(data.get("token"), "token"),
    }


def validate_reset_password(data):
    """POST /api/auth/reset-password"""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    return {
        "token":    _require_token(data.get("token"), "token"),
        "password": _require_password(data.get("password"), "password"),
    }


def validate_closet_item_json(data):
    """JSON fields accepted when adding a closet item without a file upload."""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    return {
        "name":         _optional_str(data.get("name"), "name", max_len=120),
        "category":     _optional_enum(data.get("category"), "category", _CATEGORY_VALUES, default="top"),
        "sub_category": _optional_str(data.get("sub_category"), "sub_category", max_len=80),
        "occasion":     _optional_enum(data.get("occasion"), "occasion", _OCCASION_VALUES, default="casual"),
        "season":       _optional_enum(data.get("season"), "season", _SEASON_VALUES, default="all-season"),
        "brand":        _optional_str(data.get("brand"), "brand", max_len=100),
        "color_name":   _optional_str(data.get("color_name"), "color_name", max_len=80),
        "color_hex":    _optional_hex_color(data.get("color_hex"), "color_hex"),
        "secondary_color_name": _optional_str(data.get("secondary_color_name"), "secondary_color_name", max_len=80),
        "pattern":      _optional_enum(data.get("pattern"), "pattern", {"solid", "striped", "checkered", "floral", "printed", "textured", "graphic", "plain"}, default="solid"),
        "style":        _optional_str(data.get("style"), "style", max_len=50),
        "notes":        _optional_str(data.get("notes"), "notes", max_len=500),
        "is_available": data.get("is_available") if isinstance(data.get("is_available"), bool) else True,
        "image_url":    _optional_str(data.get("image_url"), "image_url", max_len=500),
    }


def validate_closet_item_form(form):
    """Form fields accepted during multipart file upload."""
    return {
        "name":         _optional_str(form.get("name"), "name", max_len=120),
        "category":     _optional_enum(form.get("category"), "category", _CATEGORY_VALUES, default="top"),
        "sub_category": _optional_str(form.get("sub_category"), "sub_category", max_len=80),
        "occasion":     _optional_enum(form.get("occasion"), "occasion", _OCCASION_VALUES, default="casual"),
        "season":       _optional_enum(form.get("season"), "season", _SEASON_VALUES, default="all-season"),
        "brand":        _optional_str(form.get("brand"), "brand", max_len=100),
        "color_name":   _optional_str(form.get("color_name"), "color_name", max_len=80),
        "color_hex":    _optional_hex_color(form.get("color_hex"), "color_hex"),
        "secondary_color_name": _optional_str(form.get("secondary_color_name"), "secondary_color_name", max_len=80),
        "pattern":      _optional_enum(form.get("pattern"), "pattern", {"solid", "striped", "checkered", "floral", "printed", "textured", "graphic", "plain"}, default="solid"),
        "style":        _optional_str(form.get("style"), "style", max_len=50),
        "notes":        _optional_str(form.get("notes"), "notes", max_len=500),
    }


def validate_closet_item_update(data):
    """PUT/PATCH /api/closet/items/<id> — all fields optional, at least one required."""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    allowed = {}
    if 'name' in data:
        allowed['name'] = _optional_str(data.get('name'), 'name', max_len=120)
    if 'category' in data:
        allowed['category'] = _optional_enum(data.get('category'), 'category', _CATEGORY_VALUES, default='top')
    if 'sub_category' in data:
        allowed['sub_category'] = _optional_str(data.get('sub_category'), 'sub_category', max_len=80)
    if 'occasion' in data:
        allowed['occasion'] = _optional_enum(data.get('occasion'), 'occasion', _OCCASION_VALUES, default='casual')
    if 'season' in data:
        allowed['season'] = _optional_enum(data.get('season'), 'season', _SEASON_VALUES, default='all-season')
    if 'brand' in data:
        allowed['brand'] = _optional_str(data.get('brand'), 'brand', max_len=100)
    if 'color_name' in data:
        allowed['color_name'] = _optional_str(data.get('color_name'), 'color_name', max_len=80)
    if 'secondary_color_name' in data:
        allowed['secondary_color_name'] = _optional_str(data.get('secondary_color_name'), 'secondary_color_name', max_len=80)
    if 'color_hex' in data:
        allowed['color_hex'] = _optional_hex_color(data.get('color_hex'), 'color_hex')
    if 'pattern' in data:
        allowed['pattern'] = _optional_enum(data.get('pattern'), 'pattern', {'solid', 'striped', 'checkered', 'floral', 'printed', 'textured', 'graphic', 'plain'}, default='solid')
    if 'style' in data:
        allowed['style'] = _optional_str(data.get('style'), 'style', max_len=50)
    if 'notes' in data:
        allowed['notes'] = _optional_str(data.get('notes'), 'notes', max_len=500)
    if 'is_available' in data:
        if not isinstance(data['is_available'], bool):
            raise ValidationError("'is_available' must be true or false.", 'is_available')
        allowed['is_available'] = data['is_available']
    if not allowed:
        raise ValidationError("No updatable fields provided.")
    return allowed


def validate_availability(data):
    """PATCH /api/closet/items/<id>/availability"""
    if not isinstance(data, dict) or not isinstance(data.get('is_available'), bool):
        raise ValidationError("'is_available' must be a boolean (true/false).", 'is_available')
    return {'is_available': data['is_available']}


def validate_recommendations_query(data):
    """POST /api/recommendations"""
    if not isinstance(data, dict):
        data = {}
    return {
        "occasion":   _optional_enum(data.get("occasion"), "occasion", _OCCASION_VALUES | {"all"}, default="casual"),
        "body_type":  _optional_enum(data.get("body_type"), "body_type", _BODY_TYPE_VALUES, default=""),
        "gender":     _optional_enum(data.get("gender"), "gender", _GENDER_VALUES | {""}, default=""),
    }


def validate_capsule_generate(data):
    """POST /api/closet/capsule-generate"""
    if not isinstance(data, dict):
        data = {}
    return {
        "occasion": _optional_enum(data.get("occasion"), "occasion", _OCCASION_VALUES | {"all"}, default="all"),
        "season":   _optional_enum(data.get("season"), "season", _SEASON_VALUES | {"all"}, default="all"),
    }


def validate_search_query(args):
    """GET /api/search — query-string params"""
    q = _optional_str(args.get("q"), "q", max_len=200)
    return {"q": q}


def validate_chat_message(data):
    """POST /api/chat"""
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")
    message = _require_str(data.get("message", ""), "message", min_len=1, max_len=2000)
    return {"message": message}
