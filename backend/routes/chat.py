import os
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

from config.db import db
from models.outfit import Outfit
from models.like import Like
from models.user import User
from models.closet import ClosetItem

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

chat_bp = Blueprint('chat', __name__, url_prefix='/api')

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIKES_FILE = os.path.join(BACKEND_DIR, 'likes.json')
GALLERY_FILE = os.path.join(BACKEND_DIR, 'gallery.json')

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key, timeout=8.0)
    except Exception as e:
        print(f"DEBUG: Groq client init failed: {e}")
        return None

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-1.5-flash')
    except Exception as e:
        print(f"DEBUG: Gemini init failed: {e}")
        return None

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        return OpenAI(api_key=api_key, timeout=6.0)
    except Exception as e:
        print(f"DEBUG: OpenAI client init failed: {e}")
        return None

# ==============================================================================
# FASHION DOMAIN SYSTEM PROMPT
# ==============================================================================
FASHION_SYSTEM_PROMPT = """
You are 'FashionPro AI' (also known as StyleSync Pro), an elite personal fashion stylist and image consultant.
You possess deep expertise in color theory, seasonal color analysis, body geometry/silhouettes, fabric textures, occasion aesthetics, and contemporary fashion trends.

YOUR CORE MISSION:
Provide hyper-personalized, fashion-forward, practical advice tailored specifically to the user's profile, likes, wardrobe, and current query.

FASHION KNOWLEDGE RULES:
1. **BODY SILHOUETTES**:
   - **Hourglass**: Emphasize natural waist definition (wrap tops, belted blazers, high-waisted bottoms).
   - **Pear / Triangle**: Add structure and volume to shoulders and chest (boat necks, puff sleeves, structured collars, A-line skirts/straight-leg trousers) to balance proportions.
   - **Rectangle / Athletic**: Create curves and dimension (cinched waists, peplum, pleated trousers, layering, belt accents).
   - **Apple / Round**: Elongate torso with V-necks, empire waists, structured tailored jackets, fluid vertical silhouettes.
   - **Trapezoid / Inverted Triangle**: Balance broad shoulders with clean tops, wide-leg or straight trousers, avoiding heavy shoulder pads.

2. **SEASONAL COLOR THEORY & UNDERTONES**:
   - **Summer Palette**: Cool, soft, muted tones (Powder Blue, Lavender, Rose Quartz, Sage Green, Slate Grey, Soft White, Mint).
   - **Spring Palette**: Warm, light, clear tones (Coral, Peach, Warm Cream, Butter Yellow, Aqua, Golden Brown).
   - **Autumn Palette**: Warm, deep, earthy tones (Rust, Olive, Terracotta, Mustard, Forest Green, Camel, Burnt Orange).
   - **Winter Palette**: Cool, vivid, high-contrast tones (Cobalt Blue, Emerald Green, Pure White, Jet Black, Royal Purple, Fuchsia).
   - **Skin Tones**:
     - Fair: Soft pastels, emerald, ruby, rose, navy. Avoid washed-out beige without contrast.
     - Medium / Wheatish: Rich jewel tones, warm terracotta, olive, mustard, navy, plum, warm gold.
     - Deep / Dark: High-contrast electric hues, cobalt, tangerine, crisp white, metallic gold, rich magenta.

3. **USER CONTEXT AWARENESS**:
   - Always take into account the user's **gender**, **body shape**, **skin tone**, **style vibe**, **weather**, **liked outfits**, and **closet pieces** provided in the profile below.
   - If the user has liked outfits or items in their closet, actively reference them or suggest matching pieces that complement them!
   - If available gallery outfits from the app catalog match the vibe, mention them by name or style (e.g., "You can check out our gallery look '{look_name}' for inspiration").

4. **RESPONSE FORMATTING ADAPTABILITY**:
   - **Case A: When user asks for an OUTFIT / LOOK recommendation (e.g. "suggest an office outfit", "what to wear to a wedding")**:
     Always structure using clear sections so the app can format it beautifully:
     ### Style Analysis for [User Gender] ([Body Type] Body)
     ✨ Outfit Recommendation:
     - Occasion: [Occasion]
     - Top: [Specific garment, cut, neckline, & color]
     - Bottom: [Specific trouser/skirt fit, rise, & fabric]
     - Footwear: [Specific shoes & color]

     💡 Fit Advice:
     - [Detailed reason why these cuts and silhouettes flatter this specific body type]

     🎨 Best Colors:
     - [4-6 cohesive, curated colors with palette explanation]

     🧵 Fabric & 👜 Accessories:
     - Fabric: [Weather-appropriate fabric recommendations]
     - Accessories: [Jewelry, bag, belt, watch]
     - Closet/Gallery Tie-in: [Suggest how to pair with their liked items or wardrobe if applicable]

   - **Case B: When user asks about COLORS (e.g. "summer colors", "colors for fair skin", "what matches navy")**:
     Do NOT force an outfit template. Provide an in-depth, expert color-theory breakdown:
     - Core Neutral Bases (e.g., Linen White, Soft Taupe, Oat)
     - Primary Statement Shades (e.g., Seafoam Green, Dusty Coral, Cornflower Blue)
     - Accent & Pop Colors (e.g., Lemon Sorbet, Icy Lilac)
     - Styling Rule: How to pair these colors (e.g., 60-30-10 rule, high vs low contrast) based on their skin tone and the current season.

   - **Case C: General styling queries, accessories, or feedback**:
     Respond warmly, concisely, and authoritatively as a high-end fashion consultant.
"""

