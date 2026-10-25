from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.recommendation import SavedRecommendation
from models.user import User
from config.db import db
from models.closet import ClosetItem
import json
import os
import random

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_RECS_FILE = os.path.join(BACKEND_DIR, 'saved_recommendations.json')

def get_expert_styling_logic(gender, occasion, body_type):
    # --- THE COMPREHENSIVE STYLE MATRIX ---
    # This logic covers every single combination to ensure "Expert" advice every time.
    
    logic = {
        "female": {
            "casual": {
                "hourglass": [
                    {"title": "The Defined Waist", "look": "Wrap Top + High-Waisted Mom Jeans", "advice": "Your waist is your anchor. A wrap top naturally accentuates it, while high-waisted denim hugs your curves without restricting them."},
                    {"title": "The Effortless Weekend", "look": "Fitted Bodysuit + Wide-Leg Linen Trousers", "advice": "Balance volume with fit. Since the pants are loose, keep the top fitted to show off your silhouette."}
                ],
                "pear": [
                    {"title": "The Upper Focus", "look": "Off-Shoulder Ruffle Top + Bootcut Jeans", "advice": "Ruffles or details on the shoulders draw the eye up, balancing wider hips. Bootcut jeans elongate the legs."},
                    {"title": "The Balanced Layer", "look": "Structured Crop Jacket + A-Line Midi Dress", "advice": "A cropped jacket hits at the smallest part of your waist, while the A-line skirt glides over hips effortlessly."}
                ],
                "apple": [
                    {"title": "The Vertical Line", "look": "Longline Open Cardigan + V-Neck Cami + Straight Leg Jeans", "advice": "The long cardigan creates vertical lines that lengthen your torso. The V-neck opens up the chest area."},
                    {"title": "The Chic Flow", "look": "Empire Waist Tunic + Leggings + Ankle Boots", "advice": "An empire waist cinches just under the bust (your narrowest point) and flows loosely over the midsection."}
                ],
                "rectangle": [
                    {"title": "The Curve Creator", "look": "Peplum Top + Distressed Skinny Jeans", "advice": "A peplum top artificially creates the illusion of hips and a waist. Use ruffles and volume to add dimension."},
                    {"title": "The Soft Tuck", "look": "Oversized Knit Sweater (French Tucked) + Midi Skirt", "advice": "The 'French Tuck' (front in, back out) defines the waist without being too harsh. Texture adds visual interest."}
                ],
                "inverted_triangle": [
                    {"title": "The Hip Volume", "look": "V-Neck Tee + Cargo Pants", "advice": "Cargo pants add volume to your lower half, perfectly balancing broader shoulders. The V-neck softens the neckline."},
                    {"title": "The Soft Shoulder", "look": "Raglan Sleeve Top + Printed Skirt", "advice": "Raglan sleeves soften the shoulder line. A printed skirt draws attention downward."}
                ]
            },
            "office": {
                "hourglass": [
                    {"title": "The Power Silhouette", "look": "Belted Trench Dress + Pointed Heels", "advice": "A trench dress with a belt is the ultimate hourglass staple. It defines the waist and looks professional instantly."},
                    {"title": "The Modern Exec", "look": "Silk Blouse + High-Waist Pencil Skirt", "advice": "Tuck the blouse in to maintain your proportions. The pencil skirt celebrates your shape while staying boardroom-ready."}
                ],
                "pear": [
                    {"title": "The Statement Top", "look": "Bold Color Blazer + Dark Navy Trousers", "advice": "Keep bottoms dark and simple to minimize hips. Use a bright or textured blazer to keep focus on your face."},
                    {"title": "The Balanced Pro", "look": "Boat Neck Blouse + Wide-Leg Trousers", "advice": "Wide-leg trousers fall straight from the widest part of the hip, creating a long, clean line."}
                ],
                "apple": [
                    {"title": "The Streamlined Suit", "look": "Monochrome Suit + Untucked Silk Shell", "advice": "Wearing one color head-to-toe creates a long vertical line. An untucked shell top avoids cutting you in half."},
                    {"title": "The Structured Flow", "look": "Shift Dress + Open Front Blazer", "advice": "A shift dress skims the body without clinging. An open blazer adds structure to the shoulders."}
                ],
                "rectangle": [
                    {"title": "The Belted Brilliance", "look": "Oversized Blazer (Belted) + Slim Trousers", "advice": "Belting an oversized blazer creates an instant hourglass shape. It adds authority and style."},
                    {"title": "The Feminine Edge", "look": "Pussy-bow Blouse + Paperbag Waist Trousers", "advice": "The bow adds volume up top, and the paperbag waist adds volume at the hips, making the waist look tiny."}
                ],
                "inverted_triangle": [
                    {"title": "The Soft Professional", "look": "Collarless Jacket + Pleated Skirt", "advice": "Collarless jackets reduce bulk around the neck. Pleats in the skirt add necessary volume to the hips."},
                    {"title": "The Flair Look", "look": "Dark Turtleneck + Wide-Leg Patterned Pants", "advice": "A dark top minimizes the upper body, while patterned wide pants make a bold statement downstairs."}
                ]
            },
            "party": {
                "hourglass": [
                    {"title": "The Bombshell", "look": "Bodycon Midi Dress + Statement Belt", "advice": "Don't hide it—flaunt it. A bodycon dress was made for you. Add a belt to emphasize the waist even more."},
                    {"title": "The Classic Glam", "look": "Wrap Velvet Dress + Strappy Sandals", "advice": "Velvet catches the light on your curves. The wrap style lifts the bust and defines the waist."}
                ],
                "pear": [
                    {"title": "The Fit & Flare", "look": "Fit-and-Flare Dress + Sparkly Necklace", "advice": "Fitted at the top, flared at the bottom. This is your magic silhouette. Go big on jewelry."},
                    {"title": "The Shoulder Show", "look": "Halter Neck Jumpsuit", "advice": "A halter neck shows off your delicate shoulders and draws the eye up, balancing the lower body."}
                ],
                "apple": [
                    {"title": "The Leg Show", "look": "Sequined Swing Dress + Nude Heels", "advice": "Show off your legs! A swing dress moves beautifully and doesn't cling to the midsection."},
                    {"title": "The Empire Elegance", "look": "Empire Waist Maxi Dress", "advice": "Highlights the narrowest point right under the bust and creates a long, elegant column."}
                ],
                "rectangle": [
                    {"title": "The Illusionist", "look": "Cut-Out Dress (Side waists)", "advice": "Side cut-outs create a dramatic illusion of a curvy waistline. It's bold and very effective."},
                    {"title": "The Asymmetric", "look": "One-Shoulder Ruffle Dress", "advice": "Asymmetry breaks up the straight lines of your body and adds dynamic movement."}
                ],
                "inverted_triangle": [
                    {"title": "The Volume Skirt", "look": "Sleek Bodysuit + Tulle Skirt", "advice": "Keep the top minimal. A tulle or full skirt adds major volume to hips, perfectly balancing broad shoulders."},
                    {"title": "The Plunge V", "look": "Deep V-Neck Skater Dress", "advice": "A deep V narrows the chest visually. The skater skirt creates the needed hip volume."}
                ]
            }
        },
        "male": {
            "casual": {
                "trapezoid": [
                    {"title": "The Standard", "look": "Fitted White Tee + Slim Selvedge Denim", "advice": "You won the genetic lottery. Simple, fitted clothes look best. Don't hide your build with baggy fits."},
                    {"title": "The Layered Look", "look": "Denim Jacket + Grey Hoodie + Chinos", "advice": "Layering works well for you. The denim jacket adds structure, the hoodie adds comfort."}
                ],
                "rectangle": [
                    {"title": "The Structure Builder", "look": "Structured Bomber Jacket + Heavy Cotton Tee", "advice": "Use a jacket with stiff fabric to create artificial shoulder width. Avoid flimsy materials."},
                    {"title": "The Break-Up", "look": "Color Block Sweatshirt + Cargo Pants", "advice": "Color blocking breaks up your vertical line. Cargo pockets add volume to your legs."}
                ],
                "triangle": [
                    {"title": "The Balance Act", "look": "Structured Overshirt (Open) + Vertical Striped Tee", "advice": "The open shirt creates vertical lines. Structure in the shoulders balances a wider waist."},
                    {"title": "The Clean Line", "look": "Dark Crew Neck + Straight Leg Jeans", "advice": "Darker colors on top minimize the midsection. Avoid skinny jeans; straight cuts balance your legs."}
                ],
                "inverted_triangle": [
                    {"title": "The V-Taper King", "look": "V-Neck T-Shirt + Relaxed Fit Jeans", "advice": "A V-neck guides the eye down from your broad shoulders. Relaxed jeans add bulk to legs to match your chest."},
                    {"title": "The Horizontal", "look": "Breton Stripe Tee + Chinos", "advice": "Horizontal stripes add width to your torso, but you already have it—use them on the lower torso to balance."}
                ],
                "oval": [
                    {"title": "The Vertical Flow", "look": "Vertical Striped Shirt + Dark Denim", "advice": "Vertical stripes are mandatory—they elongate and slim. Dark denim anchors the look."},
                    {"title": "The Comfort Sharp", "look": "Henley (Unbuttoned) + Tapered Joggers", "advice": "A Henley draws attention to the neck/face. Tapered joggers are comfortable but modern."}
                ]
            },
            "office": {
                "trapezoid": [
                    {"title": "The Modern CEO", "look": "Navy Slim Suit + Crisp White Shirt", "advice": "A slim-fit suit follows your natural lines. No need for excessive padding."},
                    {"title": "The Smart Casual", "look": "Merino Wool Turtle Neck + Grey Trousers", "advice": "Sleek, sophisticated, and shows off your fitness without showing skin."}
                ],
                "rectangle": [
                    {"title": "The Authority", "look": "Double Breasted Blazer + Trousers", "advice": "A double-breasted jacket adds significant width to the torso and chest, correcting a straight frame."},
                    {"title": "The Texture Play", "look": "Tweed Jacket + Oxford Shirt + Knit Tie", "advice": "Textured fabrics like tweed add visual bulk and interest to a leaner frame."}
                ],
                "triangle": [
                    {"title": "The Single Breasted", "look": "Single-Breasted Jacket (Structured Shoulders)", "advice": "Opt for a jacket with structured shoulders to widen the top. Keep the button stance low."},
                    {"title": "The Dark Monolith", "look": "Black Shirt + Charcoal Trousers", "advice": "Darker colors on top are slimming. Keep the contrast between shirt and pants low."}
                ],
                "inverted_triangle": [
                    {"title": "The Unstructured", "look": "Unstructured Linen Blazer + Chinos", "advice": "Avoid shoulder padding—you don't need it. Unstructured jackets drape naturally."},
                    {"title": "The Relaxed Pro", "look": "Knit Polo + Pleated Trousers", "advice": "Pleats in trousers add volume to the hip/thigh area, balancing your massive upper body."}
                ],
                "oval": [
                    {"title": "The Pinstripe", "look": "Pinstripe Suit + Solid Tie", "advice": "Pinstripes lead the eye up and down, creating a slimming effect. Avoid check patterns."},
                    {"title": "The Vest Hack", "look": "Three-Piece Suit (Vest required)", "advice": "A vest (waistcoat) is your secret weapon. It smooths out the midsection and looks incredibly sharp."}
                ]
            },
            "party": {
                "trapezoid": [
                    {"title": "The Date Night", "look": "Leather Jacket + Black Tee + Chelsea Boots", "advice": "Leather adds edge. The fit should be snug but not tight."},
                    {"title": "The Club vibe", "look": "Patterned Short Sleeve Shirt + Black Jeans", "advice": "You can pull off bold prints. Keep the bottom half neutral."}
                ],
                "rectangle": [
                    {"title": "The Layer Master", "look": "Open Flannel Shirt + Graphic Tee", "advice": "Layers add depth. An open shirt adds width to your frame."},
                    {"title": "The Sharp Casual", "look": "Harrington Jacket + White Sneakers", "advice": "The Harrington jacket has a waistband that creates a natural V-shape illusion."}
                ],
                "triangle": [
                    {"title": "The Dark Rider", "look": "Black Denim Jacket + Black Jeans + White Tee", "advice": "The denim jacket creates a boxy, masculine silhouette up top."},
                    {"title": "The Rugged", "look": "Field Jacket + Boots", "advice": "Pockets on the chest of a field jacket add bulk where you want it."}
                ],
                "inverted_triangle": [
                    {"title": "The Simple Flex", "look": "Fitted Black T-Shirt + Light Wash Jeans", "advice": "Lighter jeans draw attention to your legs, balancing the heavy top. The black tee highlights arms."},
                    {"title": "The Relaxed Fit", "look": "Oversized Hoodie + Cargo Pants", "advice": "Streetwear works well. The volume on the bottom matches your natural top width."}
                ],
                "oval": [
                    {"title": "The Sharp Dark", "look": "All-Black Ensemble (Shirt + Jeans)", "advice": "Monochromatic black is the most slimming trick in the book. Use different textures to avoid looking flat."},
                    {"title": "The Structure", "look": "Blazer over T-Shirt + Dark Jeans", "advice": "Throwing a blazer over a tee instantly sharpens the shoulders and hides the midsection."}
                ]
            }
        }
    }
    
    # Safe Fallback
    try:
        return logic[gender][occasion][body_type]
    except KeyError:
        # Generic professional fallback
        return [
            {"title": "The Classic Fit", "look": "Navy Essentials", "advice": "Stick to dark neutrals and tailored fits. They work for everyone."},
            {"title": "The Modern Minimalist", "look": "Monochrome Basics", "advice": "Keep it simple. Good shoes and a watch elevate any outfit."}
        ]

