from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import os

accessory_bp = Blueprint('accessory', __name__)

def rgb_to_fashion_name(rgb):
    """Map RGB values to nearest fashion color name using Euclidean distance."""
    r, g, b = rgb
    
    # Define a comprehensive fashion color palette
    FASHION_PALETTE = {
        "White": (255, 255, 255),
        "Ivory": (255, 255, 240),
        "Black": (0, 0, 0),
        "Charcoal": (54, 69, 79),
        "Grey": (128, 128, 128),
        "Silver": (192, 192, 192),
        "Navy Blue": (0, 0, 128),
        "Royal Blue": (65, 105, 225),
        "Sky Blue": (135, 206, 235),
        "Teal": (0, 128, 128),
        "Emerald": (80, 200, 120),
        "Green": (0, 128, 0),
        "Olive": (128, 128, 0),
        "Red": (255, 0, 0),
        "Burgundy": (128, 0, 32),
        "Maroon": (128, 0, 0),
        "Pink": (255, 192, 203),
        "Coral": (255, 127, 80),
        "Peach": (255, 218, 185),
        "Orange": (255, 165, 0),
        "Yellow": (255, 255, 0),
        "Mustard": (255, 219, 88),
        "Gold": (255, 215, 0),
        "Purple": (128, 0, 128),
        "Plum": (142, 69, 133),
        "Beige": (245, 245, 220),
        "Camel": (193, 154, 107),
        "Tan": (210, 180, 140),
        "Brown": (165, 42, 42),
        "Rust": (183, 65, 14)
    }
    
    min_dist = float('inf')
    detected_name = "Navy Blue"
    
    for name, target_rgb in FASHION_PALETTE.items():
        dist = ((r - target_rgb[0]) ** 2 + (g - target_rgb[1]) ** 2 + (b - target_rgb[2]) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            detected_name = name
            
    return detected_name

@accessory_bp.route('/api/accessory/analyze', methods=['POST'])
def analyze_accessory():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file"}), 400
        
        file = request.files['image']
        gender = request.form.get('gender', 'female')
        user_detected_color = request.form.get('detected_color', '').strip()
        
        detected_color = user_detected_color if user_detected_color else None
        
        if not detected_color:
            file.seek(0)
            file_bytes = file.read()
            if not file_bytes:
                 return jsonify({"error": "Empty image file"}), 400
                 
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                detected_color = "Navy Blue"
            else:
                # Center crop to focus on garment
                h, w = img.shape[:2]
                y1, y2 = int(h * 0.2), int(h * 0.8)
                x1, x2 = int(w * 0.2), int(w * 0.8)
                crop = img[y1:y2, x1:x2]
                
                if crop.size == 0:
                    crop = img
                
                crop = cv2.resize(crop, (150, 150))
                img_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                img_flat = img_rgb.reshape((-1, 3)).astype(np.float32)
                
                K = 5
                criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
                _, labels, centers = cv2.kmeans(img_flat, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
                
                counts = np.bincount(labels.flatten())
                centers = centers.astype(int)
                sorted_indices = np.argsort(counts)[::-1]
                
                best_rgb = centers[sorted_indices[0]] 
                
                for idx in sorted_indices:
                    rgb = centers[idx]
                    std_dev = np.std(rgb)
                    is_neutral = std_dev < 15
                    is_too_bright = all(c > 240 for c in rgb)
                    is_too_dark = all(c < 15 for c in rgb)
                    
                    if not (is_neutral or is_too_bright or is_too_dark):
                        best_rgb = rgb
                        break
                    
                    if idx != sorted_indices[0] and counts[idx] > (len(img_flat) * 0.15):
                        if not (is_neutral or is_too_bright or is_too_dark):
                            best_rgb = rgb
                            break

                detected_color = rgb_to_fashion_name(best_rgb)
    except Exception as e:
        print(f"Extraction Error: {e}")
        detected_color = "Navy Blue"

    # Style and recommendations
    detected_style = "Formal" if detected_color.lower() in ["black", "navy blue", "white", "grey", "charcoal", "ivory", "silver"] else "Casual"
    
    accessory_recommendations = {
        'female': {
            'formal': [
                "Pearl Stud Earrings", "Gold Chain Necklace", "Silk Scarf", "Structured Handbag", "Nude Pumps", 
                "Statement Cuff Bracelet", "Pearl Drop Earrings", "Classic Watch", "Gold Hoop Earrings", 
                "Leather Belt", "Designer Sunglasses", "Clutch Purse", "Ankle Strap Heels", "Pearl Necklace", 
                "Gold Bangle Stack"
            ],
            'casual': [
                "Layered Necklaces", "Hoop Earrings", "Canvas Tote Bag", "Sporty Sneakers", "Leather Crossbody", 
                "Charm Bracelets", "Sunglasses", "Baseball Cap", "Ankle Socks", "Beaded Bracelet", 
                "Hair Clip", "Canvas Sneakers", "Woven Bracelet", "Stud Earrings", "Denim Belt"
            ]
        },
        'male': {
            'formal': [
                "Leather Dress Watch", "Cufflinks", "Pocket Square", "Leather Belt", "Oxford Loafers", 
                "Tie Clip", "Lapel Pin", "Monogrammed Cufflinks", "Dress Socks", "Leather Briefcase", 
                "Stud Set", "Silver Cufflinks", "Dress Watch", "Silk Pocket Square", "Monocle Chain"
            ],
            'casual': [
                "Sports Watch", "Leather Bracelet", "Baseball Cap", "Canvas Sneakers", "Backpack", 
                "Sunglasses", "Beaded Bracelet", "Wallet Chain", "Leather Belt", "Canvas Belt", 
                "Fishing Hat", "Sports Sunglasses", "Money Clip", "Keychain", "Dog Tags"
            ]
        }
    }
    
    gender_key = gender if gender in ['male', 'female'] else 'female'
    style_key = detected_style.lower()
    
    recommendations = accessory_recommendations[gender_key].get(style_key, accessory_recommendations[gender_key]['casual'])

    return jsonify({
        "detected_color": detected_color,
        "gender": gender_key,
        "detected_style": detected_style,
        "recommendations": recommendations[:15]
    })

@accessory_bp.route('/api/skin-tone/analyze', methods=['POST'])
def analyze_skin_tone():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file"}), 400
        
        file = request.files['image']
        file.seek(0)
        nparr = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Invalid image"}), 400
        
        img = cv2.resize(img, (224, 224))
        h, w = img.shape[:2]
        center_h, center_w = h//2, w//2
        crop_size = min(center_h, center_w, 100)
        face_crop = img[center_h-crop_size:center_h+crop_size, center_w-crop_size:center_w+crop_size]
        
        hsv = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        ranges = [
            (np.array([0, 10, 50]), np.array([25, 255, 255])),
            (np.array([160, 10, 50]), np.array([185, 255, 255])),
            (np.array([0, 30, 60]), np.array([20, 200, 255])),
            (np.array([165, 30, 60]), np.array([180, 200, 255]))
        ]
        
        skin_mask = np.zeros(hsv.shape[:2], np.uint8)
        for lower, upper in ranges:
            skin_mask |= cv2.inRange(hsv, lower, upper)
        
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11,11))
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
        
        skin_pixels = face_crop[skin_mask > 0]
        if len(skin_pixels) == 0:
            skin_pixels = img.reshape(-1, 3)
        
        mean_bgr = np.mean(skin_pixels, axis=0).astype(int)
        mean_r, mean_g, mean_b = mean_bgr[::-1]
        
        if mean_r > 210: tone = "Fair"
        elif mean_r > 180: tone = "Light"
        elif mean_g < 100: tone = "Olive"
        elif mean_r < 100: tone = "Rich Dark"
        elif mean_b > 140: tone = "Deep Brown"
        else: tone = "Medium/Wheatish"
        
        hex_color = '#{:02x}{:02x}{:02x}'.format(mean_r, mean_g, mean_b)
        return jsonify({"skin_tone": tone, "skin_hex": hex_color})
    except Exception as e:
        print(f"Skin Tone Error: {e}")
        return jsonify({"error": str(e)}), 500

