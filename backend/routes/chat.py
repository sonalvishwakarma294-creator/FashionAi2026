import os
import google.generativeai as genai
from openai import OpenAI
from flask import Blueprint, request, jsonify

# Ensure environment variables are loaded
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

chat_bp = Blueprint('chat', __name__)

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or "gsk_" not in api_key: return None
    try:
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key)
    except: return None

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "AIza" not in api_key: return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-1.5-flash')
    except: return None

SYSTEM_PROMPT = """
You are 'FashionPro AI', a highly intelligent and professional fashion stylist.

**CORE DIRECTIVES:**
1. **GENDER, OCCASION & BODY TYPE**: Always provide advice tailored to the user's gender, occasion, and body type (Rectangle, Pear, Apple, Hourglass, Trapezoid).
2. **OCCASION PRECISION**: If user says 'Party', recommend high-energy club/evening wear. If 'Office', recommend sharp formal/smart-casual.
3. **FIT ADVICE**: Recommend specific fits (e.g., "A-line silhouettes for Pear shape to balance hips").
4. **MANDATORY RESPONSE FORMAT**:
✨ Outfit Recommendation:
- Occasion: [Name]
- Top: [Specific Item + Fit]
- Bottom: [Specific Item + Fit]
- Footwear: [Specific Item]

💡 Fit Advice (for {body_type} body):
- [Specific reason why this look works for this body type]

🎨 Best Colors:
- [15-20 specific colors]

🧵 Fabric & 👜 Accessories:
- [Details]
"""

@chat_bp.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    data = request.json
    user_message = data.get('message', '').strip()
    gender = data.get('gender', 'female').lower()
    history = data.get('history', [])
    style_preference = data.get('style_preference', 'Casual')
    skin_tone = data.get('skin_tone')
    body_type = data.get('body_type', 'Rectangle')
    passed_occasion = data.get('occasion')
    weather = data.get('weather')
    
    if not user_message:
        return jsonify({'reply': "How can I help you today? 😊", 'engine': 'none'})

    msg_lower = user_message.lower()
    occasion_map = {
        'shadi': 'wedding', 'marriage': 'wedding', 'wedding': 'wedding',
        'office': 'office', 'work': 'office', 'formal': 'office',
        'party': 'party', 'club': 'party', 'night out': 'party',
        'casual': 'casual', 'everyday': 'casual',
        'college': 'college', 'university': 'college', 'class': 'college',
        'date': 'date', 'romantic': 'date',
        'festival': 'festival', 'diwali': 'festival', 'eid': 'festival',
        'travel': 'travel', 'vacation': 'travel', 'trip': 'travel'
    }
    detected_occasion = next((occasion_map.get(k) for k in occasion_map if k in msg_lower), None)
    final_occasion = passed_occasion or detected_occasion
    
    context_notes = [f"User is {gender}.", f"Style: {style_preference}.", f"Body Type: {body_type}.", f"Skin Tone: {skin_tone or 'Not specified'}."]
    if final_occasion: context_notes.append(f"Occasion: {final_occasion}")
    if weather: context_notes.append(f"Weather: {weather}")
    
    full_system_prompt = f"{SYSTEM_PROMPT.format(body_type=body_type)}\n\nUSER PROFILE:\n" + "\n".join(context_notes)
    
    groq_client = get_groq_client()
    if groq_client:
        try:
            messages = [{"role": "system", "content": full_system_prompt}]
            for msg in history:
                role = "user" if msg.get('type') == 'user' else "assistant"
                content = msg.get('text', '')
                if content: messages.append({"role": role, "content": content})
            messages.append({"role": "user", "content": user_message})
            response = groq_client.chat.completions.create(model="llama-3.3-70b-versatile", messages=messages, max_tokens=1000, temperature=0.6)
            return jsonify({'reply': response.choices[0].message.content, 'engine': 'groq'})
        except Exception as e: print(f"DEBUG: Groq failed: {e}")

    return professional_fallback_chat(user_message, gender, style_preference, skin_tone, final_occasion, weather, body_type)

