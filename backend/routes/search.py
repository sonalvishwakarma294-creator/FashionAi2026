import io
import logging
import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config.db import db
from models.outfit import Outfit
from utils.color_utils import (
    extract_full_palette,
    extract_dominant_color,
    rgb_to_lab,
    FASHION_PALETTE,
    palette_similarity,
    color_similarity_2000,
    delta_e_cie2000,
)
from middleware.rate_limiter import public_limit
from routes.admin import admin_required
import numpy as np

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_SEARCH_UPLOAD_BYTES = int(os.environ.get('SEARCH_MAX_UPLOAD_BYTES', 8 * 1024 * 1024))

_MAGIC_SIGNATURES = {
    b'\xff\xd8\xff':        'jpeg',
    b'\x89PNG\r\n\x1a\n':  'png',
    b'RIFF':                'webp',
}

def _validate_search_image(file_storage):
    """Magic-byte + Pillow decode validation for search uploads."""
    try:
        file_bytes = file_storage.read(MAX_SEARCH_UPLOAD_BYTES + 1)
    except Exception:
        return False, 'Failed to read uploaded file.', b''
    if len(file_bytes) > MAX_SEARCH_UPLOAD_BYTES:
        return False, f'File exceeds maximum allowed size ({MAX_SEARCH_UPLOAD_BYTES // (1024*1024)} MB).', b''
    if len(file_bytes) < 8:
        return False, 'Uploaded file is too small to be a valid image.', b''
    matched_fmt = None
    for magic, fmt in _MAGIC_SIGNATURES.items():
        if file_bytes[:len(magic)] == magic:
            matched_fmt = fmt
            break
    if matched_fmt is None:
        return False, 'File content does not match an allowed image format.', b''
    if matched_fmt == 'webp' and file_bytes[8:12] != b'WEBP':
        return False, 'File content does not match an allowed image format.', b''
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
    except Exception:
        return False, 'Uploaded file could not be decoded as a valid image.', b''
    return True, None, file_bytes

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def simple_palette_keyword(color_name):
    import re
    color_name_l = color_name.lower()
    tokens = set(re.findall(r"[a-z]+", color_name_l))
    normalized_hyphen = color_name_l.replace('-', ' ')
    hyphen_tokens = set(re.findall(r"[a-z]+", normalized_hyphen))
    all_tokens = tokens | hyphen_tokens

    mapping = [
        ('White', ['white', 'cream', 'off white', 'ivory']),
        ('Black', ['black', 'charcoal', 'grey', 'heather', 'gray']),
        ('Blue', ['blue', 'navy', 'midnight', 'denim', 'sky', 'teal', 'turquoise', 'indigo', 'cobalt']),
        ('Green', ['green', 'emerald', 'olive', 'sage', 'mint', 'forest', 'lime', 'khaki']),
        ('Red', ['red', 'ruby', 'crimson', 'burgundy', 'maroon', 'wine', 'coral', 'peach', 'scarlet']),
        ('Pink', ['pink', 'blush', 'fuchsia', 'rose', 'magenta']),
        ('Yellow', ['yellow', 'mustard', 'gold', 'camel', 'beige',
                    'tan', 'cognac', 'nude', 'chocolate', 'brown',
                    'burnt orange', 'rust', 'orange', 'pastel yellow', 'amber', 'caramel']),
        ('Purple', ['purple', 'lavender', 'lilac', 'plum', 'violet', 'eggplant']),
    ]
    for simple, kws in mapping:
        for kw in kws:
            if ' ' in kw:
                if kw in color_name_l or kw in normalized_hyphen:
                    return simple
            else:
                if kw in all_tokens:
                    return simple
    return None