@accessory_bp.route('/api/color-combinations', methods=['POST'])
def get_color_combinations():
    data = request.json
    base_color_name = data.get('color', 'Navy Blue')
    
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

    # If it's a hex color, we should find the nearest name
    if base_color_name.startswith('#'):
        try:
            r = int(base_color_name[1:3], 16)
            g = int(base_color_name[3:5], 16)
            b = int(base_color_name[5:7], 16)
            base_color_name = rgb_to_fashion_name((r, g, b))
        except:
            base_color_name = "Navy Blue"

    # Expert Harmony Logic
    HARMONY_RULES = {
        "Navy Blue": {
            "complementary": ["Mustard", "Gold", "Orange"],
            "analogous": ["Royal Blue", "Teal", "Charcoal"],
            "triadic": ["Burgundy", "Emerald", "Grey"],
            "neutral": ["White", "Beige", "Silver"]
        },
        "Black": {
            "complementary": ["White", "Gold", "Silver"],
            "analogous": ["Charcoal", "Grey", "Navy Blue"],
            "triadic": ["Red", "Royal Blue", "Emerald"],
            "neutral": ["Ivory", "Camel", "Beige"]
        },
        "Burgundy": {
            "complementary": ["Emerald", "Gold", "Ivory"],
            "analogous": ["Red", "Plum", "Rust"],
            "triadic": ["Navy Blue", "Mustard", "Teal"],
            "neutral": ["Black", "Grey", "Tan"]
        },
        "Emerald": {
            "complementary": ["Burgundy", "Ruby Red", "Gold"],
            "analogous": ["Teal", "Green", "Olive"],
            "triadic": ["Royal Blue", "Mustard", "Purple"],
            "neutral": ["Black", "White", "Silver"]
        },
        "Mustard": {
            "complementary": ["Navy Blue", "Royal Blue", "Plum"],
            "analogous": ["Orange", "Yellow", "Rust"],
            "triadic": ["Teal", "Burgundy", "Charcoal"],
            "neutral": ["Black", "Grey", "Beige"]
        }
    }

    # Default logic for any other color
    result = HARMONY_RULES.get(base_color_name, {
        "complementary": ["White", "Black", "Gold"],
        "analogous": ["Grey", "Navy Blue", "Silver"],
        "triadic": ["Burgundy", "Emerald", "Royal Blue"],
        "neutral": ["Beige", "Ivory", "Tan"]
    })

    return jsonify(result)
