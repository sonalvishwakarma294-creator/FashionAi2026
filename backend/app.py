import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from the same directory as this file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config.db import init_db
from routes.auth import auth_bp
from routes.gallery import gallery_bp
from routes.accessory import accessory_bp
from routes.recommendations import recommendations_bp
from routes.chat import chat_bp
from routes.user_dashboard import user_dashboard_bp

app = Flask(__name__)
# Robust CORS configuration for development
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5001", "http://127.0.0.1:5001"]}})

# JWT Setup
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'super-secret-key-change-it')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({
        'error': 'Authorization token required',
        'msg': 'Missing Authorization Header'
    }), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({
        'error': 'Invalid authorization token',
        'msg': 'Token signature mismatch or malformed'
    }), 422

@jwt.expired_token_loader
def expired_token_response(callback, token_type):
    return jsonify({
        'error': 'Expired authorization token',
        'msg': 'Session timed out. Please login again.'
    }), 401

# Database Setup
init_db(app)

# Static Image Serving
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(IMAGES_DIR, filename)

# Health Check
@app.route('/')
def health():
    return {"status": "active", "service": "Fashion Pro AI Backend"}

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(gallery_bp)
app.register_blueprint(accessory_bp)
app.register_blueprint(recommendations_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(user_dashboard_bp)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"🚀 Fashion Pro AI Backend running on http://127.0.0.1:{port}")
    app.run(debug=True, host='0.0.0.0', port=port)
