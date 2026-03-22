import os
import google.generativeai as genai
from openai import OpenAI
from flask import Blueprint, request, jsonify

# Ensure environment variables are loaded
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/ai-chat')

def get_groq_client():
    """Groq is the primary engine: Fast, reliable, and high free-tier limits."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or "gsk_" not in api_key:
        return None
    try:
        # Groq is OpenAI-compatible
        return OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key
        )
    except:
        return None

def get_gemini_model():
    """Gemini 1.5 Flash is the secondary stable fallback."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "AIza" not in api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-1.5-flash')
    except:
        return None

def get_openai_client():
    """Standard OpenAI as a tertiary backup."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or "sk-" not in api_key:
        return None
    try:
        return OpenAI(api_key=api_key)
    except:
        return None

SYSTEM_PROMPT = """
You are 'StyleSync Pro', the world's most advanced AI Fashion Consultant and Celebrity Stylist. 
Your goal is to provide elite-level, personalized fashion advice that blends deep technical knowledge with creative styling intuition.

CORE IDENTITY:
- You are an expert in both Global High-Fashion (Milan, Paris, NYC) and Indian Contemporary/Ethnic Fashion.
- You understand the psychology of clothing, color theory, and structural aesthetics.
- You are not just a chatbot; you are a personal stylist who remembers trends, understands body types, and knows what's "In" right now.

KNOWLEDGE DOMAINS:
1. FABRIC EXPERTISE: You know everything from Egyptian Cotton and Merino Wool to Chiffon, Brocade, and Sustainable Hemp. You suggest fabrics based on weather, comfort, and occasion.
2. COLOR THEORY: You use the Color Wheel (Monochromatic, Complementary, Analogous, Triadic) and the 60-30-10 rule. You suggest colors that complement specific skin undertones (Warm, Cool, Neutral).
3. BODY TYPES & SILHOUETTES: You provide advice for all body shapes (Hourglass, Pear, Apple, Rectangle, Inverted Triangle, Athletic). You know how to use vertical lines, layering, and proportions to enhance a look.
4. OCCASION LOGIC: 
   - Weddings: Detailed advice on Lehengas, Sherwanis, Tuxedos, and Indo-Western fusion.
   - Corporate: Power dressing, semi-formal, and creative professional looks.
   - Streetwear: Hypebeast trends, oversized fits, and sneaker culture.
   - Seasonal: Layering for winters, breathable aesthetics for summers.
5. ACCESSORIZING: You suggest the perfect watch, jewelry, belt, bag, or eyewear to complete the ensemble.
6. FOOTWEAR: From Brogues and Loafers to Stilettos and limited-edition Sneakers.

CONVERSATION & TONE:
- TONE: Professional, sophisticated, encouraging, and highly creative.
- LANGUAGE: Use a natural, high-fashion mix of English and Hinglish. 
  *   If the user asks "Shadi me kya pehnu?", don't just say "Wear a suit." 
  *   Say: "Shaadi ke liye is season **Pastel Lehengas** ya **Silk Sherwanis** bohot trend me hain. Aap floral embroidery try kar sakte hain for a modern touch. Accessorize with a statement watch or traditional jewelry!"
- FORMATTING: Use **Bold Text** for key items, bullet points for clarity, and occasional emojis for a premium feel.

