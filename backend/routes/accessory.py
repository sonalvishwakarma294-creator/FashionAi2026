from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import os
import google.generativeai as genai
import json
from PIL import Image
import io

from utils.color_utils import extract_dominant_color, find_closest_color

accessory_bp = Blueprint('accessory', __name__, url_prefix='/api')

def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key: return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-pro-vision')
    except: return None

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

@accessory_bp.route('/accessory/analyze', methods=['POST'])
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
        detected_hex = "#0F1C40"
        detected_item = "Garment"
        detected_style = "Casual"
        confidence = 0
        swatches = []

        # 1. High-accuracy CIELAB K-Means extraction with background & skin filtering
        if img is not None:
            c_name, c_hex, c_rgb, extracted_swatches = extract_dominant_color(img)
            swatches = extracted_swatches
            if not user_detected_color:
                detected_color = c_name
                detected_hex = c_hex

        # 2. Dataset Style Match
        if img is not None:
            try:
                dataset_style, confidence = get_style_from_dataset(img)
                if confidence > 0.6:
                    detected_style = dataset_style
            except Exception as ds_err:
                print(f"Dataset Match Skip: {ds_err}")

        # 3. AI Multimodal Enhancement (if available)
        model = get_gemini_model()
        if model:
            try:
                file.seek(0)
                img_pil = Image.open(io.BytesIO(file.read()))
                prompt = "Analyze this garment photo. Return ONLY JSON: {\"color\": \"Name\", \"item_type\": \"Specific Type\", \"style\": \"Ethnic, Party, Formal, or Casual\"}."
                response = model.generate_content([prompt, img_pil])
                text = response.text.strip()
                if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
                res_data = json.loads(text)
                if res_data.get("color") and not user_detected_color:
                    detected_color = res_data.get("color")
                detected_item = res_data.get("item_type", detected_item)
                if confidence < 0.8:
                    detected_style = res_data.get("style", detected_style)
            except Exception as e:
                print(f"AI Vision Info: {e}")

        # 4. Keyword and silhouette overrides
        item_lower = detected_item.lower()
        if any(k in item_lower for k in ['gown', 'lehenga', 'saree', 'anarkali', 'ethnic', 'kurta']):
            detected_style = "Ethnic"
        elif any(k in item_lower for k in ['party', 'sequin', 'glam', 'evening', 'sparkly']):
            detected_style = "Party"
        elif any(k in item_lower for k in ['blazer', 'suit', 'tuxedo', 'oxford', 'trouser']):
            detected_style = "Formal"

        # 4. Smart Metal & Leather Harmonization
        warm_colors = ['Red', 'Orange', 'Yellow', 'Gold', 'Mustard', 'Peach', 'Coral', 'Rust', 'Brown', 'Camel', 'Tan', 'Beige', 'Olive']
        cool_colors = ['Navy Blue', 'Royal Blue', 'Sky Blue', 'Teal', 'Emerald', 'Green', 'Purple', 'Plum', 'Charcoal', 'Grey', 'Silver', 'Black', 'White', 'Ivory']
        
        is_warm = any(w in detected_color for w in warm_colors)
        
        if is_warm:
            metal_harmony = {
                "recommended_metal": "Warm Polished Gold",
                "metal_hex": "#D4AF37",
                "reason": f"The warm undertones of {detected_color} glow naturally against rich gold and champagne brass finishes."
            }
            leather_harmony = {
                "recommended_leather": "Cognac / Tan Leather",
                "leather_hex": "#9E5B32",
                "reason": "Rich warm leather harmonizes with earthy and warm tones without looking harsh."
            }
        else:
            metal_harmony = {
                "recommended_metal": "Cool Silver & Platinum",
                "metal_hex": "#C0C0C0",
                "reason": f"The crisp cool tones of {detected_color} pair seamlessly with high-shine silver, white gold, and platinum."
            }
            leather_harmony = {
                "recommended_leather": "Polished Jet Black",
                "leather_hex": "#141414",
                "reason": "Deep black leather anchors the cool spectrum with sharp, elevated contrast."
            }

        # 5. Visual 4-Category Accessory Suites
        style_key = detected_style.lower()
        if style_key not in ['formal', 'casual', 'ethnic', 'party']:
            style_key = 'casual'

        SUITE_MAP = {
            'female': {
                'formal': {
                    'bags': [
                        {"name": "Structured Top-Handle Satchel", "color": "Cognac / Black", "badge": "Essential", "tip": "Maintains a clean, professional silhouette."},
                        {"name": "Minimalist Leather Tote", "color": "Taupe / Espresso", "badge": "Workhorse", "tip": "Spacious yet sharp for laptop & daily essentials."}
                    ],
                    'footwear': [
                        {"name": "Pointed-Toe Block Pumps", "color": "Nude / Jet Black", "badge": "High Comfort", "tip": "Sleek toe elongates legs while block heel ensures all-day ease."},
                        {"name": "Tailored Leather Loafers", "color": "Burgundy / Black", "badge": "Modern Classic", "tip": "Effortless Parisian polish with trousers."}
                    ],
                    'jewelry': [
                        {"name": "Minimalist Gold/Silver Mesh Watch", "color": metal_harmony['recommended_metal'], "badge": "Timeless", "tip": "Understated dial that slips neatly under cuffs."},
                        {"name": "Freshwater Pearl or Huggie Studs", "color": "Pearl / Metal", "badge": "Refined", "tip": "Draws soft attention to the face without distracting."}
                    ],
                    'accents': [
                        {"name": "Narrow Leather Belt with Gold Buckle", "color": leather_harmony['recommended_leather'], "badge": "Waist Cinch", "tip": "Defines proportions at high waist."},
                        {"name": "Silk Twill Neck Scarf", "color": "Complementary Print", "badge": "Accent Pop", "tip": "Adds luxurious texture to plain collars."}
                    ]
                },
                'casual': {
                    'bags': [
                        {"name": "Canvas & Leather Crossbody", "color": "Tan / Olive", "badge": "Hands-Free", "tip": "Perfect casual balance of function and style."},
                        {"name": "Slouchy Hobo Bag", "color": "Warm Sand", "badge": "Effortless", "tip": "Soft drape matches relaxed silhouettes."}
                    ],
                    'footwear': [
                        {"name": "Clean White Low-Top Leather Sneakers", "color": "Optic White", "badge": "Essential", "tip": "Crisp baseline that works with skirts, jeans, and dresses."},
                        {"name": "Woven Slide Sandals", "color": "Caramel Brown", "badge": "Summer Go-To", "tip": "Breezy comfort for warm-weather styling."}
                    ],
                    'jewelry': [
                        {"name": "Layered Delicate Coin Chains", "color": metal_harmony['recommended_metal'], "badge": "Chic", "tip": "Adds visual depth to open necklines."},
                        {"name": "Medium Chunky Gold/Silver Hoops", "color": metal_harmony['recommended_metal'], "badge": "Daily Staple", "tip": "Frames jawline with effortless shine."}
                    ],
                    'accents': [
                        {"name": "Tortoiseshell Polarized Sunglasses", "color": "Amber Havana", "badge": "UV Chic", "tip": "Classic frame flattering to all face shapes."},
                        {"name": "Braided Leather Belt", "color": "Tan", "badge": "Texture", "tip": "Breaks up monotone denim combinations."}
                    ]
                },
                'party': {
                    'bags': [
                        {"name": "Crystal Embellished Box Clutch", "color": "Metallic / Black", "badge": "High Glam", "tip": "Jewelry-grade evening centerpiece."},
                        {"name": "Chain-Strap Metallic Pouch", "color": "Gold / Silver", "badge": "Night Out", "tip": "Drapes elegantly over the shoulder."}
                    ],
                    'footwear': [
                        {"name": "Strappy Stiletto Sandals", "color": "Metallic Shimmer", "badge": "Red Carpet", "tip": "Minimal straps maximize foot elegance."},
                        {"name": "Metallic Platform Heels", "color": "Champagne Gold", "badge": "Showstopper", "tip": "Maximum height with supported platform balance."}
                    ],
                    'jewelry': [
                        {"name": "Statement Chandelier Crystal Earrings", "color": "Diamond Shimmer", "badge": "Focus Piece", "tip": "Catches ambient evening lighting beautifully."},
                        {"name": "Cocktail Solitaire Ring", "color": metal_harmony['recommended_metal'], "badge": "Hand Sparkle", "tip": "Bold focal point for glass-holding photos."}
                    ],
                    'accents': [
                        {"name": "Shimmer Organza Stole", "color": "Silver / Gold Mist", "badge": "Layering", "tip": "Drapes softly over bare shoulders."},
                        {"name": "Cat-Eye Tinted Night Glasses", "color": "Smokey Onyx", "badge": "Edgy", "tip": "Bold after-hours aesthetic."}
                    ]
                },
                'ethnic': {
                    'bags': [
                        {"name": "Zari-Embroidered Velvet Potli", "color": "Ruby / Gold", "badge": "Traditional", "tip": "Complements ornate ethnic borders."},
                        {"name": "Raw Silk Box Clutch", "color": "Emerald / Rose", "badge": "Festive", "tip": "Contemporary ethnic fusion piece."}
                    ],
                    'footwear': [
                        {"name": "Embellished Kundan Mojaris / Juttis", "color": "Gilded Gold", "badge": "Cushioned", "tip": "Intricate threadwork with flat comfort."},
                        {"name": "Block Heel Kolhapuri Sandals", "color": "Antique Gold", "badge": "Elevated", "tip": "Gives height while supporting heavy lehengas."}
                    ],
                    'jewelry': [
                        {"name": "Polki / Meenakari Jhumkas", "color": "Gold & Pearls", "badge": "Heritage", "tip": "Signature Indian festive elegance."},
                        {"name": "Layered Temple Choker & Maang Tikka", "color": "Antique Gold", "badge": "Royal Look", "tip": "Frames the forehead and neck gracefully."}
                    ],
                    'accents': [
                        {"name": "Stack of Glass & Velvet Bangles", "color": "Contrasting Hue", "badge": "Festive Chime", "tip": "Adds traditional color drama to wrists."},
                        {"name": "Embroidered Silk Shawl", "color": "Rich Maroon", "badge": "Winter Wedding", "tip": "Layered regal warmth."}
                    ]
                }
            },
            'male': {
                'formal': {
                    'bags': [
                        {"name": "Full-Grain Leather Briefcase", "color": "Jet Black / Cognac", "badge": "Executive", "tip": "Clean lines with brass hardware."},
                        {"name": "Slim Leather Folio", "color": "Espresso Brown", "badge": "Minimalist", "tip": "Streamlined carry for tablet & notes."}
                    ],
                    'footwear': [
                        {"name": "Cap-Toe Oxford Shoes", "color": "Polished Black", "badge": "Formal Standard", "tip": "Closed lacing for purest formal lines."},
                        {"name": "Double Monk Strap Shoes", "color": "Deep Burgundy", "badge": "Modern Dandy", "tip": "Distinguished alternative to lace-ups."}
                    ],
                    'jewelry': [
                        {"name": "Chronograph with Alligator Leather Strap", "color": leather_harmony['recommended_leather'], "badge": "Classic", "tip": "Matches shoe and belt leather tone."},
                        {"name": "Engraved Sterling Silver Cufflinks", "color": metal_harmony['recommended_metal'], "badge": "Sartorial", "tip": "Elevates French cuffs."}
                    ],
                    'accents': [
                        {"name": "Silk Jacquard Tie & Pocket Square", "color": "Deep Wine / Navy", "badge": "Gentleman", "tip": "Creates subtle sheen against jacket lapel."},
                        {"name": "Feather-Edge Leather Dress Belt", "color": leather_harmony['recommended_leather'], "badge": "Must Match", "tip": "Hardware matches watch case finish."}
                    ]
                },
                'casual': {
                    'bags': [
                        {"name": "Waxed Canvas Backpack", "color": "Charcoal / Olive", "badge": "Rugged", "tip": "Durable and weather-treated for daily carry."},
                        {"name": "Leather Sling Crossbody", "color": "Tan Brown", "badge": "Street Style", "tip": "Hands-free compact urban carrier."}
                    ],
                    'footwear': [
                        {"name": "Minimalist Low-Top Leather Sneakers", "color": "Monochrome White", "badge": "Universal", "tip": "Pairs seamlessly with denim and chinos."},
                        {"name": "Suede Chelsea Boots", "color": "Sand / Tobacco", "badge": "Layered", "tip": "Adds rich texture to casual streetwear."}
                    ],
                    'jewelry': [
                        {"name": "Matte Black Diver Watch", "color": "Gunmetal / Black", "badge": "Sport Luxe", "tip": "Rugged build for active days."},
                        {"name": "Braided Leather & Silver Cuff", "color": "Dark Brown & Steel", "badge": "Subtle Edge", "tip": "Understated wrist accent."}
                    ],
                    'accents': [
                        {"name": "Acetate Wayfarer Sunglasses", "color": "Matte Tortoise", "badge": "Iconic", "tip": "Complements all facial structures."},
                        {"name": "Structured Baseball Cap / Beanie", "color": "Charcoal Grey", "badge": "Casual Cap", "tip": "Quick off-duty finish."}
                    ]
                },
                'party': {
                    'bags': [
                        {"name": "Designer Leather Clutch/Pouch", "color": "Jet Black", "badge": "VIP", "tip": "Minimalist evening accessory for essentials."}
                    ],
                    'footwear': [
                        {"name": "Velvet Loafers with Gold Bit", "color": "Midnight Black", "badge": "Evening Glam", "tip": "Sophisticated evening statement."},
                        {"name": "Polished Chelsea Dress Boots", "color": "Glossy Black", "badge": "Rockstar Chic", "tip": "Sharp tapered silhouette under dark trousers."}
                    ],
                    'jewelry': [
                        {"name": "Skeleton Dial Automatic Watch", "color": "Gold / Steel", "badge": "Conversation Starter", "tip": "Mechanical complexity catches the light."},
                        {"name": "Sterling Silver Box Chain", "color": "High-Shine Silver", "badge": "Urban Polish", "tip": "Sits cleanly under open collar shirts."}
                    ],
                    'accents': [
                        {"name": "Silk Cravat or Lapel Pin", "color": "Metallic Accent", "badge": "Distinctive", "tip": "Instant night-out elevation."},
                        {"name": "Tinted Aviator Night Glasses", "color": "Amber / Gold Frame", "badge": "Club Luxe", "tip": "After-dark runway aesthetic."}
                    ]
                },
                'ethnic': {
                    'bags': [
                        {"name": "Embroidered Silk Potli", "color": "Gold / Maroon", "badge": "Festive", "tip": "Matches sherwani stole borders."}
                    ],
                    'footwear': [
                        {"name": "Handcrafted Leather Mojaris", "color": "Gold Thread / Tan", "badge": "Royal Step", "tip": "Curved toe with royal embroidery."},
                        {"name": "Embossed Leather Kolhapuri Chappals", "color": "Rich Brown", "badge": "Ethnic Classic", "tip": "Authentic pairing for kurta-pyjama."}
                    ],
                    'jewelry': [
                        {"name": "Kundan / Ruby Sherwani Brooch", "color": "Gold & Emerald", "badge": "Regal", "tip": "Pinned on chest or stole for royal aura."},
                        {"name": "Layered Emerald / Pearl Mala", "color": "Green & Pearl White", "badge": "Groom / Festive", "tip": "Classic royal Indian festive neckpiece."}
                    ],
                    'accents': [
                        {"name": "Turban Sarpech / Feather Pin", "color": "Gold & Jewels", "badge": "Ceremonial", "tip": "Focal adornment for safa / pagri."},
                        {"name": "Zari Tissue Pocket Square", "color": "Metallic Gold", "badge": "Accent", "tip": "Complements bandhgala chest pocket."}
                    ]
                }
            }
        }

        # Neckline Specific Recommendations
        NECKLINE_GUIDES = {
            'V-Neck / Wrap': "Wear a **Pendant or Y-Lariat Chain** to echo the downward V-silhouette, paired with stud earrings.",
            'Crew / High Neck': "Opt for **Bold Chunky Collar Chains** over the fabric, or skip the necklace and wear **Statement Drop Earrings**.",
            'Off-Shoulder / Sweetheart': "Wear a **Close-Fitting Choker** or let the decolletage breathe with **Chandelier Earrings**.",
            'Collared Shirt / Blazer': "Layer **Delicate Chains** unbuttoned, and accent with a **Structured Watch** and **Feathered Belt**.",
            'Turtleneck': "Drape a **Long Opera Length Chain or Pendant** to elongate the torso and break up solid fabric."
        }

        user_suite = SUITE_MAP.get(gender, SUITE_MAP['female']).get(style_key, SUITE_MAP['female']['casual'])
        
        flat_recommendations = (
            [b['name'] for b in user_suite.get('bags', [])[:2]] +
            [f['name'] for f in user_suite.get('footwear', [])[:2]] +
            [j['name'] for j in user_suite.get('jewelry', [])[:2]] +
            [a['name'] for a in user_suite.get('accents', [])[:2]]
        )

        return jsonify({
            "detected_color": detected_color,
            "detected_hex": detected_hex,
            "swatches": swatches,
            "detected_item": detected_item,
            "detected_style": detected_style,
            "gender": gender,
            "metal_harmony": metal_harmony,
            "leather_harmony": leather_harmony,
            "visual_suite": user_suite,
            "neckline_guides": NECKLINE_GUIDES,
            "recommendations": flat_recommendations,
            "advice": f"For this **{detected_color} {detected_item}**, we curated a bespoke **{detected_style}** accessory ensemble paired with **{metal_harmony['recommended_metal']}** hardware."
        })

    except Exception as e:
        print(f"Top-level Accessory Error: {e}")
        return jsonify({
            "detected_color": "Navy Blue",
            "detected_hex": "#0F1C40",
            "swatches": [],
            "detected_item": "Garment",
            "detected_style": "Casual",
            "gender": "female",
            "metal_harmony": {"recommended_metal": "Warm Gold", "metal_hex": "#D4AF37", "reason": "Gold creates harmonious warmth."},
            "leather_harmony": {"recommended_leather": "Cognac Tan", "leather_hex": "#9E5B32", "reason": "Tan leather warms up cool tones."},
            "recommendations": ["Crossbody Bag", "Clean White Sneakers", "Mesh Watch", "Leather Belt"],
            "advice": "Displaying smart default accessory pairings."
        }), 200