def extract_user_context(data, email=None):
    """Gathers user profile, liked outfits, digital closet items, and gallery catalog."""
    user = None
    if email:
        user = User.query.filter_by(email=email).first()

    # Profile attributes (Request payload takes precedence, fallback to user DB)
    gender = data.get('gender') or (user.gender if user else 'female')
    style_preference = data.get('style_preference') or 'Casual'
    skin_tone = data.get('skin_tone') or 'Medium'
    body_type = data.get('body_type') or 'Rectangle'
    occasion = data.get('occasion')
    weather = data.get('weather')

    # 1. Fetch User Likes (from DB or legacy likes.json)
    liked_items = []
    if user:
        try:
            db_likes = db.session.query(Outfit).join(Like, Like.outfit_id == Outfit.id).filter(Like.user_id == user.id).limit(6).all()
            for o in db_likes:
                liked_items.append(f"{o.name} ({o.occasion}, {o.primary_color or 'multicolor'})")
        except Exception as e:
            print(f"DEBUG: DB like query failed: {e}")

    if not liked_items and email and os.path.exists(LIKES_FILE):
        try:
            with open(LIKES_FILE, 'r') as f:
                likes_json = json.load(f)
                user_likes = likes_json.get(email, [])
                for item in user_likes[:5]:
                    name = item.get('name') or f"Look #{item.get('id')}"
                    occ = item.get('occasion', 'General')
                    liked_items.append(f"{name} ({occ})")
        except Exception as e:
            print(f"DEBUG: JSON likes load failed: {e}")

    # 2. Fetch User Closet Items (Digital Wardrobe)
    closet_items = []
    if user:
        try:
            user_closet = ClosetItem.query.filter_by(user_id=user.id).limit(8).all()
            for item in user_closet:
                closet_items.append(f"{item.color_name or ''} {item.name} ({item.category}, {item.occasion})".strip())
        except Exception as e:
            print(f"DEBUG: Closet query failed: {e}")

    # 3. Fetch Relevant Gallery Outfits from Catalog
    gallery_suggestions = []
    try:
        query = Outfit.query.filter_by(is_active=True)
        if occasion:
            query = query.filter(Outfit.occasion.ilike(f"%{occasion}%"))
        sample_outfits = query.order_by(Outfit.likes.desc()).limit(5).all()
        for o in sample_outfits:
            gallery_suggestions.append(f"'{o.name}' ({o.occasion} - {o.category or 'Style'})")
    except Exception as e:
        print(f"DEBUG: Outfit query failed: {e}")

    return {
        'gender': gender.lower() if gender else 'female',
        'style_preference': style_preference,
        'skin_tone': skin_tone,
        'body_type': body_type,
        'occasion': occasion,
        'weather': weather,
        'liked_items': liked_items,
        'closet_items': closet_items,
        'gallery_suggestions': gallery_suggestions,
        'user_name': user.name if user else None
    }

