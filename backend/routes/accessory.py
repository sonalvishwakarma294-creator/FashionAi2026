from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import os
import google.generativeai as genai
import json
from PIL import Image
import io

accessory_bp = Blueprint('accessory', __name__)

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key: return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-pro-vision')
    except: return None

def rgb_to_fashion_name(rgb):
    """Map RGB values to nearest fashion color name using Euclidean distance."""
    r, g, b = rgb
    FASHION_PALETTE = {
        "White": (255, 255, 255), "Ivory": (255, 255, 240), "Black": (0, 0, 0),
        "Charcoal": (54, 69, 79), "Grey": (128, 128, 128), "Silver": (192, 192, 192),
        "Navy Blue": (0, 0, 128), "Royal Blue": (65, 105, 225), "Sky Blue": (135, 206, 235),
        "Teal": (0, 128, 128), "Emerald": (80, 200, 120), "Green": (0, 128, 0),
        "Olive": (128, 128, 0), "Red": (255, 0, 0), "Burgundy": (128, 0, 32),
        "Maroon": (128, 0, 0), "Pink": (255, 192, 203), "Coral": (255, 127, 80),
        "Peach": (255, 218, 185), "Orange": (255, 165, 0), "Yellow": (255, 255, 0),
        "Mustard": (255, 219, 88), "Gold": (255, 215, 0), "Purple": (128, 0, 128),
        "Plum": (142, 69, 133), "Beige": (245, 245, 220), "Camel": (193, 154, 107),
        "Tan": (210, 180, 140), "Brown": (165, 42, 42), "Rust": (183, 65, 14)
    }
    min_dist = float('inf')
    detected_name = "Navy Blue"
    for name, target_rgb in FASHION_PALETTE.items():
        dist = ((r - target_rgb[0]) ** 2 + (g - target_rgb[1]) ** 2 + (b - target_rgb[2]) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            detected_name = name
    return detected_name

def get_style_from_dataset(img):
    """Perform simple ML matching by comparing upload with Gallery Dataset."""
    try:
        PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
        categories = ['casual', 'office', 'party']
        best_score = -1
        detected_category = 'casual'
        
        img_resized = cv2.resize(img, (100, 100))
        img_hist = cv2.calcHist([img_resized], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
        cv2.normalize(img_hist, img_hist)

        for cat in categories:
            cat_path = os.path.join(IMAGES_DIR, cat)
            if not os.path.exists(cat_path): continue
            sample_images = [f for f in os.listdir(cat_path) if f.endswith(('.jpg', '.png', '.jpeg'))][:5]
            for sample_name in sample_images:
                sample_img = cv2.imread(os.path.join(cat_path, sample_name))
                if sample_img is None: continue
                sample_resized = cv2.resize(sample_img, (100, 100))
                sample_hist = cv2.calcHist([sample_resized], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                cv2.normalize(sample_hist, sample_hist)
                score = cv2.compareHist(img_hist, sample_hist, cv2.HISTCMP_CORREL)
                if score > best_score:
                    best_score = score
                    detected_category = cat
        return detected_category.capitalize(), best_score
    except Exception as e:
        print(f"Dataset Match Error: {e}")
        return "Casual", 0

@accessory_bp.route('/api/accessory/analyze', methods=['POST'])
def analyze_accessory():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file"}), 400
        
        file = request.files['image']
        gender = request.form.get('gender', 'female').lower()
        user_detected_color = request.form.get('detected_color', '').strip()
        
        file.seek(0)
        file_bytes = file.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        detected_color = user_detected_color if user_detected_color else "Navy Blue"
        detected_item = "Garment"
        detected_style = "Casual"
        confidence = 0

        # 1. Dataset Match
        if img is not None:
            try:
                dataset_style, confidence = get_style_from_dataset(img)
                if confidence > 0.6:
                    detected_style = dataset_style
            except Exception as ds_err:
                print(f"Dataset Match Skip: {ds_err}")

        # 2. AI Enhancement
        if not user_detected_color:
            model = get_gemini_model()
            if model:
                try:
                    file.seek(0)
                    img_pil = Image.open(io.BytesIO(file.read()))
                    prompt = "Analyze this garment. Return ONLY JSON: {\"color\": \"Name\", \"item_type\": \"Specific Type\", \"style\": \"Ethnic, Party, Formal, or Casual\"}."
                    response = model.generate_content([prompt, img_pil])
                    text = response.text.strip()
                    if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
                    elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
                    res_data = json.loads(text)
                    detected_color = res_data.get("color", detected_color)
                    detected_item = res_data.get("item_type", detected_item)
                    if confidence < 0.8:
                        detected_style = res_data.get("style", detected_style)
                except Exception as e:
                    print(f"AI Error: {e}")
                    if img is not None:
                        try:
                            h, w = img.shape[:2]
                            crop = img[int(h*0.3):int(h*0.7), int(w*0.3):int(w*0.7)]
                            avg_color = np.average(np.average(crop, axis=0), axis=0)
                            detected_color = rgb_to_fashion_name(avg_color[::-1])
                        except: pass

        # 3. Overrides
        item_lower = detected_item.lower()
        if any(k in item_lower for k in ['gown', 'lehenga', 'saree', 'anarkali', 'ethnic']):
            detected_style = "Ethnic"
        elif any(k in item_lower for k in ['party', 'sequin', 'glam', 'evening', 'sparkly']):
            detected_style = "Party"
        if "gown" in item_lower and detected_style == "Casual":
            detected_style = "Party"

        # 4. Final Recommendations
        accessory_recommendations = {
            'female': {
                'formal': ["Pearl Studs", "Structured Bag", "Classic Watch", "Nude Heels", "Silk Scarf"],
                'casual': ["Hoop Earrings", "Tote Bag", "Sneakers", "Leather Belt", "Sunglasses"],
                'ethnic': ["Jhumkas", "Bangles", "Potli Bag", "Embellished Juttis", "Maang Tikka"],
                'party': ["Statement Necklace", "Clutch Bag", "Stilettos", "Cocktail Ring", "Shimmer Scarf"]
            },
            'male': {
                'formal': ["Leather Watch", "Cufflinks", "Pocket Square", "Oxford Shoes", "Silk Tie"],
                'casual': ["Sports Watch", "Sneakers", "Baseball Cap", "Leather Bracelet", "Backpack"],
                'ethnic': ["Brooch", "Mojaris", "Turban Pin", "Silk Pocket Square", "Beaded Mala"],
                'party': ["Velvet Loafers", "Designer Watch", "Cravat", "Chelsea Boots", "Silver Bracelet"]
            }
        }
        
        style_key = detected_style.lower()
        if style_key not in accessory_recommendations[gender]: style_key = 'casual'
        
        return jsonify({
            "detected_color": detected_color,
            "detected_item": detected_item,
            "detected_style": detected_style,
            "gender": gender,
            "recommendations": accessory_recommendations[gender][style_key],
            "advice": f"For this **{detected_item}**, we recommend {style_key} accessories."
        })

    except Exception as e:
        print(f"Top-level Accessory Error: {e}")
        return jsonify({
            "detected_color": "Navy Blue",
            "detected_item": "Garment",
            "detected_style": "Casual",
            "gender": "female",
            "recommendations": ["Watch", "Belt", "Shoes"],
            "advice": "System is currently using limited analysis. Please check back later."
        }), 200 # Use 200 with fallback data instead of 500 crash


@accessory_bp.route('/api/skin-tone/analyze', methods=['POST'])
def analyze_skin_tone():
    try:
        if 'image' not in request.files: return jsonify({"error": "No image"}), 400
        file = request.files['image']
        nparr = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return jsonify({"error": "Invalid image"}), 400
        img = cv2.resize(img, (224, 224))
        h, w = img.shape[:2]
        crop = img[h//4:3*h//4, w//4:3*w//4]
        avg_color = np.average(np.average(crop, axis=0), axis=0)
        mean_r, mean_g, mean_b = avg_color[::-1].astype(int)
        if mean_r > 210: tone = "Fair"
        elif mean_r > 180: tone = "Light"
        elif mean_g < 100: tone = "Olive"
        else: tone = "Medium/Wheatish"
        return jsonify({"skin_tone": tone, "skin_hex": '#{:02x}{:02x}{:02x}'.format(mean_r, mean_g, mean_b)})
    except Exception as e: return jsonify({"error": str(e)}), 500

@accessory_bp.route('/api/color-combinations', methods=['POST'])
def get_color_combinations():
    data = request.json
    base = data.get('color', 'Navy Blue')
    HARMONY = {
        "Navy Blue": {"complementary": ["Mustard", "Gold"], "analogous": ["Royal Blue", "Teal"], "triadic": ["Burgundy", "Emerald"], "neutral": ["White", "Grey"]},
        "Black": {"complementary": ["White", "Gold"], "analogous": ["Charcoal", "Grey"], "triadic": ["Red", "Royal Blue"], "neutral": ["Ivory", "Beige"]}
    }
    return jsonify(HARMONY.get(base, {"complementary": ["White", "Black"], "analogous": ["Grey", "Navy Blue"], "triadic": ["Burgundy", "Emerald"], "neutral": ["Beige", "Ivory"]}))