@accessory_bp.route('/skin-tone/analyze', methods=['POST'])
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

@accessory_bp.route('/color-combinations', methods=['POST'])
def get_color_combinations():
    try:
        data = request.json
        base_color = data.get('color', '#001F3F').upper()
        gender = data.get('gender', 'female').lower()
        skin_tone = data.get('skin_tone', 'Medium')

        # Color harmony database - personalized by skin tone and gender
        COLOR_HARMONY_DB = {
            'female': {
                'Fair': {
                    '#001F3F': {'complementary': ['Gold', 'Cream', 'Silver'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#000000': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['Pink', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#FFFFFF': {'complementary': ['Black', 'Navy', 'Burgundy'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Silver', 'Gold', 'Champagne']},
                    '#800020': {'complementary': ['Gold', 'Cream', 'Silver'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Ivory'], 'neutral': ['Cream', 'Silver', 'White']},
                    '#50C878': {'complementary': ['Gold', 'Coral', 'Pink'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'Coral'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#FFD700': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#4169E1': {'complementary': ['Gold', 'Coral', 'Cream'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Ivory'], 'neutral': ['Silver', 'Cream', 'White']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'Gold'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'Cream'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#FFDB58': {'complementary': ['Navy', 'Burgundy', 'Teal'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#36454F': {'complementary': ['Gold', 'Coral', 'Cream'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['Pink', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'White']}
                },
                'Light': {
                    '#001F3F': {'complementary': ['Gold', 'Peach', 'Cream'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#000000': {'complementary': ['Cream', 'Gold', 'Silver'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['Peach', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#FFFFFF': {'complementary': ['Navy', 'Burgundy', 'Black'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Silver', 'Gold', 'Champagne']},
                    '#800020': {'complementary': ['Gold', 'Cream', 'Peach'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Ivory'], 'neutral': ['Cream', 'Silver', 'Champagne']},
                    '#50C878': {'complementary': ['Gold', 'Coral', 'Peach'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'Coral'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#FFD700': {'complementary': ['Navy', 'Burgundy', 'Royal Blue'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#4169E1': {'complementary': ['Gold', 'Peach', 'Cream'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Ivory'], 'neutral': ['Silver', 'Cream', 'Champagne']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'Gold'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'Cream'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#FFDB58': {'complementary': ['Navy', 'Burgundy', 'Royal Blue'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Ivory', 'Silver', 'Cream']},
                    '#36454F': {'complementary': ['Gold', 'Peach', 'Cream'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['Pink', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Champagne']}
                },
                'Medium': {
                    '#001F3F': {'complementary': ['Gold', 'Coral', 'Cream'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#000000': {'complementary': ['Cream', 'Gold', 'Coral'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['Coral', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#FFFFFF': {'complementary': ['Navy', 'Burgundy', 'Emerald'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Silver', 'Gold', 'Beige']},
                    '#800020': {'complementary': ['Gold', 'Cream', 'Coral'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Ivory'], 'neutral': ['Cream', 'Silver', 'Beige']},
                    '#50C878': {'complementary': ['Gold', 'Coral', 'Burgundy'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'Coral'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#FFD700': {'complementary': ['Navy', 'Burgundy', 'Emerald'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#4169E1': {'complementary': ['Gold', 'Coral', 'Cream'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Ivory'], 'neutral': ['Silver', 'Cream', 'Beige']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'Gold'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'Cream'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#FFDB58': {'complementary': ['Navy', 'Burgundy', 'Emerald'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#36454F': {'complementary': ['Gold', 'Coral', 'Cream'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['Coral', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Beige']}
                },
                'Olive': {
                    '#001F3F': {'complementary': ['Gold', 'Coral', 'Mustard'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#000000': {'complementary': ['Mustard', 'Gold', 'Coral'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['Mustard', 'Teal', 'Gold'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#FFFFFF': {'complementary': ['Emerald', 'Burgundy', 'Navy'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Camel', 'Gold', 'Beige']},
                    '#800020': {'complementary': ['Gold', 'Mustard', 'Coral'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Beige'], 'neutral': ['Camel', 'Tan', 'Beige']},
                    '#50C878': {'complementary': ['Gold', 'Burgundy', 'Coral'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'Coral'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#FFD700': {'complementary': ['Emerald', 'Burgundy', 'Navy'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#4169E1': {'complementary': ['Gold', 'Mustard', 'Coral'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Beige'], 'neutral': ['Camel', 'Tan', 'Beige']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'Gold'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'Camel'], 'neutral': ['Beige', 'Tan', 'Camel']},
                    '#FFDB58': {'complementary': ['Emerald', 'Burgundy', 'Navy'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#36454F': {'complementary': ['Gold', 'Mustard', 'Coral'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['Mustard', 'Teal', 'Gold'], 'neutral': ['Beige', 'Camel', 'Tan']}
                }
            },
            'male': {
                'Fair': {
                    '#001F3F': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#000000': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#FFFFFF': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Silver', 'Gold', 'Champagne']},
                    '#800020': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Ivory'], 'neutral': ['Cream', 'Silver', 'White']},
                    '#50C878': {'complementary': ['Gold', 'White', 'Silver'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'White'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#FFD700': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#4169E1': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Ivory'], 'neutral': ['Silver', 'White', 'Ivory']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'White'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'White'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#FFDB58': {'complementary': ['Navy', 'Burgundy', 'Teal'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Ivory', 'Silver', 'White']},
                    '#36454F': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'White']}
                },
                'Light': {
                    '#001F3F': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#000000': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#FFFFFF': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Silver', 'Gold', 'Champagne']},
                    '#800020': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Ivory'], 'neutral': ['Cream', 'Silver', 'Champagne']},
                    '#50C878': {'complementary': ['Gold', 'White', 'Silver'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'White'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#FFD700': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#4169E1': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Ivory'], 'neutral': ['Silver', 'White', 'Champagne']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'White'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'White'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#FFDB58': {'complementary': ['Navy', 'Burgundy', 'Teal'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Ivory', 'Silver', 'Champagne']},
                    '#36454F': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Champagne']}
                },
                'Medium': {
                    '#001F3F': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#000000': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#FFFFFF': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Silver', 'Gold', 'Beige']},
                    '#800020': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Ivory'], 'neutral': ['Cream', 'Silver', 'Beige']},
                    '#50C878': {'complementary': ['Gold', 'White', 'Silver'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'White'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#FFD700': {'complementary': ['Navy', 'Black', 'Burgundy'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#4169E1': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Ivory'], 'neutral': ['Silver', 'White', 'Beige']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'White'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'White'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#FFDB58': {'complementary': ['Navy', 'Burgundy', 'Teal'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Ivory', 'Silver', 'Beige']},
                    '#36454F': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Ivory', 'Silver', 'Beige']}
                },
                'Olive': {
                    '#001F3F': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Royal Blue', 'Teal', 'Navy'], 'triadic': ['Coral', 'Emerald', 'Gold'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#000000': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Charcoal', 'Grey', 'Black'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#FFFFFF': {'complementary': ['Emerald', 'Burgundy', 'Navy'], 'analogous': ['Ivory', 'Cream', 'White'], 'triadic': ['Emerald', 'Coral', 'Gold'], 'neutral': ['Camel', 'Gold', 'Beige']},
                    '#800020': {'complementary': ['White', 'Silver', 'Gold'], 'analogous': ['Maroon', 'Red', 'Burgundy'], 'triadic': ['Teal', 'Gold', 'Beige'], 'neutral': ['Camel', 'Tan', 'Beige']},
                    '#50C878': {'complementary': ['Gold', 'White', 'Silver'], 'analogous': ['Teal', 'Emerald', 'Green'], 'triadic': ['Purple', 'Gold', 'White'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#FFD700': {'complementary': ['Emerald', 'Burgundy', 'Navy'], 'analogous': ['Mustard', 'Gold', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Teal'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#4169E1': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Navy', 'Royal Blue', 'Teal'], 'triadic': ['Coral', 'Gold', 'Beige'], 'neutral': ['Camel', 'Tan', 'Beige']},
                    '#FF7F50': {'complementary': ['Teal', 'Navy', 'White'], 'analogous': ['Peach', 'Coral', 'Pink'], 'triadic': ['Royal Blue', 'Gold', 'Camel'], 'neutral': ['Beige', 'Tan', 'Camel']},
                    '#FFDB58': {'complementary': ['Emerald', 'Burgundy', 'Navy'], 'analogous': ['Gold', 'Mustard', 'Champagne'], 'triadic': ['Royal Blue', 'Coral', 'Purple'], 'neutral': ['Beige', 'Camel', 'Tan']},
                    '#36454F': {'complementary': ['White', 'Gold', 'Silver'], 'analogous': ['Black', 'Charcoal', 'Grey'], 'triadic': ['White', 'Teal', 'Gold'], 'neutral': ['Beige', 'Camel', 'Tan']}
                }
            }
        }

        # Get personalized combinations based on gender and skin tone
        gender_data = COLOR_HARMONY_DB.get(gender, COLOR_HARMONY_DB['female'])
        skin_tone_data = gender_data.get(skin_tone, gender_data['Medium'])

        # Find the closest matching base color
        base_color_combinations = None
        for color_key, combinations in skin_tone_data.items():
            if color_key.upper() == base_color:
                base_color_combinations = combinations
                break

        # If exact match not found, use Navy Blue as default
        if not base_color_combinations:
            base_color_combinations = skin_tone_data.get('#001F3F', {
                'complementary': ['Gold', 'White', 'Silver'],
                'analogous': ['Royal Blue', 'Teal', 'Navy'],
                'triadic': ['Coral', 'Emerald', 'Gold'],
                'neutral': ['Ivory', 'Silver', 'White']
            })

        return jsonify({
            'complementary': base_color_combinations['complementary'],
            'analogous': base_color_combinations['analogous'],
            'triadic': base_color_combinations['triadic'],
            'neutral': base_color_combinations['neutral']
        })

    except Exception as e:
        print(f"Color combinations error: {e}")
        return jsonify({
            'complementary': ['Gold', 'White', 'Silver'],
            'analogous': ['Royal Blue', 'Teal', 'Navy'],
            'triadic': ['Coral', 'Emerald', 'Gold'],
            'neutral': ['Ivory', 'Silver', 'White']
        }), 200
