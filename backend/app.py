import os
import logging
from datetime import timedelta
from dotenv import load_dotenv
# Load environment variables first!
load_dotenv()

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config.db import init_db
import models.closet  # Ensure table creation
from middleware.rate_limiter import limiter
from middleware.error_handler import register_error_handlers
from routes.auth import auth_bp
from routes.gallery import gallery_bp
from routes.accessory import accessory_bp
from routes.recommendations import recommendations_bp
from routes.chat import chat_bp
from routes.user_dashboard import user_dashboard_bp
from routes.admin import admin_bp
from routes.feedback import feedback_bp
from routes.closet import closet_bp
from routes.search import search_bp

# ---------------------------------------------------------------------------
# Logging – structured server-side logs; never reaches the client
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
origins_env = os.getenv('CORS_ORIGINS')
if origins_env:
    allowed_origins = [origin.strip() for origin in origins_env.split(',')]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5001",
        "http://127.0.0.1:5001",
    ]
CORS(app, supports_credentials=True, resources={r"/*": {"origins": allowed_origins}})

# ---------------------------------------------------------------------------
# JWT Setup
# ---------------------------------------------------------------------------
_jwt_secret = os.getenv('JWT_SECRET')
_insecure_keys = {'super-secret-key-change-it', 'dev-key', 'super-secret-key-CHANGE-THIS-NOW'}
_is_prod = os.getenv('FLASK_ENV', '').lower() == 'production' or os.getenv('ENV', '').lower() == 'production' or not os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes')

if not _jwt_secret or _jwt_secret in _insecure_keys:
    if os.getenv('FLASK_ENV', '').lower() == 'production' or os.getenv('ENV', '').lower() == 'production':
        raise RuntimeError("FATAL SECURITY ERROR: JWT_SECRET is unset or using a known placeholder in production! Refusing to start.")
    logger.warning(
        "SECURITY WARNING: JWT_SECRET is not set or is using a known default placeholder. "
        "Set a strong random JWT_SECRET in backend/.env for production safety."
    )
app.config['JWT_SECRET_KEY'] = _jwt_secret or 'dev-fashion-pro-secret-local-override'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_HOURS', 24)))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_DAYS', 30)))
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# ---------------------------------------------------------------------------
# Upload size limit (default 16 MB, overridable via env)
# ---------------------------------------------------------------------------
_max_mb = int(os.getenv('MAX_CONTENT_LENGTH_MB', 16))
app.config['MAX_CONTENT_LENGTH'] = _max_mb * 1024 * 1024

# ---------------------------------------------------------------------------
# Initialise Flask-Limiter
# ---------------------------------------------------------------------------
limiter.init_app(app)

# ---------------------------------------------------------------------------
# JWT error handlers (generic messages – no internal detail to client)
# ---------------------------------------------------------------------------
@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({'error': 'Authorization token required.'}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({'error': 'Invalid authorization token.'}), 422

@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    return jsonify({'error': 'Session expired. Please log in again.'}), 401

# ---------------------------------------------------------------------------
# Database Setup
# ---------------------------------------------------------------------------
init_db(app)

# ---------------------------------------------------------------------------
# Static Image Serving
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
mime_types = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp', '.ico': 'image/x-icon',
}

@app.route('/images/<path:filename>')
def serve_images(filename):
    from werkzeug.security import safe_join
    from flask import make_response, abort, send_file
    # Block direct access to closet uploads (served via authenticated endpoint)
    if filename.replace('\\', '/').startswith('closet/'):
        abort(404)
    safe_path = safe_join(IMAGES_DIR, filename)
    if safe_path is None or not os.path.abspath(safe_path).startswith(os.path.abspath(IMAGES_DIR)):
        abort(404)
    relative_path = os.path.relpath(safe_path, IMAGES_DIR).replace(os.sep, '/')
    if relative_path.startswith('closet/'):
        abort(404)
    if not os.path.isfile(safe_path):
        abort(404)
    ext = os.path.splitext(safe_path)[1].lower()
    resp = make_response(send_file(safe_path, mimetype=mime_types.get(ext, 'application/octet-stream')))
    resp.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    resp.headers['Timing-Allow-Origin'] = '*'
    return resp

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.route('/')
def health():
    return {"status": "active", "service": "Fashion Pro AI Backend"}

# ---------------------------------------------------------------------------
# Register Blueprints
# ---------------------------------------------------------------------------
app.register_blueprint(auth_bp)
app.register_blueprint(gallery_bp)
app.register_blueprint(accessory_bp)
app.register_blueprint(recommendations_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(user_dashboard_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(closet_bp)
app.register_blueprint(search_bp)

# ---------------------------------------------------------------------------
# Centralised error handlers (must be registered after blueprints)
# ---------------------------------------------------------------------------
register_error_handlers(app)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug_mode = os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes')
    if debug_mode:
        logger.warning("Running in DEBUG mode – disable before deploying to production.")
    print(f"🚀 Fashion Pro AI Backend running on http://127.0.0.1:{port}")
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
