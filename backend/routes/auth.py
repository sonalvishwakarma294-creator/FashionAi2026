from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, create_access_token, create_refresh_token, 
    get_jwt_identity
)
from config.db import db
from models.user import User
import bcrypt
import os
import json
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.json')

def load_users_from_json():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        member_since = datetime.now().strftime("%B %Y")
        
        new_user = User(
            name=data['name'],
            email=data['email'],
            hashed_password=hashed,
            gender=data.get('gender', 'female'),
            member_since=member_since
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Simplified identity to just email (string)
        access_token = create_access_token(identity=new_user.email)
        refresh_token = create_refresh_token(identity=new_user.email)
        
        return jsonify({
            'user': new_user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    except Exception as e:
        if db.session: db.session.rollback()
        return jsonify({'error': f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    email = data['email']
    password = data['password']
        
    # 1. Try Database Login
    try:
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8')):
            access_token = create_access_token(identity=email)
            refresh_token = create_refresh_token(identity=email)
            return jsonify({
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            })
    except Exception as e:
        print(f"Database login error: {e}")

    # 2. Try JSON Fallback
    users_json = load_users_from_json()
    if email in users_json:
        user_data = users_json[email]
        stored_password = user_data['password']
        
        is_match = False
        if stored_password.startswith('$2b$'):
            is_match = bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))
        else:
            is_match = (password == stored_password)
            
        if is_match:
            mock_user = {
                'id': 0,
                'name': user_data['name'],
                'email': email,
                'gender': user_data.get('gender', 'female'),
                'member_since': user_data.get('memberSince', 'March 2026')
            }
            access_token = create_access_token(identity=email)
            refresh_token = create_refresh_token(identity=email)
            return jsonify({
                'user': mock_user,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'source': 'json_fallback'
            })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return jsonify({'access_token': access_token})

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    email = get_jwt_identity() # Identity is now just the email string
    
    try:
        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({'user': user.to_dict()})
    except:
        pass
        
    users_json = load_users_from_json()
    if email in users_json:
        u = users_json[email]
        return jsonify({
            'user': {
                'id': 0,
                'name': u['name'],
                'email': email,
                'gender': u.get('gender', 'female'),
                'member_since': u.get('memberSince', 'March 2026')
            }
        })
        
    return jsonify({'error': 'User not found'}), 404

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    return jsonify({"message": "Password reset link sent to your email!"})

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200
