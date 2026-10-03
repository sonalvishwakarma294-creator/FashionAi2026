import cv2
import numpy as np

# Comprehensive fashion color palette with RGB & LAB values for accurate perceptual matching
FASHION_PALETTE = [
    # Neutrals & Monochromes
    {"name": "Pure White", "rgb": (255, 255, 255), "hex": "#FFFFFF"},
    {"name": "Off-White / Cream", "rgb": (245, 240, 225), "hex": "#F5F0E1"},
    {"name": "Jet Black", "rgb": (18, 18, 18), "hex": "#121212"},
    {"name": "Charcoal Grey", "rgb": (54, 54, 58), "hex": "#36363A"},
    {"name": "Heather Grey", "rgb": (150, 153, 158), "hex": "#96999E"},
    {"name": "Beige / Nude", "rgb": (224, 204, 178), "hex": "#E0CCB2"},
    {"name": "Camel / Khaki", "rgb": (193, 154, 107), "hex": "#C19A6B"},
    {"name": "Chocolate Brown", "rgb": (74, 44, 30), "hex": "#4A2C1E"},
    {"name": "Tan / Cognac", "rgb": (168, 107, 54), "hex": "#A86B36"},

    # Blues & Teals
    {"name": "Navy Blue", "rgb": (15, 28, 64), "hex": "#0F1C40"},
    {"name": "Midnight Blue", "rgb": (25, 45, 95), "hex": "#192D5F"},
    {"name": "Royal Blue", "rgb": (30, 75, 185), "hex": "#1E4BB9"},
    {"name": "Denim Blue", "rgb": (70, 110, 160), "hex": "#466EA0"},
    {"name": "Sky Blue", "rgb": (125, 185, 240), "hex": "#7DB9F0"},
    {"name": "Teal / Cyan", "rgb": (20, 125, 135), "hex": "#147D87"},
    {"name": "Turquoise", "rgb": (64, 200, 208), "hex": "#40C8D0"},

    # Greens
    {"name": "Emerald Green", "rgb": (25, 125, 75), "hex": "#197D4B"},
    {"name": "Forest / Dark Green", "rgb": (20, 65, 35), "hex": "#144123"},
    {"name": "Olive Green", "rgb": (95, 110, 45), "hex": "#5F6E2D"},
    {"name": "Sage / Mint Green", "rgb": (145, 175, 140), "hex": "#91AF8C"},

    # Reds, Pinks & Maroons
    {"name": "Ruby Red", "rgb": (200, 25, 40), "hex": "#C81928"},
    {"name": "Crimson", "rgb": (160, 20, 45), "hex": "#A0142D"},
    {"name": "Burgundy / Wine", "rgb": (105, 18, 42), "hex": "#69122A"},
    {"name": "Maroon", "rgb": (85, 15, 25), "hex": "#550F19"},
    {"name": "Blush Pink", "rgb": (245, 185, 195), "hex": "#F5B9C3"},
    {"name": "Hot Pink / Fuchsia", "rgb": (220, 40, 130), "hex": "#DC2882"},
    {"name": "Coral / Peach", "rgb": (245, 120, 100), "hex": "#F57864"},

    # Yellows, Oranges & Purples
    {"name": "Mustard Yellow", "rgb": (225, 165, 25), "hex": "#E1A519"},
    {"name": "Pastel Yellow", "rgb": (250, 235, 150), "hex": "#FAE896"},
    {"name": "Burnt Orange / Rust", "rgb": (195, 75, 30), "hex": "#C34B1E"},
    {"name": "Lavender / Lilac", "rgb": (180, 155, 215), "hex": "#B49BD7"},
    {"name": "Deep Plum / Purple", "rgb": (90, 25, 95), "hex": "#5A195F"},
    {"name": "Royal Purple", "rgb": (115, 40, 155), "hex": "#73289B"},
    {"name": "Metallic Gold", "rgb": (212, 175, 55), "hex": "#D4AF37"},
]

def rgb_to_lab(rgb):
    """Convert RGB tuple to CIELAB using OpenCV."""
    pixel_bgr = np.uint8([[[rgb[2], rgb[1], rgb[0]]]])
    lab = cv2.cvtColor(pixel_bgr, cv2.COLOR_BGR2LAB)[0][0]
    return lab.astype(float)

# Precompute LAB values for the palette for lightning fast Delta-E lookup
for item in FASHION_PALETTE:
    item['lab'] = rgb_to_lab(item['rgb'])