def extract_outfit_palette(outfit):
    """
    Extract and cache the color palette for an outfit from its image on disk.
    Returns (swatches, primary_rgb, did_extract_new).
    """
    meta = outfit.extra_metadata or {}
    cached_swatches = meta.get('palette_swatches')
    cached_rgb = meta.get('extracted_rgb')

    if cached_swatches and isinstance(cached_swatches, list) and len(cached_swatches) >= 1:
        valid = all(
            isinstance(s, dict) and isinstance(s.get('rgb'), (list, tuple)) and len(s['rgb']) == 3
            for s in cached_swatches
        )
        if valid:
            return cached_swatches, tuple(int(c) for c in cached_rgb) if cached_rgb else None, False

    image_path = outfit.image_path or ''
    if not image_path:
        return [], None, False

    full_path = os.path.join(PROJECT_ROOT, image_path) if not os.path.isabs(image_path) else image_path
    if not os.path.isfile(full_path):
        alt = os.path.join(IMAGES_DIR, os.path.basename(image_path))
        if os.path.isfile(alt):
            full_path = alt
        else:
            return [], None, False

    try:
        p_name, p_hex, p_rgb, swatches = extract_full_palette(full_path, k=6)
        if swatches:
            if not meta:
                meta = {}
            meta['palette_swatches'] = swatches
            meta['extracted_rgb'] = p_rgb
            meta['extracted_color'] = p_name
            meta['extracted_hex'] = p_hex
            if not outfit.primary_color:
                outfit.primary_color = p_name
            outfit.extra_metadata = meta
            try:
                db.session.add(outfit)
                db.session.commit()
            except Exception:
                db.session.rollback()
            return swatches, tuple(int(c) for c in p_rgb), True
    except Exception as e:
        print(f"Pal extract err outfit {outfit.id}: {e}")

    return [], None, False


def get_outfit_palette_and_rgb(outfit):
    """Guaranteed to return at least some palette info for the outfit."""
    swatches, primary_rgb, _ = extract_outfit_palette(outfit)
    if swatches:
        return swatches, primary_rgb

    meta = outfit.extra_metadata or {}
    stored = meta.get('extracted_rgb')
    if stored and isinstance(stored, (list, tuple)) and len(stored) == 3:
        rgb = tuple(int(c) for c in stored)
        return [{
            'name': meta.get('extracted_color', outfit.primary_color or ''),
            'hex': meta.get('extracted_hex', '#000000'),
            'rgb': list(rgb),
            'percentage': 100,
        }], rgb

    pc = outfit.primary_color or ''
    for entry in FASHION_PALETTE:
        if pc.lower() in entry['name'].lower() or entry['name'].lower() in pc.lower():
            return [{
                'name': entry['name'],
                'hex': entry['hex'],
                'rgb': list(entry['rgb']),
                'percentage': 100,
            }], entry['rgb']

    return [], None


def category_style_similarity(query_category_hint, outfit):
    """
    Returns a score 0.0 - 1.0 measuring whether the outfit's
    category / name / occasion text is semantically related to
    keywords inferred from the query (or broader style tags).
    """
    if not query_category_hint:
        return 0.3

    meta = outfit.extra_metadata or {}
    corpus = (
        f"{outfit.name or ''} {outfit.occasion or ''} "
        f"{outfit.category or ''} {meta.get('description', '') or ''} "
        f"{meta.get('style_tags', '') or ''}"
    ).lower()

    hint_tokens = [t for t in query_category_hint.lower().split() if len(t) >= 2]
    if not hint_tokens:
        return 0.3

    hits = sum(1 for t in hint_tokens if t in corpus)
    if hits == 0:
        return 0.1
    return min(1.0, 0.35 + (hits / max(1, len(hint_tokens))) * 0.65)


def occasion_match_score(query_occasion_keywords, outfit_occasion):
    """Boost for outfits with occasion / style matching extracted keywords."""
    if not query_occasion_keywords or not outfit_occasion:
        return 0.0

    outfit_low = outfit_occasion.lower()
    for kw in query_occasion_keywords:
        if kw in outfit_low or outfit_low in kw:
            return 1.0
    return 0.0


def build_match_reason(palette_sim, color_name_boost, occ_boost, cat_boost, top_de):
    parts = []
    if palette_sim >= 0.75:
        parts.append("Near-perfect palette match")
    elif palette_sim >= 0.55:
        parts.append(f"Strong palette match")
    elif palette_sim >= 0.35:
        parts.append(f"Palette affinity ΔE≈{int(top_de)}")
    elif color_name_boost > 0:
        parts.append(f"Same color family")
    else:
        parts.append(f"Color match ΔE={int(top_de)}")

    if occ_boost > 0.5:
        parts.append("Matching occasion")
    if cat_boost >= 0.7:
        parts.append("Style match")
    elif cat_boost >= 0.5:
        parts.append("Related silhouette")

    return ", ".join(parts[:3])


