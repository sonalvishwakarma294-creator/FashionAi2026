import os
import google.generativeai as genai
from openai import OpenAI
from flask import Blueprint, request, jsonify

# Ensure environment variables are loaded
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/ai-chat')

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "YOUR_GEMINI" in api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        # Using a model confirmed to be available and stable
        return genai.GenerativeModel('gemini-2.0-flash')
    except:
        return None

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or "sk-proj" not in api_key:
        return None
    try:
        return OpenAI(api_key=api_key)
    except:
        return None

SYSTEM_PROMPT = """
You are 'StyleSync AI', a senior professional fashion stylist. 
Your tone is sophisticated, modern, and helpful.
If the user speaks Hinglish, respond in Hinglish with fashion terms in English.

RULES:
1. Provide very specific outfit suggestions.
2. Use professional fashion terminology.
3. Keep the conversation focused on style.
"""

@chat_bp.route('', methods=['POST'])
def ai_chat():
    data = request.json
    user_message = data.get('message', '').strip()
    gender = data.get('gender', 'female').lower()
    history = data.get('history', [])
    
    # 1. Try Gemini
    model = get_gemini_model()
    if model:
        try:
            context = f"{SYSTEM_PROMPT}\nUser Gender: {gender}\n"
            for msg in history:
                role = "User" if msg.get('type') == 'user' else "Assistant"
                context += f"{role}: {msg.get('text', '')}\n"
            context += f"User: {user_message}\nAssistant:"
            
            response = model.generate_content(context)
            if response and response.text:
                return jsonify({'reply': response.text})
        except Exception as e:
            print(f"DEBUG: Gemini quota likely hit. Error: {e}")

    # 2. Try OpenAI
    client = get_openai_client()
    if client:
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in history:
                messages.append({"role": "user" if msg.get('type') == 'user' else "assistant", "content": msg.get('text', '')})
            messages.append({"role": "user", "content": f"Gender: {gender}. Message: {user_message}"})
            
            response = client.chat.completions.create(model="gpt-3.5-turbo", messages=messages)
            return jsonify({'reply': response.choices[0].message.content})
        except Exception as e:
            print(f"DEBUG: OpenAI failed: {e}")

    # 3. Fallback (Only if BOTH AI models fail)
    return professional_fallback_chat(user_message, gender)

def professional_fallback_chat(user_message, gender):
    # This is a cleaner fallback that doesn't say "Eco-Mode" immediately
    msg = user_message.lower()
    if any(k in msg for k in ["shadi", "wedding", "party"]):
        reply = "For a wedding, I recommend a **Deep Emerald Silk Gown** (for her) or a **Midnight Blue Velvet Tuxedo** (for him). Accessories should be minimal but high-impact, like gold studs or a silver watch."
    elif any(k in msg for k in ["office", "work"]):
        reply = "For a professional setting, go for a **Tailored Charcoal Blazer** over an **Ivory Silk Blouse** (or light blue Oxford shirt for him). Fit is king!"
    else:
        reply = "I'm processing your style request. While I fine-tune my AI engine, I'd suggest focusing on 'Fit' and 'Color Harmony' as your primary style pillars today. What else can I help with?"
    
    return jsonify({'reply': reply})