RESPONSE RULES:
- ALWAYS consider the user's gender (provided in the prompt).
- Give detailed, structured advice. Don't be too brief. If someone asks for a look, give them the top, bottom, shoes, and one accessory.
- If a user is confused, ask clarifying questions (e.g., "What is the venue?", "What's the vibe?").
- Act as if you have full access to current fashion magazines and celebrity lookbooks.
"""

@chat_bp.route('', methods=['POST'])
def ai_chat():
    data = request.json
    user_message = data.get('message', '').strip()
    gender = data.get('gender', 'female').lower()
    history = data.get('history', [])
    
    # --- 1. TRY GROQ (Primary - High Speed & Free) ---
    groq_client = get_groq_client()
    if groq_client:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in history:
                messages.append({"role": "user" if msg.get('type') == 'user' else "assistant", "content": msg.get('text', '')})
            messages.append({"role": "user", "content": f"User Gender: {gender}. Message: {user_message}"})
            
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=500
            )
            return jsonify({'reply': response.choices[0].message.content, 'engine': 'groq'})
        except Exception as e:
            print(f"DEBUG: Groq failed: {e}")

    # --- 2. TRY GEMINI (Secondary Fallback) ---
    gemini_model = get_gemini_model()
    if gemini_model:
        try:
            context = f"{SYSTEM_PROMPT}\nUser Gender: {gender}\n"
            for msg in history:
                role = "User" if msg.get('type') == 'user' else "Assistant"
                context += f"{role}: {msg.get('text', '')}\n"
            context += f"User: {user_message}\nAssistant:"
            
            response = gemini_model.generate_content(context)
            if response and response.text:
                return jsonify({'reply': response.text, 'engine': 'gemini'})
        except Exception as e:
            print(f"DEBUG: Gemini failed: {e}")

    # --- 3. TRY OPENAI (Tertiary Fallback) ---
    openai_client = get_openai_client()
    if openai_client:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in history:
                messages.append({"role": "user" if msg.get('type') == 'user' else "assistant", "content": msg.get('text', '')})
            messages.append({"role": "user", "content": f"Gender: {gender}. Message: {user_message}"})
            
            response = openai_client.chat.completions.create(model="gpt-3.5-turbo", messages=messages)
            return jsonify({'reply': response.choices[0].message.content, 'engine': 'openai'})
        except Exception as e:
            print(f"DEBUG: OpenAI failed: {e}")

    # --- 4. ULTIMATE LOCAL FALLBACK (No API needed) ---
    return professional_fallback_chat(user_message, gender)

def professional_fallback_chat(user_message, gender):
    msg = user_message.lower()
    
    # Pre-defined expert responses for common queries
    if any(k in msg for k in ["shadi", "wedding", "marriage", "function"]):
        if gender == 'female':
            reply = """
For a wedding, I recommend a **Pastel-colored Lehenga** with intricate Zari work or a **Classic Silk Saree** in Jewel tones (like Emerald Green or Royal Blue). 
- **Fabric:** Chiffon or Organza for a lightweight feel, or Banarasi Silk for a traditional look.
- **Accessory:** Statement Kundan jewelry and a matching clutch.
- **Footwear:** Embellished Juttis or Metallic Stilettos.
"""
        else:
            reply = """
For a wedding, a **Slim-fit Sherwani** in Cream or Navy is a timeless choice. If it's a reception, a **Tailored Tuxedo** or a 3-piece Suit would be perfect.
- **Fabric:** Velvet for winters or Raw Silk for a premium texture.
- **Accessory:** A contrasting pocket square and a classic watch.
- **Footwear:** Tan Oxfords or Patent Leather Loafers.
"""
    elif any(k in msg for k in ["office", "work", "interview", "presentation"]):
        reply = """
Professionalism is all about **Structured Silhouettes**. I suggest a **Neutral Blazer** (Grey/Navy) paired with tailored trousers or a pencil skirt.
- **Logic:** Stick to the 60-30-10 rule with neutral tones to project confidence.
- **Fabric:** Breathable Cotton-Blends or Fine Wool.
- **Accessory:** A minimalist leather belt and a professional laptop bag.
"""
    elif any(k in msg for k in ["casual", "daily", "weekend", "outing"]):
        reply = """
For a relaxed yet stylish look, go for **Elevated Basics**. Try **Straight-fit Denims** with a high-quality monochrome T-shirt or a relaxed linen shirt.
- **Vibe:** Minimalist and comfortable.
- **Fabric:** 100% Organic Cotton or Linen.
- **Footwear:** Clean White Sneakers or Chelsea Boots.
"""
    elif any(k in msg for k in ["color", "skin", "suit"]):
        reply = """
Choosing the right color depends on your **Skin Undertone**:
- **Warm Undertone:** Earthy tones like Olive Green, Mustard Yellow, and Warm Reds.
- **Cool Undertone:** Royal Blue, Emerald Green, and Lavender.
- **Neutral Undertone:** You can carry off almost anything, but muted tones look exceptionally elegant.
Try the **Monochromatic look** for a sophisticated, elongated silhouette!
"""
    else:
        reply = """
That's a great fashion query! While I'm refining my latest trend data, remember that **Fit is King**. 
Always ensure your clothes complement your body type (like Hourglass, Rectangle, or Athletic). 
Focus on **Color Harmony** and don't be afraid to experiment with **Texture Layering** (pairing different fabrics like denim and corduroy) to add depth to your look!
"""
    
    return jsonify({'reply': reply, 'engine': 'fallback'})