@search_bp.route('/visual', methods=['POST'])
@public_limit()
def visual_search():
    """Visual search with multi-color CIEDE2000 palette matching.

    Improvements over previous version:
      - Extracts full palette (up to 6 swatches) via K-Means++ with CIELAB
      - Uses palette_similarity (weighted, EMD-like) not single ΔE
      - Extracts & caches palettes for gallery outfits on demand
      - Incorporates occasion + category style similarity
      - Uses CIEDE2000 for perceptual color distance
    """
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400

    file = request.files['image']
    if not file or not file.filename:
        return jsonify({'error': 'No file selected.'}), 400

    # Extension allowlist check
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': 'File type not allowed. Please upload a PNG, JPG, JPEG, or WEBP image.'}), 400

    # Magic-byte + Pillow decode check
    ok, err_msg, file_bytes = _validate_search_image(file)
    if not ok:
        return jsonify({'error': err_msg}), 400

    temp_dir = os.path.join(IMAGES_DIR, 'temp_search')
    os.makedirs(temp_dir, exist_ok=True)
    filename = f"search_{uuid.uuid4().hex}.{ext}"
    temp_path = os.path.join(temp_dir, filename)
    with open(temp_path, 'wb') as fout:
        fout.write(file_bytes)

    try:
        detected_color, detected_hex, query_rgb, query_swatches = extract_full_palette(temp_path, k=6)

        if not query_swatches or len(query_swatches) == 0:
            raise RuntimeError("empty swatches")

        top_swatch_pct = (query_swatches[0] or {}).get('percentage', 0) or 0
        all_swatch_names = [
            simple_palette_keyword((s or {}).get('name', '')) or ''
            for s in query_swatches
        ]

        if top_swatch_pct < 25:
            try:
                alt_c, alt_h, alt_rgb, alt_sw = extract_dominant_color(temp_path)
                if alt_sw and len(alt_sw) > len(query_swatches):
                    detected_color, detected_hex, query_rgb, query_swatches = alt_c, alt_h, alt_rgb, alt_sw
            except Exception:
                pass
    except Exception:
        detected_color, detected_hex, query_rgb, query_swatches = extract_dominant_color(temp_path)

    try:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception:
        pass

    outfits = Outfit.query.filter_by(is_active=True).all()
    if not outfits:
        return jsonify({
            'query_color': detected_color,
            'query_hex': detected_hex,
            'query_rgb': list(query_rgb) if query_rgb else None,
            'results': [],
            'total_found': 0,
            'palette_swatches': query_swatches[:4] if query_swatches else []
        }), 200

    query_rgb_t = tuple(int(c) for c in (query_rgb or (15, 28, 64)))
    detected_simple = simple_palette_keyword(detected_color) or ''

    detected_color_lower = detected_color.lower()
    occasion_hints = []
    category_hint_tokens = []
    for term in ['casual', 'office', 'party', 'traditional', 'formal',
                 'summer', 'winter', 'brunch', 'date', 'wedding', 'street']:
        if term in detected_color_lower:
            occasion_hints.append(term)

    scored = []
    newly_extracted_count = 0

    for outfit in outfits:
        item_data = outfit.to_dict()
        outfit_swatches, outfit_rgb = get_outfit_palette_and_rgb(outfit)

        palette_sim = 0.0
        if query_swatches and outfit_swatches:
            try:
                palette_sim = palette_similarity(query_swatches, outfit_swatches)
            except Exception:
                palette_sim = 0.0

        top_delta_e = 100.0
        single_color_sim_2000 = 0.0
        if query_rgb_t and outfit_rgb:
            try:
                q_lab = rgb_to_lab(query_rgb_t)
                o_lab = rgb_to_lab(outfit_rgb)
                top_delta_e = delta_e_cie2000(q_lab, o_lab)
                single_color_sim_2000 = max(0.0, 1.0 - (top_delta_e / 100.0))
            except Exception:
                top_delta_e = 100.0
                single_color_sim_2000 = 0.0

        if palette_sim <= 0.05 and single_color_sim_2000 > 0:
            palette_sim = 0.5 * single_color_sim_2000 + 0.5 * min(1.0, palette_sim + 0.1)

        primary_simple = simple_palette_keyword(outfit.primary_color or '') or ''
        color_name_boost = 0.0
        if detected_simple and primary_simple:
            if detected_simple == primary_simple:
                color_name_boost = 1.0
            else:
                opc = (outfit.primary_color or '').lower()
                dc = detected_color.lower()
                if detected_simple.lower() in opc or opc in dc:
                    color_name_boost = 0.5

        outfit_swatches_colors = [
            simple_palette_keyword(s.get('name', '')) for s in (outfit_swatches or []) if s.get('name')
        ]
        secondary_color_match = 0.0
        if query_swatches:
            query_colors = [
                simple_palette_keyword(s.get('name', '')) for s in query_swatches if s.get('name')
            ]
            overlap = set(qc for qc in query_colors if qc) & set(oc for oc in outfit_swatches_colors if oc)
            if overlap:
                secondary_color_match = min(1.0, len(overlap) / max(1, len(set(query_colors))))

        occ_boost = occasion_match_score(occasion_hints, outfit.occasion or '')
        cat_boost = category_style_similarity(' '.join(occasion_hints + category_hint_tokens), outfit)

        likes_boost = min(1.0, (outfit.likes or 0) * 0.02)

        w_palette = 0.62
        w_color_name = 0.10
        w_secondary = 0.08
        w_occasion = 0.08
        w_category = 0.07
        w_likes = 0.05

        raw_score = (
            w_palette * palette_sim
            + w_color_name * color_name_boost
            + w_secondary * secondary_color_match
            + w_occasion * occ_boost
            + w_category * cat_boost
            + w_likes * likes_boost
        )

        raw_score = max(0.0, min(1.0, raw_score))
        match_percentage = max(28, min(99, int(round(raw_score * 100))))

        reason = build_match_reason(palette_sim, color_name_boost, occ_boost, cat_boost, top_delta_e)

        scored.append({
            '_raw': raw_score,
            '_de': top_delta_e,
            'item': {
                **item_data,
                'match_score': match_percentage,
                'match_reason': reason,
                'delta_e': round(top_delta_e, 1),
                'color_similarity': round((palette_sim * 0.7 + single_color_sim_2000 * 0.3) * 100, 1),
                'extracted_hex': (outfit.extra_metadata or {}).get('extracted_hex'),
                'palette_swatches': outfit_swatches[:3] if outfit_swatches else [],
            }
        })

    scored.sort(key=lambda s: (s['_raw'], -s['_de']), reverse=True)
    results = [s['item'] for s in scored]

    return jsonify({
        'query_color': detected_color,
        'query_hex': detected_hex,
        'query_rgb': list(query_rgb_t),
        'palette_swatches': query_swatches[:4] if query_swatches else [],
        'results': results[:12],
        'total_found': len(results),
        'top_match_delta_e': round(scored[0]['_de'], 1) if scored else None,
        'palette_index_count': len([o for o in outfits if (o.extra_metadata or {}).get('palette_swatches')]),
        'newly_indexed': newly_extracted_count,
    }), 200


