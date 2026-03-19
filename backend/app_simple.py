from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import bcrypt
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BACKEND_DIR, 'users.json')

def load_json(path, default={}):
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except:
            return default
    return default

@app.route('/')
def health():
    return jsonify({"status": "simple backend ready"})

@app.route('/api/users/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Missing email/password"}), 400
    
    users = load_json(USERS_FILE, {})
    user_data = users.get(data['email'])
    
    if user_data and bcrypt.checkpw(data['password'].encode('utf-8'), user_data['password'].encode('utf-8')):
        user = {
            "name": user_data['name'],
            "email": user_data['email'],
            "gender": user_data['gender'],
            "memberSince": user_data['memberSince']
        }
        return jsonify({"user": user, "token": "dummy_token"})
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/profile', methods=['GET'])
def profile():
    email = request.headers.get('User-Email') or request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    users = load_json(USERS_FILE, {})
    user_data = users.get(email)
    if user_data:
        user = {
            "name": user_data['name'],
            "email": user_data['email'],
            "gender": user_data['gender'],
            "memberSince": user_data['memberSince']
        }
        return jsonify({"user": user})
    
    return jsonify({"error": "User not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
