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
    Legacy dominant color extractor. Now delegates to the enhanced
    extract_full_palette for consistency and accuracy. Kept for API
    compatibility (always returns top-4 swatches max).
    """
    try:
        name, hex_val, rgb, swatches = extract_full_palette(image_input, k=5)
        return name, hex_val, rgb, (swatches[:4] if swatches else [])
    except Exception as e:
        print(f"Dominant color extraction fallback error: {e}")
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


def delta_e_cie2000(lab1, lab2):
    """
    Calculate Delta E CIE 2000 color difference - more perceptually accurate than raw Euclidean.
    Implements the CIEDE2000 formula with standard parameters (kL=kC=kH=1).
    """
    try:
        L1, a1, b1 = lab1
        L2, a2, b2 = lab2

        C1 = np.sqrt(a1**2 + b1**2)
        C2 = np.sqrt(a2**2 + b2**2)
        C_avg = (C1 + C2) / 2.0
        C_avg7 = C_avg**7

        G = 0.5 * (1 - np.sqrt(C_avg7 / (C_avg7 + 25**7)))

        a1p = a1 * (1 + G)
        a2p = a2 * (1 + G)

        C1p = np.sqrt(a1p**2 + b1**2)
        C2p = np.sqrt(a2p**2 + b2**2)

        h1p = np.degrees(np.arctan2(b1, a1p)) % 360 if (b1 != 0 or a1p != 0) else 0.0
        h2p = np.degrees(np.arctan2(b2, a2p)) % 360 if (b2 != 0 or a2p != 0) else 0.0

        dLp = L2 - L1
        dCp = C2p - C1p

        dhp = 0.0
        if C1p * C2p != 0:
            if abs(h2p - h1p) <= 180:
                dhp = h2p - h1p
            elif h2p - h1p > 180:
                dhp = h2p - h1p - 360
            else:
                dhp = h2p - h1p + 360

        dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dhp / 2.0))

        Lavg = (L1 + L2) / 2.0
        Cavg_p = (C1p + C2p) / 2.0

        havg_p = 0.0
        if C1p * C2p != 0:
            if abs(h1p - h2p) <= 180:
                havg_p = (h1p + h2p) / 2.0
            elif (h1p + h2p) < 360:
                havg_p = (h1p + h2p + 360) / 2.0
            else:
                havg_p = (h1p + h2p - 360) / 2.0

        T = (1
             - 0.17 * np.cos(np.radians(havg_p - 30))
             + 0.24 * np.cos(np.radians(2 * havg_p))
             + 0.32 * np.cos(np.radians(3 * havg_p + 6))
             - 0.20 * np.cos(np.radians(4 * havg_p - 63)))

        SL = 1 + (0.015 * (Lavg - 50)**2) / np.sqrt(20 + (Lavg - 50)**2)
        SC = 1 + 0.045 * Cavg_p
        SH = 1 + 0.015 * Cavg_p * T

        delta_theta = 30 * np.exp(-((havg_p - 275) / 25)**2)
        RC = 2 * np.sqrt(Cavg_p**7 / (Cavg_p**7 + 25**7))
        RT = -np.sin(np.radians(2 * delta_theta)) * RC

        term_L = dLp / SL
        term_C = dCp / SC
        term_H = dHp / SH

        delta_e = np.sqrt(term_L**2 + term_C**2 + term_H**2 + RT * term_C * term_H)
        return float(delta_e)
    except Exception:
        return 100.0


def color_similarity_2000(rgb1, rgb2):
    """Perceptual color similarity 0.0-1.0 using CIEDE2000, more accurate for fashion colors."""
    try:
        lab1 = rgb_to_lab(rgb1)
        lab2 = rgb_to_lab(rgb2)
        de = delta_e_cie2000(lab1, lab2)
        return max(0.0, 1.0 - (de / 100.0))
    except Exception:
        return 0.5


def palette_similarity(swatches1, swatches2):
    """
    Weighted multi-color palette similarity using Earth Mover's-like approach.
    Compares top color swatches with their percentages.

    Each swatch is a dict: {"rgb": [r,g,b], "percentage": 0-100, "name":..., "hex":...}
    Returns similarity score 0.0 - 1.0
    """
    if not swatches1 or not swatches2:
        return 0.0

    def normalize(swatches):
        valid = [s for s in swatches if isinstance(s.get('rgb'), (list, tuple)) and len(s.get('rgb', [])) == 3]
        if not valid:
            return []
        total_pct = sum(max(0.01, float(s.get('percentage', 100.0 / len(valid)))) for s in valid)
        normalized = []
        for s in valid:
            pct = max(0.01, float(s.get('percentage', 100.0 / len(valid))))
            normalized.append({
                'rgb': tuple(int(c) for c in s['rgb']),
                'weight': pct / total_pct
            })
        return sorted(normalized, key=lambda x: -x['weight'])

    p1 = normalize(swatches1)
    p2 = normalize(swatches2)

    if not p1 or not p2:
        return 0.0

    n1 = min(len(p1), 5)
    n2 = min(len(p2), 5)
    p1 = p1[:n1]
    p2 = p2[:n2]

    best_matches = []
    used_j = set()
    for i, s1 in enumerate(p1):
        best_j = -1
        best_sim = -1.0
        for j, s2 in enumerate(p2):
            if j in used_j:
                continue
            sim = color_similarity_2000(s1['rgb'], s2['rgb'])
            if sim > best_sim:
                best_sim = sim
                best_j = j
        if best_j >= 0:
            used_j.add(best_j)
            w1 = s1['weight']
            w2 = p2[best_j]['weight']
            combined_weight = np.sqrt(w1 * w2)
            best_matches.append(best_sim * combined_weight)

    if not best_matches:
        return 0.0

    total_weight_coverage = min(1.0, sum(s['weight'] for s in p1) * sum(s['weight'] for s in p2))
    raw_score = sum(best_matches) / max(0.001, len(best_matches))

    overlap_penalty = 0.0
    if abs(len(p1) - len(p2)) >= 2:
        overlap_penalty = 0.05

    final_score = max(0.0, min(1.0, (raw_score * 0.85) + (total_weight_coverage * 0.15) - overlap_penalty))
    return float(final_score)


def _build_skin_mask(hsv):
    """Skin-tone mask that preserves vibrant red/pink fashion items (no false positives).

    Real skin HSV characteristics:
      - Low-to-moderate saturation (S rarely > 130; Caucasian ~40-100, tan ~70-130)
      - Red-hue-band (H 0-18) but only at low/moderate saturation
      - Pink-hue-band (H 165-180) same saturation rule
      - Value generally 90+ (skin isn't pitch black)
    Vibrant fashion reds have S > 140 and are safely excluded.
    """
    s_skin_cap = 130
    lower_skin_1 = np.array([0, 25, 85], dtype=np.uint8)
    upper_skin_1 = np.array([18, s_skin_cap, 255], dtype=np.uint8)
    lower_skin_2 = np.array([165, 25, 85], dtype=np.uint8)
    upper_skin_2 = np.array([180, s_skin_cap, 255], dtype=np.uint8)
    skin_loose = cv2.bitwise_or(
        cv2.inRange(hsv, lower_skin_1, upper_skin_1),
        cv2.inRange(hsv, lower_skin_2, upper_skin_2),
    )

    lower_skin_soft = np.array([0, 15, 95], dtype=np.uint8)
    upper_skin_soft = np.array([18, 90, 255], dtype=np.uint8)
    lower_skin_soft2 = np.array([165, 15, 95], dtype=np.uint8)
    upper_skin_soft2 = np.array([180, 90, 255], dtype=np.uint8)
    skin_core = cv2.bitwise_or(
        cv2.inRange(hsv, lower_skin_soft, upper_skin_soft),
        cv2.inRange(hsv, lower_skin_soft2, upper_skin_soft2),
    )
    return cv2.bitwise_or(skin_loose, skin_core)


def extract_full_palette(image_input, k=6):
    """
    Enhanced palette extractor with robust red-preserving skin mask +
    automatic fallback when over-filtering is detected.
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

        img = cv2.resize(img, (240, 240), interpolation=cv2.INTER_AREA)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        total_pixels = rgb.shape[0] * rgb.shape[1]

        skin_mask = _build_skin_mask(hsv)

        white_bg_mask = cv2.inRange(hsv, np.array([0, 0, 230]), np.array([180, 35, 255]))
        light_bg_mask = cv2.inRange(lab, np.array([205, 118, 118]), np.array([255, 137, 137]))
        black_bg_mask = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 18]))
        dark_bg_mask = cv2.inRange(lab, np.array([0, 120, 120]), np.array([22, 135, 135]))

        bg_only_mask = cv2.bitwise_or(white_bg_mask, light_bg_mask)
        bg_only_mask = cv2.bitwise_or(bg_only_mask, black_bg_mask)
        bg_only_mask = cv2.bitwise_or(bg_only_mask, dark_bg_mask)

        ignore_mask = cv2.bitwise_or(skin_mask, bg_only_mask)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        ignore_mask = cv2.dilate(ignore_mask, kernel, iterations=1)
        valid_mask = cv2.bitwise_not(ignore_mask)

        valid_pixels = rgb[valid_mask > 0]
        ratio = len(valid_pixels) / max(1, total_pixels)

        min_pixels = 400
        if ratio < 0.08 or len(valid_pixels) < min_pixels:
            bg_valid_mask = cv2.bitwise_not(bg_only_mask)
            bg_pixels = rgb[bg_valid_mask > 0]
            bg_ratio = len(bg_pixels) / max(1, total_pixels)
            if bg_ratio >= 0.12 and len(bg_pixels) >= min_pixels:
                valid_pixels = bg_pixels
                ratio = bg_ratio

        if ratio < 0.06 or len(valid_pixels) < min_pixels:
            h, w = rgb.shape[:2]
            ch, cw = int(h * 0.18), int(w * 0.18)
            center = rgb[ch:h - ch, cw:w - cw].reshape((-1, 3))
            if len(center) > len(valid_pixels):
                valid_pixels = center

        if len(valid_pixels) < 200:
            valid_pixels = rgb.reshape((-1, 3))

        pixels_float = valid_pixels.astype(np.float32)
        n = len(pixels_float)
        k_val = min(k, max(2, min(6, n // 80)))

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.2)
        _, labels, centers = cv2.kmeans(pixels_float, k_val, None, criteria, 15, cv2.KMEANS_PP_CENTERS)

        centers = np.uint8(centers)
        counts = np.bincount(labels.flatten())
        sorted_indices = np.argsort(counts)[::-1]

        swatches = []
        for idx in sorted_indices:
            c_rgb = centers[idx].tolist()
            pct = int((counts[idx] / len(labels)) * 100)
            if pct < 2 and len(swatches) >= 3:
                continue
            name, hex_val, _ = find_closest_color(c_rgb)
            if not any(s.get('name') == name for s in swatches):
                swatches.append({
                    "name": name,
                    "hex": hex_val,
                    "rgb": c_rgb,
                    "percentage": pct
                })
            else:
                for s in swatches:
                    if s.get('name') == name:
                        s['percentage'] += pct
                        break

        swatches = sorted(swatches, key=lambda s: -s['percentage'])
        total = sum(s['percentage'] for s in swatches)
        if total > 0:
            for s in swatches:
                s['percentage'] = int(round(s['percentage'] * 100.0 / total))

        if swatches:
            primary = swatches[0]
            return primary['name'], primary['hex'], primary['rgb'], swatches

        return "Navy Blue", "#0F1C40", [15, 28, 64], []

    except Exception as e:
        print(f"Full palette extraction exception: {e}")
        import traceback
        traceback.print_exc()
        return "Navy Blue", "#0F1C40", [15, 28, 64], []