@search_bp.route('/semantic', methods=['GET'])
def semantic_search():
    """Semantic search matching descriptive prompts like 'pastel summer brunch'."""
    q = request.args.get('q', '').strip().lower()
    if not q:
        return jsonify({'results': []}), 200

    tokens = [t for t in q.split() if len(t) >= 2]
    outfits = Outfit.query.filter_by(is_active=True).all()
    ranked = []

    for item in outfits:
        score = 0
        meta = item.extra_metadata or {}
        description = meta.get('description', '') or ''
        extracted = meta.get('extracted_color', '') or ''
        palette_names = ' '.join(
            s.get('name', '') for s in (meta.get('palette_swatches') or []) if isinstance(s, dict)
        )
        text_corpus = (f"{item.name or ''} {item.occasion or ''} {item.category or ''} "
                       f"{item.primary_color or ''} {description} {extracted} {palette_names}").lower()

        for token in tokens:
            if token in text_corpus:
                score += 25

        if score > 0:
            ranked.append({
                **item.to_dict(),
                'relevance_score': min(98, score + 40)
            })

    ranked.sort(key=lambda x: x['relevance_score'], reverse=True)

    if not ranked:
        fallback = sorted(outfits, key=lambda o: -(o.likes or 0))[:8]
        ranked = [{**o.to_dict(), 'relevance_score': 65} for o in fallback]

    return jsonify({
        'query': q,
        'results': ranked[:12]
    }), 200


@search_bp.route('/index/outfits', methods=['POST'])
@admin_required
def index_outfit_palettes():
    """On-demand background endpoint: extract & persist palettes for all outfits."""
    outfits = Outfit.query.filter_by(is_active=True).all()
    processed = 0
    failed = 0
    already = 0

    for outfit in outfits:
        meta = outfit.extra_metadata or {}
        if meta.get('palette_swatches') and isinstance(meta.get('palette_swatches'), list):
            already += 1
            continue
        try:
            _, _, did_new = extract_outfit_palette(outfit)
            if did_new:
                processed += 1
            else:
                failed += 1
        except Exception:
            failed += 1

    return jsonify({
        'total': len(outfits),
        'already_indexed': already,
        'newly_indexed': processed,
        'failed': failed,
    }), 200