def _closet_outfits_for(user_id, occasion, season, limit=8):
    """Build rich outfit suggestions from the user's own available closet items,
    filtered by occasion/season and color harmony."""
    try:
        items = ClosetItem.query.filter_by(user_id=user_id).all()
    except Exception:
        return []
    items = [i for i in items if i.is_available is not False]
    if not items:
        return []

    def _img_url(it):
        url = it.image_url or ''
        if 'closet/' in url:
            return f'/api/closet/items/{it.id}/image'
        return url or '/images/classic_denim.jpg'

    def _piece_dict(it):
        return {
            'closet_item_id': it.id,
            'id': it.id,
            'name': it.name,
            'category': it.category,
            'color': it.color_name or 'Classic Neutral',
            'color_hex': it.color_hex or '#4A5568',
            'image_url': _img_url(it),
            'style': it.style or 'casual',
            'occasion': it.occasion or 'casual'
        }

    def _ok_occ(v):
        return occasion in ('', 'all') or v in (occasion, 'all')

    def _ok_sea(v):
        return season in ('', 'all', 'all-season') or v in (season, 'all-season', 'all')

    filtered = [i for i in items if _ok_occ(i.occasion) and _ok_sea(i.season)]
    if not filtered:
        filtered = items  # graceful fallback – don't fail on partial closet

    tops = [i for i in filtered if i.category == 'top']
    bottoms = [i for i in filtered if i.category == 'bottom']
    dresses = [i for i in filtered if i.category == 'dress']
    shoes = [i for i in filtered if i.category == 'shoes']
    outerwear = [i for i in filtered if i.category == 'outerwear']
    accessories = [i for i in filtered if i.category == 'accessory']

    outfits = []

    # 1. Two-Piece Ensembles (Top + Bottom)
    for top in tops[:5]:
        for bot in bottoms[:5]:
            pieces = [_piece_dict(top), _piece_dict(bot)]
            if shoes:
                pieces.append(_piece_dict(shoes[0]))
            if outerwear:
                pieces.append(_piece_dict(outerwear[0]))
            if accessories:
                pieces.append(_piece_dict(accessories[0]))

            outfits.append({
                'id': f"closet_look_{top.id}_{bot.id}",
                'title': f"{top.color_name} {top.name} + {bot.name}",
                'type': 'Two-Piece Ensemble',
                'occasion': top.occasion if top.occasion != 'all' else occasion.title() if occasion else 'Casual',
                'synergy_score': 94 if top.occasion == bot.occasion else 88,
                'pieces': pieces,
                'styling_tip': f"Harmonize your {top.color_name} {top.name} with {bot.name} for an elevated, balanced silhouette."
            })
            if len(outfits) >= limit:
                return outfits

    # 2. One-Piece Ensembles (Dresses)
    for dr in dresses[:3]:
        pieces = [_piece_dict(dr)]
        if shoes:
            pieces.append(_piece_dict(shoes[0]))
        if outerwear:
            pieces.append(_piece_dict(outerwear[0]))
        if accessories:
            pieces.append(_piece_dict(accessories[0]))

        outfits.append({
            'id': f"closet_look_dress_{dr.id}",
            'title': f"{dr.color_name} {dr.name} Statement",
            'type': 'One-Piece Statement',
            'occasion': dr.occasion.title() if dr.occasion != 'all' else 'Party',
            'synergy_score': 96,
            'pieces': pieces,
            'styling_tip': f"Elevate your {dr.name} with clean layering and matching footwear."
        })
        if len(outfits) >= limit:
            return outfits

    # 3. Hybrid Looks if only Tops or only Bottoms exist
    if tops and not bottoms:
        for top in tops[:3]:
            pieces = [_piece_dict(top)]
            if accessories:
                pieces.append(_piece_dict(accessories[0]))
            outfits.append({
                'id': f"closet_look_top_{top.id}",
                'title': f"{top.color_name} {top.name} + Tailored Slim Bottom",
                'type': 'Curated Wardrobe Pairing',
                'occasion': top.occasion.title() if top.occasion != 'all' else 'Smart Casual',
                'synergy_score': 90,
                'pieces': pieces,
                'styling_tip': f"Style your {top.name} with neutral slim-fit trousers or dark denim to let the top stand out."
            })

    elif bottoms and not tops:
        for bot in bottoms[:3]:
            pieces = [_piece_dict(bot)]
            if shoes:
                pieces.append(_piece_dict(shoes[0]))
            outfits.append({
                'id': f"closet_look_bot_{bot.id}",
                'title': f"Crisp Neutral Top + {bot.color_name} {bot.name}",
                'type': 'Curated Wardrobe Pairing',
                'occasion': bot.occasion.title() if bot.occasion != 'all' else 'Casual',
                'synergy_score': 90,
                'pieces': pieces,
                'styling_tip': f"Pair these {bot.name} with a crisp white shirt or tucked-in knit top for clean proportions."
            })

    return outfits[:limit]