def build_profile_prompt(ctx):
    """Builds the comprehensive user profile section to inject into the LLM."""
    lines = [
        "--- CURRENT USER PROFILE & CONTEXT ---",
        f"• Gender: {ctx['gender'].title()}",
        f"• Body Type: {ctx['body_type'].title()}",
        f"• Skin Tone: {ctx['skin_tone'].title()}",
        f"• Preferred Style Vibe: {ctx['style_preference']}"
    ]
    if ctx.get('user_name'):
        lines.append(f"• User Name: {ctx['user_name']}")
    if ctx.get('occasion'):
        lines.append(f"• Target Occasion: {ctx['occasion'].title()}")
    if ctx.get('weather'):
        lines.append(f"• Local Weather / Climate: {ctx['weather']}")

    if ctx.get('liked_items'):
        lines.append(f"• Outfits User Has Liked: {', '.join(ctx['liked_items'])}")
    else:
        lines.append("• Outfits User Has Liked: None saved yet")

    if ctx.get('closet_items'):
        lines.append(f"• User's Wardrobe (Closet Pieces): {', '.join(ctx['closet_items'])}")

    if ctx.get('gallery_suggestions'):
        lines.append(f"• Available Outfits in App Gallery: {', '.join(ctx['gallery_suggestions'])}")

    lines.append("--------------------------------------")
    return "\n".join(lines)

@chat_bp.route('/ai-chat', methods=['POST'])
@jwt_required(optional=True)
def ai_chat():
    data = request.json or {}
    user_message = data.get('message', '').strip()
    history = data.get('history', [])
    
    if not user_message:
        return jsonify({'reply': "Hello! I am your FashionPro stylist. How can I help you elevate your style today? ✨", 'engine': 'none'})

    # 1. Identify User Identity if JWT present
    current_email = get_jwt_identity()

    # 2. Extract Context and Database Knowledge
    ctx = extract_user_context(data, email=current_email)

    # 3. Detect occasion keyword from user message if not explicitly passed
    msg_lower = user_message.lower()
    occasion_map = {
        'wedding': 'Wedding', 'shadi': 'Wedding', 'marriage': 'Wedding', 'reception': 'Wedding', 'sangeet': 'Wedding',
        'office': 'Office', 'work': 'Office', 'formal': 'Office', 'interview': 'Office', 'corporate': 'Office',
        'party': 'Party', 'club': 'Party', 'night out': 'Party', 'cocktail': 'Party',
        'casual': 'Casual', 'everyday': 'Casual', 'brunch': 'Casual', 'outing': 'Casual',
        'college': 'College', 'university': 'College', 'class': 'College', 'campus': 'College',
        'date': 'Date', 'romantic': 'Date', 'dinner': 'Date',
        'festival': 'Festival', 'diwali': 'Festival', 'eid': 'Festival', 'festive': 'Festival',
        'travel': 'Travel', 'vacation': 'Travel', 'trip': 'Travel', 'airport': 'Travel', 'beach': 'Travel'
    }
    if not ctx['occasion']:
        for kw, occ in occasion_map.items():
            if kw in msg_lower:
                ctx['occasion'] = occ
                break

    # 4. Construct System Prompt with Dynamic User Context
    profile_text = build_profile_prompt(ctx)
    full_system_prompt = f"{FASHION_SYSTEM_PROMPT}\n\n{profile_text}"

    # Prepare chat messages for OpenAI/Groq specification
    formatted_messages = [{"role": "system", "content": full_system_prompt}]
    for msg in history[-8:]:  # Keep recent context
        role = "user" if msg.get('type') == 'user' else "assistant"
        content = msg.get('text', '')
        if content:
            formatted_messages.append({"role": role, "content": content})
    formatted_messages.append({"role": "user", "content": user_message})

    # 5. Model Execution Strategy: Groq -> Gemini -> OpenAI -> Smart Fallback
    
    # Tier 1: Try Groq API
    groq_client = get_groq_client()
    if groq_client:
        groq_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
        for g_model in groq_models:
            try:
                response = groq_client.chat.completions.create(
                    model=g_model,
                    messages=formatted_messages,
                    max_tokens=900,
                    temperature=0.7,
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                )
                reply = response.choices[0].message.content
                if reply and reply.strip():
                    return jsonify({'reply': reply, 'engine': 'groq', 'model': g_model})
            except Exception as e:
                print(f"DEBUG: Groq model {g_model} failed: {e}")

    # Tier 2: Try Gemini API
    gemini_model = get_gemini_model()
    if gemini_model:
        try:
            # Combine system prompt with user history for Gemini
            conversation_history = [f"System Instructions:\n{full_system_prompt}\n"]
            for m in formatted_messages[1:]:
                prefix = "User: " if m['role'] == 'user' else "Stylist: "
                conversation_history.append(f"{prefix}{m['content']}")
            gemini_prompt = "\n".join(conversation_history)
            gem_resp = gemini_model.generate_content(gemini_prompt)
            if gem_resp and gem_resp.text:
                return jsonify({'reply': gem_resp.text, 'engine': 'gemini'})
        except Exception as e:
            print(f"DEBUG: Gemini generation failed: {e}")

    # Tier 3: Try OpenAI API
    openai_client = get_openai_client()
    if openai_client:
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=formatted_messages,
                max_tokens=900,
                temperature=0.7
            )
            reply = response.choices[0].message.content
            if reply:
                return jsonify({'reply': reply, 'engine': 'openai'})
        except Exception as e:
            print(f"DEBUG: OpenAI generation failed: {e}")

    # Tier 4: High-Quality Fashion Domain Fallback (Context-Aware)
    return smart_fallback_chat(user_message, ctx)

