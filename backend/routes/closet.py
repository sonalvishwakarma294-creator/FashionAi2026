import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename

from config.db import db
from models.closet import ClosetItem
from models.user import User
from utils.color_utils import extract_dominant_color

closet_bp = Blueprint('closet', __name__, url_prefix='/api/closet')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_user_id():
    """Helper to get user_id whether authenticated with JWT or fallback for demo."""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            if isinstance(identity, dict) and 'id' in identity:
                return identity['id']
            user = User.query.filter_by(email=str(identity)).first()
            if user:
                return user.id
    except Exception:
        pass
    
    # Fallback to first user in DB or ID 1 for demo purposes if not logged in
    first_user = User.query.first()
    return first_user.id if first_user else 1

@closet_bp.route('/items', methods=['GET'])
def get_items():
    user_id = get_current_user_id()
    category = request.args.get('category')
    occasion = request.args.get('occasion')
    season = request.args.get('season')
    
    query = ClosetItem.query.filter_by(user_id=user_id)
    if category and category != 'all':
        query = query.filter_by(category=category)
    if occasion and occasion != 'all':
        query = query.filter(ClosetItem.occasion.in_([occasion, 'all']))
    if season and season != 'all':
        query = query.filter(ClosetItem.season.in_([season, 'all-season']))
        
    items = query.order_by(ClosetItem.created_at.desc()).all()
    
    # Group items by category for summary stats
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
        'items': [item.to_dict() for item in items],
        'counts': counts
    }), 200

@closet_bp.route('/items', methods=['POST'])
def add_item():
    user_id = get_current_user_id()
    
    name = request.form.get('name') or request.json.get('name') if request.is_json else request.form.get('name')
    category = request.form.get('category') or (request.json.get('category') if request.is_json else 'top')
    sub_category = request.form.get('sub_category') or (request.json.get('sub_category') if request.is_json else '')
    occasion = request.form.get('occasion') or (request.json.get('occasion') if request.is_json else 'casual')
    season = request.form.get('season') or (request.json.get('season') if request.is_json else 'all-season')
    brand = request.form.get('brand') or (request.json.get('brand') if request.is_json else '')
    color_name = request.form.get('color_name') or (request.json.get('color_name') if request.is_json else '')
    color_hex = request.form.get('color_hex') or (request.json.get('color_hex') if request.is_json else '')
    
    if not name:
        name = f"My {category.capitalize()}"
        
    image_url = ""
    
    # Handle File Upload
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"closet_{uuid.uuid4().hex[:8]}_{file.filename}")
            upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'images', 'closet')
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            image_url = f"/images/closet/{filename}"
            
            # Auto-extract color if not supplied
            if not color_name or not color_hex:
                detected_name, detected_hex, _ = extract_dominant_color(file_path)
                color_name = detected_name
                color_hex = detected_hex
    elif request.is_json and request.json.get('image_url'):
        image_url = request.json.get('image_url')
    elif request.form.get('image_url'):
        image_url = request.form.get('image_url')
    else:
        # Default placeholder outfit based on category
        image_url = "/images/classic_denim.jpg"

    new_item = ClosetItem(
        user_id=user_id,
        name=name,
        category=category,
        sub_category=sub_category,
        color_name=color_name or "Classic Neutral",
        color_hex=color_hex or "#4A5568",
        occasion=occasion,
        season=season,
        image_url=image_url,
        brand=brand
    )
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify({
        'message': 'Closet item saved successfully!',
        'item': new_item.to_dict()
    }), 201

@closet_bp.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    user_id = get_current_user_id()
    item = ClosetItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted successfully'}), 200

@closet_bp.route('/capsule-generate', methods=['POST'])
def generate_capsules():
    """Generates intelligent outfit combinations matching tops, bottoms, outerwear, shoes from closet."""
    user_id = get_current_user_id()
    data = request.get_json() or {}
    target_occasion = data.get('occasion', 'all')
    target_season = data.get('season', 'all')
    
    items = ClosetItem.query.filter_by(user_id=user_id).all()
    
    tops = [i for i in items if i.category in ['top']]
    bottoms = [i for i in items if i.category in ['bottom']]
    dresses = [i for i in items if i.category in ['dress']]
    outerwear = [i for i in items if i.category in ['outerwear']]
    shoes = [i for i in items if i.category in ['shoes']]
    accessories = [i for i in items if i.category in ['accessory']]
    
    outfits = []
    
    # 1. Generate Two-Piece Outfits (Top + Bottom)
    for top in tops[:4]:
        for bot in bottoms[:4]:
            if target_occasion != 'all' and top.occasion not in [target_occasion, 'all'] and bot.occasion not in [target_occasion, 'all']:
                continue
            
            shoes_match = shoes[0] if shoes else None
            outer_match = outerwear[0] if outerwear else None
            acc_match = accessories[0] if accessories else None
            
            # Synergy calculation based on complementary colors and occasions
            score = 85
            if top.occasion == bot.occasion:
                score += 8
            if top.color_name != bot.color_name:
                score += 5
                
            outfits.append({
                'id': f"outfit_{top.id}_{bot.id}",
                'title': f"{top.color_name} {top.name} + {bot.name}",
                'type': 'Two-Piece Ensemble',
                'occasion': top.occasion if top.occasion != 'all' else bot.occasion,
                'synergy_score': min(98, score),
                'top': top.to_dict(),
                'bottom': bot.to_dict(),
                'outerwear': outer_match.to_dict() if outer_match else None,
                'shoes': shoes_match.to_dict() if shoes_match else None,
                'accessory': acc_match.to_dict() if acc_match else None,
                'styling_tip': f"Pair this {top.color_name} {top.name} with clean {bot.color_name} lines for an effortless {top.occasion} look."
            })
            
    # 2. Generate Dress Outfits
    for dr in dresses[:3]:
        shoes_match = shoes[0] if shoes else None
        outer_match = outerwear[0] if outerwear else None
        acc_match = accessories[0] if accessories else None
        
        outfits.append({
            'id': f"outfit_dress_{dr.id}",
            'title': f"{dr.color_name} {dr.name} Statement",
            'type': 'One-Piece Statement',
            'occasion': dr.occasion,
            'synergy_score': 94,
            'dress': dr.to_dict(),
            'outerwear': outer_match.to_dict() if outer_match else None,
            'shoes': shoes_match.to_dict() if shoes_match else None,
            'accessory': acc_match.to_dict() if acc_match else None,
            'styling_tip': f"Elevate your {dr.name} with minimalist accents and sleek layering."
        })
        
    # Suggest 1-2 missing key capsule staple items to unlock more looks
    missing_staples = []
    if len(outerwear) == 0:
        missing_staples.append({
            'name': 'Camel Trench or Structured Black Blazer',
            'reason': 'Adding 1 tailored blazer would unlock 6+ new smart-casual and office outfits.'
        })
    if len(shoes) < 2:
        missing_staples.append({
            'name': 'Minimalist White Leather Sneakers',
            'reason': 'White sneakers seamlessly bridge casual and smart streetwear combinations.'
        })
    if len(tops) < 3:
        missing_staples.append({
            'name': 'Crisp White Oxford Button-down',
            'reason': 'An essential layering piece that works under sweaters, over tees, or solo.'
        })

    return jsonify({
        'outfits': outfits[:10],
        'total_combinations': len(outfits),
        'missing_staples': missing_staples
    }), 200