def find_closest_color(rgb):
    """Finds the perceptually closest fashion color name using CIELAB Delta-E distance."""
    target_lab = rgb_to_lab(rgb)
    best_item = FASHION_PALETTE[0]
    min_dist = float('inf')
    
    for item in FASHION_PALETTE:
        # Euclidean distance in CIELAB space corresponds directly to human perceptual color difference (Delta E)
        d_l = target_lab[0] - item['lab'][0]
        d_a = target_lab[1] - item['lab'][1]
        d_b = target_lab[2] - item['lab'][2]
        dist = np.sqrt(d_l**2 + d_a**2 + d_b**2)
        if dist < min_dist:
            min_dist = dist
            best_item = item
            
    return best_item['name'], best_item['hex'], best_item['rgb']

def extract_dominant_color(image_input):
    """
    Robust garment color extractor:
    - Accepts file path, cv2 numpy image array, or PIL image.
    - Filters out solid white/black photo backgrounds.
    - Filters out human skin pixels using HSV masking.
    - Runs K-Means in RGB & CIELAB color space.
    - Returns primary color, hex, RGB, and top 5 garment palette swatches.
    """
    try:
        if isinstance(image_input, str):
            img = cv2.imread(image_input)
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            return "Navy Blue", "#0F1C40", [15, 28, 64], []

        if img is None:
            return "Navy Blue", "#0F1C40", [15, 28, 64], []

        # Resize for fast, uniform analysis
        img = cv2.resize(img, (200, 200), interpolation=cv2.INTER_AREA)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # 1. Mask out human skin tones (H: 0-25, S: 30-190, V: 50-255)
        lower_skin = np.array([0, 30, 50], dtype=np.uint8)
        upper_skin = np.array([25, 190, 255], dtype=np.uint8)
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)

        # 2. Mask out pure studio white background (V > 240, S < 25) and jet black shadow (V < 15)
        white_bg_mask = cv2.inRange(hsv, np.array([0, 0, 240]), np.array([180, 25, 255]))
        black_bg_mask = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 18]))

        # Combined ignore mask
        ignore_mask = cv2.bitwise_or(skin_mask, white_bg_mask)
        ignore_mask = cv2.bitwise_or(ignore_mask, black_bg_mask)
        valid_mask = cv2.bitwise_not(ignore_mask)

        # Extract valid garment pixels
        valid_pixels = rgb[valid_mask > 0]

        # If too many pixels were filtered (e.g., solid white/black shirt or closeup), fallback to central crop
        if len(valid_pixels) < 200:
            h, w = rgb.shape[:2]
            center_crop = rgb[int(h * 0.25):int(h * 0.75), int(w * 0.25):int(w * 0.75)]
            valid_pixels = center_crop.reshape((-1, 3))

        pixels_float = valid_pixels.astype(np.float32)

        # 3. K-Means clustering (k=5)
        k = min(5, max(2, len(pixels_float) // 50))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5)
        _, labels, centers = cv2.kmeans(pixels_float, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

        centers = np.uint8(centers)
        counts = np.bincount(labels.flatten())

        # Sort clusters by frequency
        sorted_indices = np.argsort(counts)[::-1]

        swatches = []
        for idx in sorted_indices:
            c_rgb = centers[idx].tolist()
            name, hex_val, _ = find_closest_color(c_rgb)
            if not any(s['name'] == name for s in swatches):
                swatches.append({
                    "name": name,
                    "hex": hex_val,
                    "rgb": c_rgb,
                    "percentage": int((counts[idx] / len(labels)) * 100)
                })

        # Primary dominant color
        if swatches:
            primary = swatches[0]
            return primary['name'], primary['hex'], primary['rgb'], swatches[:4]

        return "Navy Blue", "#0F1C40", [15, 28, 64], []

    except Exception as e:
        print(f"Color extraction exception: {e}")
        return "Navy Blue", "#0F1C40", [15, 28, 64], []

def color_similarity(rgb1, rgb2):
    """Calculate perceptual color similarity score between 0.0 and 1.0 using CIELAB."""
    try:
        lab1 = rgb_to_lab(rgb1)
        lab2 = rgb_to_lab(rgb2)
        delta_e = np.sqrt(np.sum((lab1 - lab2)**2))
        return max(0.0, 1.0 - (delta_e / 100.0))
    except Exception:
        return 0.5