def professional_fallback_chat(message, gender="female", occasion="Casual", body_type="Rectangle", skin_tone="Medium", style_preference="Casual", weather="pleasant"):
    ctx = {
        'gender': gender,
        'body_type': body_type,
        'skin_tone': skin_tone,
        'style_preference': style_preference,
        'weather': weather,
        'occasion': occasion
    }
    return smart_fallback_chat(message, ctx, engine_name='fallback')

# ==============================================================================
# INTELLIGENT RULE-BASED DOMAIN STYLIST (WHEN AI APIS ARE OFFLINE)
# ==============================================================================
def smart_fallback_chat(user_message, ctx, engine_name='stylist_engine'):
    """High-quality fashion fallback that intelligently answers color queries vs outfit queries."""
    msg = user_message.lower()
    gender = ctx.get('gender') or 'female'
    body_type = ctx.get('body_type') or 'Rectangle'
    skin_tone = ctx.get('skin_tone') or 'Medium'
    style = ctx.get('style_preference') or 'Casual'
    weather = ctx.get('weather') or 'pleasant'
    occasion = ctx.get('occasion') or 'Casual'

    # Check query type: Color Query vs Outfit Query
    color_keywords = ['color', 'colors', 'colour', 'shade', 'palette', 'summer color', 'winter color']
    is_color_query = any(k in msg for k in color_keywords)

    if is_color_query:
        # Determine seasonal or tone-based palette
        if 'summer' in msg:
            palette_title = "Seasonal Color Guide: Summer Palette ☀️"
            core_neutrals = "Crisp Linen White, Light Slate, Soft Sand, Soft Chambray"
            statement_colors = "Powder Blue, Sage Green, Seafoam, Lavender, Dusty Rose"
            accent_pops = "Pale Lemon Sorbet, Pastel Peach, Mint Green"
            styling_tip = "Summer colors thrive on breathable fabrics like linen, slub cotton, and lightweight silk. Aim for a 60-30-10 ratio: 60% cool neutral base, 30% soft pastel statement, 10% vibrant accent accessory."
        elif 'winter' in msg:
            palette_title = "Seasonal Color Guide: Winter Palette ❄️"
            core_neutrals = "Midnight Navy, Jet Black, Charcoal, Crisp Pure White"
            statement_colors = "Emerald Green, Royal Cobalt Blue, Deep Burgundy, Plum"
            accent_pops = "Silver Metallic, Ice Blue, Ruby Red"
            styling_tip = "Create high-contrast combinations. Pair dark structured overcoats with jewel-toned knitwear or silver metallic jewelry."
        elif 'monsoon' in msg or 'rain' in msg:
            palette_title = "Monsoon & Rainy Season Color Guide 🌧️"
            core_neutrals = "Dark Navy, Charcoal Grey, Olive Brown (mud-resistant)"
            statement_colors = "Teal Blue, Mustard Yellow, Forest Green"
            accent_pops = "Bright Tangerine or Cobalt umbrella/footwear accents"
            styling_tip = "Opt for darker base bottoms to resist water splashes, illuminated with joyful saturated jewel tops."
        else:
            # Based on user's skin tone
            palette_title = f"Curated Color Guide for {skin_tone.title()} Skin Tone 🎨"
            if skin_tone.lower() == 'fair':
                core_neutrals = "Soft Navy, Slate Grey, Heather Oatmeal, Rose Taupe"
                statement_colors = "Emerald Green, Royal Sapphire, Soft Lavender, Burgundy"
                accent_pops = "Rose Gold, Coral, Icy Blue"
                styling_tip = "Avoid harsh chalky beiges that blend into your complexion. Saturated jewel tones and soft cool pastels provide the ideal contrast."
            elif skin_tone.lower() == 'dark':
                core_neutrals = "Crisp Pure White, Warm Cream, Camel, Deep Obsidian"
                statement_colors = "Cobalt Blue, Tangerine, Rich Fuchsia, Emerald, Lemon Yellow"
                accent_pops = "Polished Gold, Metallic Bronze, Electric Lime"
                styling_tip = "High-saturation vibrant colors and bright whites look breathtaking against deep complexions, emphasizing radiance."
            else: # Medium / Wheatish
                core_neutrals = "Olive Khaki, Warm Charcoal, Rich Navy, Cream"
                statement_colors = "Mustard Gold, Terracotta, Forest Green, Maroon, Burnt Orange"
                accent_pops = "Warm Champagne Gold, Warm Teal, Plum"
                styling_tip = "Warm earthy tones and rich autumn shades illuminate golden and warm undertones naturally."

        reply = f"""### {palette_title}

🎨 **Best Colors & Core Neutrals**:
- {core_neutrals}

✨ **Hero Statement Colors**:
- {statement_colors}

💎 **Accent Pops**:
- {accent_pops}

💡 **Stylist Rule for {body_type.title()} Body & {style} Vibe**:
- {styling_tip}
- **Wardrobe Tip**: Pair your top and bottoms using harmonious contrast, anchoring with clean minimalist footwear.
"""
        return jsonify({
            'reply': reply,
            'engine': engine_name,
            'category': 'color_guide',
            'quick_replies': ['Outfit Ideas', 'Color Suggestions', 'Summer Colors', 'Office Outfit', 'Accessories Match']
        })

    # Otherwise: Outfit Recommendation Flow
    fit_advice_dict = {
        'Pear': "A-line silhouettes and structured tops balance your waist and hips effortlessly, adding volume to shoulders.",
        'Apple': "V-neck cuts, empire waists, and vertical fluid layers elongate your upper torso beautifully.",
        'Hourglass': "Highlight your natural waistline with belted blazers, tailored wrap silhouettes, and high-rise bottoms.",
        'Rectangle': "Create dimension and curves using peplum accents, belt detailing, and layered outerwear.",
        'Trapezoid': "Maintain your natural proportion with clean tailored shoulders, slim-fit shirts, and tapered bottoms."
    }
    fit_advice = fit_advice_dict.get(body_type.title(), "Opt for clean tailoring that emphasizes comfort and natural posture.")

    outfit_matrix = {
        'Office': {
            'female': ("Crisp Poplin Button-Down Shirt / Structured Silk Blouse", "High-Waisted Tailored Ankle Trousers / Pencil Skirt", "Pointed Nude/Black Block Heels or Loafers", "Structured Leather Tote, Minimalist Gold Watch, Subtle Pearl Studs"),
            'male': ("Light Blue Wrinkle-Free Oxford Shirt / Structured Blazer", "Slim Tapered Navy/Charcoal Chinos", "Leather Derby Shoes or Classic Penny Loafers", "Leather Briefcase, Minimalist Chronograph Watch, Matching Leather Belt")
        },
        'Party': {
            'female': ("Sleek Satin Cowl-Neck Camisole / Sequin Wrap Top", "High-Rise Pleated Wide-Leg Pants / Leather Mini Skirt", "Strappy Stiletto Heels or Metallic Mules", "Statement Earrings, Shimmer Clutch, Layered Delicate Necklaces"),
            'male': ("Black Slim Fit Shirt / Midnight Tailored Silk-Blend Shirt", "Slim-Fit Dark Indigo Trousers", "Polished Chelsea Boots", "Sleek Silver Signet Ring, Leather Jacket Layer")
        },
        'Wedding': {
            'female': ("Embroidered Zari Silk Kurta or Choli", "Flared Organza Lehenga Skirt / Palazzo", "Embellished Embroidered Juttis or Golden Block Heels", "Kundan Choker, Maang Tikka, Potli Bag"),
            'male': ("Raw Silk Embroidered Sherwani or Bandhgala Suit", "Tapered Silk Churidar / Trousers", "Traditional Handcrafted Mojaris", "Silk Pocket Square, Statement Brooch")
        },
        'Date': {
            'female': ("Soft Ribbed Knit Top or Sweetheart Neckline Blouse", "Tailored Straight-Leg Jeans or Satin Midi Skirt", "Minimalist Block Heel Sandals", "Dainty Pendant, Mini Crossbody Bag, Subtle Perfume"),
            'male': ("Fitted Knitted Polo or Crisp Linen Shirt", "Tailored Smart Chinos", "Clean White Leather Sneakers or Suede Loafers", "Leather Strap Watch, Woven Belt")
        },
        'College': {
            'female': ("Relaxed Oversized Graphic Tee + Cropped Denim Jacket", "High-Waisted Mom Jeans or Cargo Pants", "Chunky Retro Sneakers", "Canvas Tote Bag, Baseball Cap, Minimal Hoops"),
            'male': ("Oversized Heavyweight Cotton Hoodie or Tee", "Relaxed Fit Utility Cargo Pants", "Classic Skate or Street Sneakers", "Everyday Backpack, Sport Watch")
        },
        'Travel': {
            'female': ("Breathable Cotton-Linen Tunic or Ribbed Tank + Shacket", "High-Waisted Drawstring Joggers or Relaxed Linen Pants", "Cushioned Walking Sneakers", "Sling Crossbody Bag, UV-Block Sunglasses, Lightweight Scarf"),
            'male': ("Moisture-Wicking Cotton Crewneck + Lightweight Overshirt", "Stretch Commuter Joggers or Chino Shorts", "Lightweight Cushioned Runners", "Anti-Theft Backpack, Polarized Sunglasses")
        },
        'Festival': {
            'female': ("Vibrant Mirror-Work Anarkali or Floral Kurta Set", "Matching Flared Sharara Pants", "Embellished Kolhapuri Wedges", "Oxidized Silver Jhumkas, Stacked Bangles"),
            'male': ("Short Embroidered Cotton Kurta", "Slim Tapered Denim or White Pajama", "Leather Kolhapuri Chappals", "Classic Metallic Watch")
        },
        'Casual': {
            'female': ("Relaxed Linen Shirt or Soft Ribbed Tee", "Vintage Straight-Leg Blue Denim", "Clean White Low-Top Sneakers", "Structured Straw Tote, Minimalist Sunglasses"),
            'male': ("Classic White Crewneck Pima Cotton Tee + Overshirt", "Slim-Fit Stretch Denim", "Low-Profile White Leather Sneakers", "Canvas Strap Watch, Woven Belt")
        }
    }

    occ_title = occasion.title() if occasion else 'Casual'
    occ_key = occ_title if occ_title in outfit_matrix else 'Casual'
    top, bottom, footwear, accessories = outfit_matrix[occ_key].get(gender.lower(), outfit_matrix[occ_key]['female'])

    # Tie in closet or liked items if available
    tie_in_note = ""
    if ctx.get('closet_items'):
        tie_in_note = f"\n- **From Your Wardrobe**: You can easily swap in your *{ctx['closet_items'][0]}* to build this look!"
    elif ctx.get('liked_items'):
        tie_in_note = f"\n- **Matches Your Style**: Inspired by the aesthetic of your saved *{ctx['liked_items'][0]}*."

    reply = f"""### Style Analysis for **{gender.title()}** ({body_type.title()} Body)

✨ **Outfit Recommendation**:
- Occasion: **{occasion.title()}**
- Top: **{top}**
- Bottom: **{bottom}**
- Footwear: **{footwear}**

💡 **Fit Advice (for {body_type.title()} Body)**:
- {fit_advice}

🎨 **Best Colors**:
- **Palette**: {'Navy, Crisp White, Slate Grey, Camel' if occ_key == 'Office' else 'Emerald, Ruby, Champagne Gold' if occ_key == 'Wedding' else 'Olive, Rust, Crisp White, Indigo'}
- **Color Harmony**: Balanced contrast curated for your **{skin_tone.title()}** skin tone.

🧵 **Fabric Suggestion & 👜 Accessories**:
- **Fabric Suggestion**: {'Breathable Cotton & Linen' if 'hot' in weather else 'Structured Wool-Blend & Knits' if 'cold' in weather else 'Fine Poplin & Silk Blends'} (ideal for {weather} weather)
- **Accessories**: {accessories}{tie_in_note}
"""
    return jsonify({
        'reply': reply,
        'engine': engine_name,
        'quick_replies': ['Outfit Ideas', 'Color Suggestions', 'Summer Colors', 'Office Outfit', 'Accessories Match', 'Style for my Body Type']
    })
