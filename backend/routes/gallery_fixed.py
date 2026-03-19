from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.db import db
from models.outfit import Outfit
from models.like import Like
from models.user import User
import os

gallery_bp = Blueprint('gallery', __name__)

# Paths for serving images
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')

@gallery_bp.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(IMAGES_DIR, filename)

@gallery_bp.route('/api/gallery', methods=['GET'])
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

@gallery_bp.route('/api/gallery/<int:id>', methods=['GET'])
def get_gallery_detail(id):
    return get_outfit(id)

@gallery_bp.route('/api/outfits/<int:outfit_id>', methods=['GET'])
def get_outfit(outfit_id):
    outfit = Outfit.query.get(outfit_id)
    if outfit:
        return jsonify(outfit.to_dict())
    return jsonify({"error": "not found"}), 404

@gallery_bp.route('/api/outfits/like', methods=['POST'])
@jwt_required()
def like_outfit():
    data = request.json
    outfit_id = data.get('id')
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity['id']
    
    if not outfit_id:
        return jsonify({"error": "outfit_id required"}), 400
    
    existing_like = Like.query.filter_by(user_id=user_id, outfit_id=outfit_id).first()
    
    outfit = Outfit.query.get(outfit_id)
    if not outfit:
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
    
    try:
        db.session.commit()
        return jsonify({"msg": "Like toggled", "liked": liked, "likes_count": outfit.likes})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@gallery_bp.route('/api/profile/liked', methods=['GET'])
@jwt_required()
def get_liked():
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity['id']
    
    liked_outfits = db.session.query(Outfit).join(Like).filter(Like.user_id == user_id).all()
    
    return jsonify({"liked": [o.to_dict() for o in liked_outfits]})