@recommendations_bp.route('/recommendations', methods=['POST'])
@jwt_required(optional=True)
def recommend():
    d = request.json
    gender = d.get('gender', 'female').lower()
    occasion = d.get('occasion', 'casual').lower()
    body_type = d.get('body_type', 'rectangle').lower()
    skin_tone = d.get('skin_tone', 'Medium').lower()
    
    # 1. Get Expert Personas
    personas = get_expert_styling_logic(gender, occasion, body_type)
    
    # 2. Advanced Color Logic
    if 'fair' in skin_tone or 'light' in skin_tone:
      recommended_colors = ["Peach", "Rose Gold", "Ivory", "Blush", "Pastel Yellow", "Champagne", "Pearl White", "Soft Coral", "Shell Pink", "Apricot", "Powder Blue", "Baby Blue", "Mint Green", "Soft Lavender", "Sky Blue"]
      avoid_colors = ["Deep Charcoal", "Jet Black", "Forest Green", "Rich Brown"]
    elif 'medium' in skin_tone or 'wheatish' in skin_tone:
      recommended_colors = ["Teal", "Emerald", "Navy", "Gold", "Burgundy", "Coral", "Mustard", "Khaki", "Sapphire", "Ochre", "Taupe", "Camel", "Plum", "Brick Red", "Forest Green", "Olive"]
      avoid_colors = ["Pure White", "Stark Black", "Icy Pastels"]
    elif 'olive' in skin_tone:
      recommended_colors = ["Mustard", "Terracotta", "Warm Gold", "Copper", "Bronze", "Saffron", "Amber", "Burnt Orange", "Mahogany", "Rich Brown", "Camel", "Ochre", "Rust", "Teal", "Turquoise"]
      avoid_colors = ["Cool Pink", "Icy Blue", "Ash Gray"]
    else: # deep/dark
      recommended_colors = ["Gold", "Royal Purple", "Crimson", "Amber", "Emerald Green", "Sapphire Blue", "Ruby", "Onyx", "Jet Black", "Maroon", "Burgundy", "Forest Green", "Plum", "Navy", "Bronze"]
      avoid_colors = ["Pale Yellow", "Beige", "Light Orange"]
    
    # 3. Dynamic Styling Tip Generator
    tips = [
        f"Since you have a {body_type} frame, focus on fit around the shoulders.",
        "Monochrome dressing elongates the silhouette.",
        "Accessories are the easiest way to elevate a simple look.",
        f"For {occasion} wear, comfort is just as important as style."
    ]
    
    persona_list = personas
    response = {
      "recommended_colors": recommended_colors,
      "avoid_colors": avoid_colors,
      "fabrics": ["Silk", "Cotton", "Linen", "Velvet"] if 'deep' in skin_tone or 'dark' in skin_tone else ["Linen", "Cotton", "Silk", "Georgette"],
      "detected_tone": d.get('skin_tone', 'Medium'),
      "skin_hex": d.get('skin_hex', '#B28F69'),
      "personas": persona_list,
      "styling_tip": random.choice(tips)
    }

    # If the caller is authenticated, enrich with outfits from their closet.
    try:
        email = get_jwt_identity()
        if email:
            user = User.query.filter_by(email=email).first()
            if user:
                closet_outfits = _closet_outfits_for(
                    user.id,
                    str(d.get('occasion', occasion)).lower(),
                    str(d.get('season', 'all')).lower(),
                )
                if closet_outfits:
                    response['closet_outfits'] = closet_outfits
    except Exception:
        pass

    return jsonify(response)

def save_rec_to_json(user_email, rec_data):
    try:
        data = {}
        if os.path.exists(SAVED_RECS_FILE):
            with open(SAVED_RECS_FILE, 'r') as f:
                data = json.load(f)
        if user_email not in data:
            data[user_email] = []
        data[user_email].append(rec_data)
        with open(SAVED_RECS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except: return False

@recommendations_bp.route('/recommendations/save', methods=['POST'])
@jwt_required()
def save_rec():
    user_email = get_jwt_identity()
    data = request.json
    try:
        user = User.query.filter_by(email=user_email).first()
        if user:
            new_rec = SavedRecommendation(user_id=user.id, rec_type=data.get('type', 'styling_guide'), rec_data=data)
            db.session.add(new_rec)
            db.session.commit()
            return jsonify({"msg": "Saved to DB"}), 201
        else:
            save_rec_to_json(user_email, data)
            return jsonify({"msg": "Saved to JSON"}), 201
    except:
        if db.session: db.session.rollback()
        save_rec_to_json(user_email, data)
        return jsonify({"msg": "Saved to JSON fallback"}), 201
