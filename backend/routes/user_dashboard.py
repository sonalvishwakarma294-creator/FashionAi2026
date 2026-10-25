from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.recommendation import SavedRecommendation
from models.like import Like
from models.outfit import Outfit
from config.db import db
import os
import json

user_dashboard_bp = Blueprint('user_dashboard', __name__, url_prefix='/api')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_RECS_FILE = os.path.join(BACKEND_DIR, 'saved_recommendations.json')
LIKES_FILE = os.path.join(BACKEND_DIR, 'likes.json')

@user_dashboard_bp.route('/user/dashboard-stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_email = get_jwt_identity()
    
    user_data = None
    user_id = 0
    
    try:
        user = User.query.filter_by(email=user_email).first()
        if user:
            user_data = user.to_dict()
            user_id = user.id
    except:
        pass

    if not user_data:
        users_file = os.path.join(BACKEND_DIR, 'users.json')
        if os.path.exists(users_file):
            try:
                with open(users_file, 'r') as f:
                    users_json = json.load(f)
                    if user_email in users_json:
                        u = users_json[user_email]
                        user_data = {"name": u['name'], "email": user_email, "gender": u.get("gender", "female"), "member_since": u.get("memberSince", "March 2026"), "is_admin": bool(u.get("is_admin", False)), "role": u.get("role", "user")}
            except:
                pass

    if not user_data:
        user_data = {"name": user_email.split('@')[0], "email": user_email, "gender": "female", "member_since": "March 2026"}

    saved_recs = []
    liked_outfits = []
    
    # 1. Fetch Saved Recommendations
    # From DB
    try:
        if user_id > 0:
            recs = SavedRecommendation.query.filter_by(user_id=user_id).order_by(SavedRecommendation.created_at.desc()).all()
            saved_recs = [r.to_dict() for r in recs]
    except:
        pass
        
    # From JSON (Merge)
    if os.path.exists(SAVED_RECS_FILE):
        try:
            with open(SAVED_RECS_FILE, 'r') as f:
                all_recs = json.load(f)
                json_user_recs = all_recs.get(user_email, [])
                for r in json_user_recs:
                    # Map JSON format to the format expected by Dashboard.jsx
                    saved_recs.append({
                        "id": f"json_{id(r)}",
                        "rec_type": r.get("type", "styling_guide"), # Key mapping fix
                        "rec_data": r,
                        "created_at": r.get("date", "2026-03-18")
                    })
        except:
            pass

# 2. Fetch Liked Outfits from DB only (primary source)
    try:
        if user_id > 0:
            likes = db.session.query(Outfit).join(Like).filter(Like.user_id == user_id).all()
            liked_outfits = [o.to_dict() for o in likes]
            print(f"✅ Dashboard: Found {len(liked_outfits)} liked outfits in DB for user_id {user_id}")
        else:
            print(f"⚠️ No DB user_id for {user_email}, liked_outfits empty")
    except Exception as e:
        print(f"❌ DB likes query failed: {e}")
        liked_outfits = []

    
    # Sort reports by date (Newest first)
    try:
        saved_recs.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    except:
        pass

    # Analytics
    occasion_counts = {}
    for rec in saved_recs:
        d = rec.get('rec_data', {})
        occ = d.get('occasion')
        if occ:
            occasion_counts[occ] = occasion_counts.get(occ, 0) + 1
    
    top_occasion = max(occasion_counts, key=occasion_counts.get) if occasion_counts else "General"
    
    report_types = {}
    for rec in saved_recs:
        t = rec.get('rec_type', 'report')
        report_types[t] = report_types.get(t, 0) + 1

    return jsonify({
        'user': user_data,
        'stats': {
            'total_saved': len(saved_recs),
            'total_liked': len(liked_outfits),
            'top_occasion': top_occasion,
            'report_breakdown': report_types
        },
        'saved_recommendations': saved_recs,
        'liked_outfits': liked_outfits
    })

@user_dashboard_bp.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({'error': 'Update not available for JSON users'}), 404
    data = request.json
    if 'name' in data: user.name = data['name']
    if 'gender' in data: user.gender = data['gender']
    db.session.commit()
    return jsonify({'msg': 'Profile updated', 'user': user.to_dict()})
