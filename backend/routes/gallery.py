from flask import Blueprint, request, jsonify, send_from_directory, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.db import db
from models.outfit import Outfit
from models.like import Like
from models.user import User
from routes.admin import admin_required
import os
import json

gallery_bp = Blueprint('gallery', __name__, url_prefix='/api')

# Paths for serving images
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
USERS_FILE = os.path.join(BACKEND_DIR, 'users.json')

def get_or_create_user(email):
    """Helper to ensure user exists in DB, migrating from JSON if needed."""
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    
    # Try to migrate from JSON
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                users_json = json.load(f)
                if email in users_json:
                    u_data = users_json[email]
                    # Create new user in DB
                    new_user = User(
                        name=u_data['name'],
                        email=email,
                        hashed_password=u_data['password'], # Keep existing hash
                        gender=u_data.get('gender', 'female'),
                        member_since=u_data.get('memberSince', 'March 2026'),
                        is_admin=bool(u_data.get('is_admin', False)),
                        role=u_data.get('role', 'user'),
                    )
                    db.session.add(new_user)
                    db.session.commit()
                    print(f"✅ Migrated user {email} to DB")
                    return new_user
        except Exception as e:
            print(f"❌ Migration error for {email}: {e}")
            db.session.rollback()
    
    return None


@gallery_bp.route('/images/<path:filename>')
def serve_images(filename):
    # Closet uploads are private — served only through the authenticated
    # /api/closet/items/<id>/image endpoint. Block them here too.
    if filename.replace('\\', '/').startswith('closet/'):
        abort(404)
    return send_from_directory(IMAGES_DIR, filename)

@gallery_bp.route('/gallery', methods=['GET'])
def get_gallery():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    start = (page - 1) * limit
    
    # Query database instead of JSON cache
    outfits_query = Outfit.query.filter_by(is_active=True)
    total = outfits_query.count()
    outfits = outfits_query.offset(start).limit(limit).all()
    
    return jsonify({
        "images": [o.to_dict() for o in outfits],
        "total": total,
        "has_more": start + limit < total
    })

@gallery_bp.route('/gallery/<int:id>', methods=['GET'])
def get_gallery_detail(id):
    return get_outfit(id)

@gallery_bp.route('/outfits/<int:outfit_id>', methods=['GET'])
def get_outfit(outfit_id):
    outfit = Outfit.query.get(outfit_id)
    if outfit:
        return jsonify(outfit.to_dict())
    return jsonify({"error": "not found"}), 404

@gallery_bp.route('/gallery/refresh', methods=['POST'])
@admin_required
def refresh_gallery():
    # This would normally trigger a re-scan of the images folder
    # For now, we'll return a success message
    return jsonify({"msg": "Gallery index refreshed successfully"})

@gallery_bp.route('/like', methods=['POST'])
@gallery_bp.route('/gallery/like', methods=['POST'])
@jwt_required()
def like_outfit():
    print(f"DEBUG: like_outfit called with data: {request.json}")
    data = request.json
    outfit_id = data.get('id')
    email = get_jwt_identity()
    print(f"DEBUG: identity email: {email}")

    user = get_or_create_user(email)
    if not user:
        print(f"DEBUG: User not found/migrated for {email}")
        return jsonify({"error": "User not found"}), 401

    user_id = user.id
    print(f"DEBUG: user_id: {user_id}")


    if not outfit_id:
        return jsonify({"error": "outfit_id required"}), 400

    existing_like = Like.query.filter_by(user_id=user_id, outfit_id=outfit_id).first()

    outfit = Outfit.query.get(outfit_id)
    if not outfit:
        print(f"DEBUG: Outfit {outfit_id} not found in DB")
        return jsonify({"error": "Outfit not found"}), 404
    if existing_like:
        db.session.delete(existing_like)
        outfit.likes = max(0, outfit.likes - 1)
        liked = False
    else:
        new_like = Like(user_id=user_id, outfit_id=outfit_id)
        db.session.add(new_like)
        outfit.likes += 1
        liked = True
    
    # Sync to legacy JSON
    LIKES_FILE = os.path.join(BACKEND_DIR, 'likes.json')
    try:
        if os.path.exists(LIKES_FILE):
            with open(LIKES_FILE, 'r') as f:
                likes_data = json.load(f)
            user_likes = likes_data.get(email, [])
            # Update or add current outfit like status
            outfit_data = {'id': outfit_id, 'image': outfit.image_path}
            if liked:
                if outfit_data not in user_likes:
                    user_likes.append(outfit_data)
            else:
                user_likes = [l for l in user_likes if l.get('id') != outfit_id]
            likes_data[email] = user_likes
            with open(LIKES_FILE, 'w') as f:
                json.dump(likes_data, f, indent=2)
    except Exception as json_err:
        print(f"JSON sync error: {json_err}")
    
    try:
        db.session.commit()
        print(f"✅ Like toggled for user {user_id}, outfit {outfit_id}, liked={liked}")
        return jsonify({"msg": "Like toggled", "liked": liked, "likes_count": outfit.likes})
    except Exception as e:
        db.session.rollback()
        print(f"❌ DB commit failed: {e}")
        return jsonify({"error": "Failed to update like status. Please try again."}), 500


@gallery_bp.route('/profile/liked', methods=['GET'])
@jwt_required()
def get_liked():
    email = get_jwt_identity()
    user = get_or_create_user(email)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user_id = user.id
    
    liked_outfits = db.session.query(Outfit).join(Like).filter(Like.user_id == user_id).all()
    
    return jsonify({"liked": [o.to_dict() for o in liked_outfits]})

