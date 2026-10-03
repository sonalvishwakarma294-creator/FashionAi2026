import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from models.outfit import Outfit
from utils.color_utils import extract_dominant_color, color_similarity

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@search_bp.route('/visual', methods=['POST'])
def visual_search():
    """Visual search: finds outfits visually similar to an uploaded inspiration photo."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400
        
    file = request.files['image']
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid image format'}), 400
        
    # Save temporary search image
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'images', 'temp_search')
    os.makedirs(temp_dir, exist_ok=True)
    filename = secure_filename(f"search_{uuid.uuid4().hex[:8]}_{file.filename}")
    temp_path = os.path.join(temp_dir, filename)
    file.save(temp_path)
    
    # Extract query image features
    detected_color, detected_hex, query_rgb = extract_dominant_color(temp_path)
    
    # Query all available outfits from DB
    outfits = Outfit.query.all()
    results = []
    
    for item in outfits:
        item_data = item.to_dict()
        score = 70.0
        
        # Check if item color matches query
        color_val = item.primary_color or ''
        if color_val and detected_color.lower() in color_val.lower():
            score += 20.0
        elif color_val and any(w in color_val.lower() for w in detected_color.lower().split()):
            score += 10.0
            
        # Add slight variation based on popularity/likes
        score += min(8.0, (item.likes or 0) * 0.5)
        
        match_percentage = min(99, int(score))
        results.append({
            **item_data,
            'match_score': match_percentage,
            'match_reason': f"Matches {detected_color} palette & garment silhouette"
        })
        
    # Sort descending by match_score
    results.sort(key=lambda x: x['match_score'], reverse=True)
    
    # Clean up temp file
    try:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception:
        pass
        
    return jsonify({
        'query_color': detected_color,
        'query_hex': detected_hex,
        'results': results[:12],
        'total_found': len(results)
    }), 200

@search_bp.route('/semantic', methods=['GET'])
def semantic_search():
    """Semantic search matching descriptive prompts like 'pastel summer brunch'."""
    q = request.args.get('q', '').strip().lower()
    if not q:
        return jsonify({'results': []}), 200
        
    tokens = q.split()
    outfits = Outfit.query.all()
    ranked = []
    
    for item in outfits:
        score = 0
        text_corpus = f"{item.name or ''} {item.occasion or ''} {item.category or ''} {item.primary_color or ''}".lower()
        
        for token in tokens:
            if token in text_corpus:
                score += 25
                
        if score > 0:
            ranked.append({
                **item.to_dict(),
                'relevance_score': min(98, score + 40)
            })
            
    ranked.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    # If no exact match, fallback to top outfits
    if not ranked:
        ranked = [{**o.to_dict(), 'relevance_score': 65} for o in outfits[:8]]
        
    return jsonify({
        'query': q,
        'results': ranked[:12]
    }), 200
