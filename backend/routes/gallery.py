from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.db import db
from models.outfit import Outfit
from models.like import Like
from models.user import User
import os
import json

gallery_bp = Blueprint('gallery', __name__)

# Paths for serving images
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
LIKES_FILE = os.path.join(BACKEND_DIR, 'likes.json')

def get_gallery_from_json():
    gallery_file = os.path.join(BACKEND_DIR, 'gallery.json')
    if os.path.exists(gallery_file):
        with open(gallery_file, 'r') as f:
            return json.load(f)
    return []

def toggle_like_in_json(user_email, outfit_id):
    try:
        likes_data = {}
        if os.path.exists(LIKES_FILE):
            with open(LIKES_FILE, 'r') as f:
                likes_data = json.load(f)
        
        if user_email not in likes_data:
            likes_data[user_email] = []
            
        user_likes = likes_data[user_email]
        
        # Check if already liked
        is_liked = any(item.get('id') == outfit_id for item in user_likes)
        
        if is_liked:
            # Unlike: Remove from list
            likes_data[user_email] = [item for item in user_likes if item.get('id') != outfit_id]
            liked = False
        else:
            # Like: Add to list
            gallery_data = get_gallery_from_json()
            outfit = next((item for item in gallery_data if item["id"] == outfit_id), None)
            if outfit:
                user_likes.append(outfit)
                liked = True
            else:
                return False, False, 0
        
        with open(LIKES_FILE, 'w') as f:
            json.dump(likes_data, f, indent=2)
            
        return True, liked, (len(user_likes))
    except Exception as e:
        print(f"JSON Like Error: {e}")
        return False, False, 0

@gallery_bp.route('/api/gallery/refresh', methods=['POST'])
def refresh_gallery():
    try:
        data = get_gallery_from_json()
        count = 0
        valid_occasions = ['Casual', 'Office', 'Party', 'Traditional']
        
        for item in data:
            # Map JSON occasion to valid DB Enum
            occ = item.get('occasion', 'Casual')
            if occ not in valid_occasions:
                occ = 'Casual' # Fallback
                
            existing = Outfit.query.get(item['id'])
            if not existing:
                new_outfit = Outfit(
                    id=item['id'],
                    name=item['name'],
                    image_path=item['image'],
                    occasion=occ,
                    likes=item.get('likes', 0),
                    is_active=True
                )
                db.session.add(new_outfit)
                count += 1
            else:
                # Update existing
                existing.name = item['name']
                existing.image_path = item['image']
                existing.occasion = occ
                count += 1
        
        db.session.commit()
        return jsonify({"msg": f"Gallery refreshed. {count} items synced.", "status": "success"}), 200
    except Exception as e:
        if db.session: db.session.rollback()
        print(f"Refresh Error: {e}")
        return jsonify({"error": str(e), "status": "failed"}), 500

@gallery_bp.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(IMAGES_DIR, filename)

@gallery_bp.route('/api/gallery', methods=['GET'])
def get_gallery():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    start = (page - 1) * limit
    
    try:
        outfits_query = Outfit.query.filter_by(is_active=True)
        total = outfits_query.count()
        outfits = outfits_query.offset(start).limit(limit).all()
        
        return jsonify({
            "images": [o.to_dict() for o in outfits],
            "total": total,
            "has_more": start + limit < total
        })
    except Exception as e:
        data = get_gallery_from_json()
        total = len(data)
        paged_data = data[start:start+limit]
        return jsonify({
            "images": paged_data,
            "total": total,
            "has_more": start + limit < total,
            "source": "json_fallback"
        })

@gallery_bp.route('/api/gallery/<int:id>', methods=['GET'])
def get_gallery_detail(id):
    return get_outfit(id)

@gallery_bp.route('/api/outfits/<int:outfit_id>', methods=['GET'])
def get_outfit(outfit_id):
    try:
        outfit = Outfit.query.get(outfit_id)
        if outfit:
            return jsonify(outfit.to_dict())
    except:
        data = get_gallery_from_json()
        outfit = next((item for item in data if item["id"] == outfit_id), None)
        if outfit:
            return jsonify(outfit)
            
    return jsonify({"error": "not found"}), 404

@gallery_bp.route('/api/gallery/like', methods=['POST'])
@jwt_required()
def like_outfit():
    data = request.json
    outfit_id = data.get('id')
    user_email = get_jwt_identity()
    
    if not outfit_id:
        return jsonify({"error": "outfit_id required"}), 400
    
    # Try database first
    try:
        user = User.query.filter_by(email=user_email).first()
        outfit = Outfit.query.get(outfit_id)
        
        if user and outfit:
            existing_like = Like.query.filter_by(user_id=user.id, outfit_id=outfit_id).first()
            if existing_like:
                db.session.delete(existing_like)
                outfit.likes = max(0, outfit.likes - 1)
                liked = False
            else:
                new_like = Like(user_id=user.id, outfit_id=outfit_id)
                db.session.add(new_like)
                outfit.likes += 1
                liked = True
            db.session.commit()
            return jsonify({"msg": "Like toggled", "liked": liked, "likes_count": outfit.likes})
    except Exception as e:
        print(f"DB Like failed, falling back to JSON: {e}")
        if db.session: db.session.rollback()

    # JSON Fallback
    success, liked, count = toggle_like_in_json(user_email, outfit_id)
    if success:
        return jsonify({"msg": "Like toggled (JSON)", "liked": liked, "likes_count": count})
    
    return jsonify({"error": "Failed to process like"}), 500

@gallery_bp.route('/api/profile/liked', methods=['GET'])
@jwt_required()
def get_liked():
    user_email = get_jwt_identity()
    
    # Try DB
    try:
        user = User.query.filter_by(email=user_email).first()
        if user:
            liked_outfits = db.session.query(Outfit).join(Like).filter(Like.user_id == user.id).all()
            return jsonify({"liked": [o.to_dict() for o in liked_outfits]})
    except:
        pass
        
    # JSON Fallback
    if os.path.exists(LIKES_FILE):
        with open(LIKES_FILE, 'r') as f:
            likes_data = json.load(f)
            return jsonify({"liked": likes_data.get(user_email, [])})
            
    return jsonify({"liked": []})