def professional_fallback_chat(user_message, gender, style='Minimalist', skin_tone=None, occasion=None, weather=None, body_type='Rectangle'):
    msg = user_message.lower()
    weather_context = (weather or "hot").lower()
    occasion_context = (occasion or "casual").lower()
    gender_display = gender.title() if gender else "Female"
    body_display = body_type.title() if body_type else "Rectangle"
    
    fit_advice = ""
    if body_display == "Pear": fit_advice = "Focus on adding volume to your upper body with structured tops to balance your wider hips."
    elif body_display == "Apple": fit_advice = "Empire waists and V-necks help elongate your torso. Use structured fabrics."
    elif body_display == "Hourglass": fit_advice = "Highlight your waist! Use belts and wrap-style tops to show off your curves."
    elif body_display == "Rectangle": fit_advice = "Create curves using peplum tops and layers. Tucking in your shirt defines your waist."
    elif body_display == "Trapezoid": fit_advice = "Stick to slim-fit tailored pieces that highlight your balanced proportions."

    colors_map = {
        'Fair': 'Pastels, Light Blue, Peach, Mint Green, Lavender, Silver, Rose Pink, Baby Yellow, Soft Grey, Ivory, Emerald Green, Royal Blue',
        'Medium': 'Olive Green, Mustard, Navy Blue, Maroon, Burnt Orange, Forest Green, Charcoal, Gold, Terracotta, Plum, Deep Purple',
        'Dark': 'Bright Red, Royal Blue, Lemon Yellow, Pure White, Gold, Silver, Magenta, Tangerine, Electric Lime, Fuchsia, Cobalt'
    }

    # FULL OCCASION MATRIX
    top, bottom, shoes, accessories = "", "", "", ""
    
    if "wedding" in occasion_context:
        if gender == 'female': top, bottom, shoes, accessories = "Embroidered Silk Kurta", "Lehenga Skirt", "Golden Juttis", "Kundan Earrings"
        else: top, bottom, shoes, accessories = "Maroon Sherwani", "White Churidar", "Traditional Mojaris", "Pocket Square"
    elif "party" in occasion_context:
        if gender == 'female': top, bottom, shoes, accessories = "Sequin Bodycon Dress", "Nude Stockings (Optional)", "Pointed Heels", "Statement Necklace"
        else: top, bottom, shoes, accessories = "Black Slim Fit Shirt", "Dark Grey Trousers", "Chelsea Boots", "Stylish Watch"
    elif "office" in occasion_context:
        if gender == 'female': top, bottom, shoes, accessories = "Silk Blouse", "Pencil Skirt", "Nude Heels", "Classic Watch"
        else: top, bottom, shoes, accessories = "Light Blue Formal Shirt", "Navy Chinos", "Brown Loafers", "Leather Laptop Bag"
    elif "college" in occasion_context:
        if gender == 'female': top, bottom, shoes, accessories = "Graphic Tee + Denim Jacket", "High-waist Mom Jeans", "White Sneakers", "Backpack"
        else: top, bottom, shoes, accessories = "Oversized Hoodie", "Relaxed Cargo Pants", "Chunky Sneakers", "Cap"
    elif "date" in occasion_context:
        if gender == 'female': top, bottom, shoes, accessories = "Off-shoulder Floral Top", "Skinny Jeans", "Strappy Sandals", "Crossbody Bag"
        else: top, bottom, shoes, accessories = "Polo Shirt", "Slim Fit Chinos", "White Leather Sneakers", "Minimal Watch"
    elif "travel" in occasion_context:
        top, bottom, shoes, accessories = "Breathable Cotton Tee", "Joggers", "Walking Shoes", "Sunglasses & Waist Bag"
    elif "festival" in occasion_context:
        if gender == 'female': top, bottom, shoes, accessories = "Anarkali Suit", "Matching Leggings", "Embellished Juttis", "Jhumkas"
        else: top, bottom, shoes, accessories = "Short Kurta", "Blue Denim", "Kolhapuris", "Ethnic Watch"
    else: # Casual
        if gender == 'female': top, bottom, shoes, accessories = "Floral Summer Dress", "Denim Jacket", "White Sneakers", "Tote Bag"
        else: top, bottom, shoes, accessories = "White Classic Shirt", "Blue Slim Jeans", "White Sneakers", "Leather Belt"

    fabrics = "Wool, Fleece" if weather_context == "cold" else "Polyester Blend" if weather_context == "rainy" else "Linen, Cotton"
    selected_tone = skin_tone.title() if skin_tone else "Medium"
    
    reply = f"""### Style Analysis for **{gender_display}** ({body_display} Body)

✨ **Outfit Recommendation**:
- Occasion: **{occasion_context.title()}**
- Top: **{top}**
- Bottom: **{bottom}**
- Footwear: **{shoes}**

💡 **Fit Advice**:
- {fit_advice}

🎨 **Best Colors ({selected_tone})**:
- {colors_map.get(selected_tone, colors_map['Medium'])}

🧵 **Fabric Suggestion**:
- **{fabrics}** (Perfect for {weather_context} weather)

👜 **Accessories**:
- {accessories}
"""
    return jsonify({'reply': reply, 'engine': 'fallback', 'quick_replies': ['Outfit Ideas', 'Color Suggestions', 'Accessories Match']})
