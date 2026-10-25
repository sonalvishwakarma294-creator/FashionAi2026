from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import os
import google.generativeai as genai
import json
from PIL import Image
import io
import math

from utils.color_utils import (
    extract_dominant_color,
    find_closest_color,
    rgb_to_lab,
    delta_e_cie2000,
    FASHION_PALETTE,
)
from utils.fashion_color_harmony import build_color_combinations

accessory_bp = Blueprint('accessory', __name__, url_prefix='/api')

# =========================================================================
# SKIN-TONE ANALYSIS (accurate, multi-region, LAB + HSV based)
# =========================================================================

TONE_LABELS = ['Very Light', 'Light', 'Medium', 'Tan', 'Deep']
UNDERTONE_LABELS = ['Warm', 'Cool', 'Neutral']


def _compute_robust_skin_stats(skin_rgb_pixels):
    """Given an (N,3) array of skin RGB pixels, remove shadows/highlights/outliers
    and return a robust representative skin color (median of central 60%)."""
    if skin_rgb_pixels is None or len(skin_rgb_pixels) == 0:
        return None, 0

    if len(skin_rgb_pixels) > 20000:
        idx = np.linspace(0, len(skin_rgb_pixels) - 1, 20000, dtype=np.int64)
        skin_rgb_pixels = skin_rgb_pixels[idx]

    rgb_f = np.asarray(skin_rgb_pixels, dtype=np.float32)
    lab = rgb_to_lab_batch(rgb_f)
    L = lab[:, 0]

    q20, q80 = np.percentile(L, [20, 80])
    mask = (L >= q20) & (L <= q80)
    if np.count_nonzero(mask) < 30:
        mask = np.ones(len(L), dtype=bool)

    central_rgb = rgb_f[mask]
    central_lab = lab[mask]

    median_rgb = np.median(central_rgb, axis=0)
    mean_rgb = np.mean(central_rgb, axis=0)

    representative = 0.7 * median_rgb + 0.3 * mean_rgb
    representative = np.clip(representative, 0, 255)

    med_L = np.median(central_lab[:, 0])
    std_L = float(np.std(central_lab[:, 0])) if len(central_lab) > 1 else 0.0

    return representative, len(central_rgb), med_L, std_L, central_lab


def rgb_to_lab_batch(rgb_batch_float):
    """Vectorized rgb_to_lab for (N,3) float32 in 0-255 range."""
    rgb = np.clip(rgb_batch_float, 0, 255).reshape((-1, 1, 3)).astype(np.uint8)
    bgr = rgb[:, :, ::-1]
    lab_img = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    return lab_img.reshape((-1, 3)).astype(np.float32)


def _classify_tone(med_L):
    """
    Classify skin L* into 5 meaningful bins.
    Typical human skin L* range: ~28 (deepest) -> ~90 (lightest)
    """
    if med_L >= 80:
        return 'Very Light'
    if med_L >= 68:
        return 'Light'
    if med_L >= 54:
        return 'Medium'
    if med_L >= 40:
        return 'Tan'
    return 'Deep'


def _undertone_from_rgb_and_central_lab(central_lab_2d, med_L, tone_label):
    """
    Robust undertone estimation:
    Uses the LAB a* (red-green) vs b* (yellow-blue) relationship AND
    computes the classic warmth ratio using (R - B) / (R + B) on representative colors.
    Returns (undertone_label, confidence_pct, strength -1..1)
    """
    if central_lab_2d is None or len(central_lab_2d) < 10:
        return 'Neutral', 30, 0.0

    a = central_lab_2d[:, 1]
    b = central_lab_2d[:, 2]

    med_a = float(np.median(a))
    med_b = float(np.median(b))

    if med_L > 70:
        b_thresh = 128.0 + 1.5
    elif med_L > 55:
        b_thresh = 128.0 + 1.0
    elif med_L > 40:
        b_thresh = 128.0 + 0.8
    else:
        b_thresh = 128.0 + 0.5

    a_corrected = (med_a - 128.0)
    b_corrected = (med_b - 128.0)

    if med_L < 55:
        weight_a = 0.55
        weight_b = 0.45
    else:
        weight_a = 0.4
        weight_b = 0.6

    warmth_raw = weight_a * a_corrected + weight_b * b_corrected

    if med_L < 45:
        scale = 5.0
    elif med_L < 60:
        scale = 6.0
    elif med_L < 75:
        scale = 7.0
    else:
        scale = 8.0

    strength = max(-1.0, min(1.0, warmth_raw / scale))

    threshold_strong = 0.30
    threshold_mild = 0.15

    if abs(strength) >= threshold_strong:
        undertone = 'Warm' if strength > 0 else 'Cool'
        conf = 70 + int(abs(strength) * 30)
    elif abs(strength) >= threshold_mild:
        undertone = 'Warm' if strength > 0 else 'Cool'
        conf = 50 + int(abs(strength) * 50)
    else:
        undertone = 'Neutral'
        conf = 60 + int((threshold_mild - abs(strength)) * 200)

    if tone_label == 'Deep' and abs(strength) < 0.1:
        undertone = 'Neutral'
        conf = max(conf, 55)

    return undertone, max(30, min(98, conf)), strength


def _assess_quality(
    original_img_shape,
    n_central_pixels,
    std_L,
    skin_ratio,
    lab_L_range,
    lab_a_range,
    lab_b_range,
):
    """
    Image-quality & reliability checks. Returns (quality_conf_penalty, warnings_list, overall_quality_score)
    """
    warnings = []
    penalty = 0

    h, w = original_img_shape[:2]
    if min(h, w) < 180:
        penalty += 25
        warnings.append("Image resolution is low. A higher resolution selfie yields more accurate analysis.")

    if skin_ratio < 0.06:
        penalty += 30
        warnings.append("Face is not clearly visible. Upload a front-facing photo where the face occupies most of the frame.")

    if skin_ratio > 0.65:
        penalty += 5
        warnings.append("The frame may be zoomed in too tightly; ensure natural lighting and neutral background.")

    if std_L > 16:
        penalty += 15
        warnings.append("Strong lighting variations detected (uneven shadows or highlights). Even natural lighting produces the best result.")

    chroma_range = math.sqrt(lab_a_range ** 2 + lab_b_range ** 2)
    if chroma_range > 22:
        penalty += 10
        warnings.append("Colored or artificial lighting detected. Please use neutral daylight or indoor lighting for accurate undertone prediction.")

    if lab_L_range < 10:
        penalty += 8

    quality = max(20, 100 - penalty)
    return quality, warnings


# -------------------------------------------------------------------------
# Extended fashion-color library for generating recommendations dynamically
# -------------------------------------------------------------------------
_CLOTHING_COLOR_LIBRARY = [
    # BLUES
    {"name": "Navy Blue", "hex": "#0F1C40", "family": "Blue", "lightness": 20, "warm_cool_score": -0.8, "saturation": 0.5},
    {"name": "Royal Blue", "hex": "#1D4ED8", "family": "Blue", "lightness": 45, "warm_cool_score": -0.9, "saturation": 0.85},
    {"name": "Sapphire Blue", "hex": "#0F52BA", "family": "Blue", "lightness": 40, "warm_cool_score": -0.85, "saturation": 0.8},
    {"name": "Teal", "hex": "#008080", "family": "Blue", "lightness": 42, "warm_cool_score": -0.3, "saturation": 0.8},
    {"name": "Powder Blue", "hex": "#B0C4DE", "family": "Blue", "lightness": 78, "warm_cool_score": -0.4, "saturation": 0.3},
    {"name": "Turquoise", "hex": "#40E0D0", "family": "Blue", "lightness": 75, "warm_cool_score": -0.15, "saturation": 0.75},
    {"name": "Sky Blue", "hex": "#87CEEB", "family": "Blue", "lightness": 82, "warm_cool_score": -0.45, "saturation": 0.4},
    {"name": "Cobalt Blue", "hex": "#0047AB", "family": "Blue", "lightness": 35, "warm_cool_score": -0.95, "saturation": 0.9},
    {"name": "Baby Blue", "hex": "#89CFF0", "family": "Blue", "lightness": 85, "warm_cool_score": -0.4, "saturation": 0.35},

    # GREENS
    {"name": "Emerald Green", "hex": "#50C878", "family": "Green", "lightness": 65, "warm_cool_score": -0.05, "saturation": 0.75},
    {"name": "Forest Green", "hex": "#228B22", "family": "Green", "lightness": 40, "warm_cool_score": 0.05, "saturation": 0.8},
    {"name": "Sage Green", "hex": "#9CAF88", "family": "Green", "lightness": 68, "warm_cool_score": 0.0, "saturation": 0.25},
    {"name": "Olive Green", "hex": "#6B8E23", "family": "Green", "lightness": 48, "warm_cool_score": 0.3, "saturation": 0.55},
    {"name": "Hunter Green", "hex": "#355E3B", "family": "Green", "lightness": 30, "warm_cool_score": 0.0, "saturation": 0.65},
    {"name": "Mint Green", "hex": "#98FF98", "family": "Green", "lightness": 92, "warm_cool_score": -0.1, "saturation": 0.4},

    # REDS / PINKS / PURPLES
    {"name": "Burgundy", "hex": "#800020", "family": "Red", "lightness": 18, "warm_cool_score": 0.35, "saturation": 0.85},
    {"name": "Crimson", "hex": "#DC143C", "family": "Red", "lightness": 40, "warm_cool_score": 0.6, "saturation": 0.95},
    {"name": "Ruby Red", "hex": "#E0115F", "family": "Red", "lightness": 45, "warm_cool_score": 0.5, "saturation": 0.95},
    {"name": "Brick Red", "hex": "#CB4154", "family": "Red", "lightness": 48, "warm_cool_score": 0.7, "saturation": 0.75},
    {"name": "Rose Pink", "hex": "#FFB6C1", "family": "Pink", "lightness": 88, "warm_cool_score": 0.2, "saturation": 0.45},
    {"name": "Blush Pink", "hex": "#FADADD", "family": "Pink", "lightness": 92, "warm_cool_score": 0.1, "saturation": 0.25},
    {"name": "Coral", "hex": "#FF7F50", "family": "Pink", "lightness": 68, "warm_cool_score": 0.7, "saturation": 0.85},
    {"name": "Soft Coral", "hex": "#F28C82", "family": "Pink", "lightness": 74, "warm_cool_score": 0.5, "saturation": 0.6},
    {"name": "Magenta", "hex": "#FF00FF", "family": "Purple", "lightness": 55, "warm_cool_score": -0.1, "saturation": 1.0},
    {"name": "Plum", "hex": "#8E4585", "family": "Purple", "lightness": 38, "warm_cool_score": 0.1, "saturation": 0.65},
    {"name": "Royal Purple", "hex": "#7851A9", "family": "Purple", "lightness": 42, "warm_cool_score": -0.1, "saturation": 0.75},
    {"name": "Lavender", "hex": "#E6E6FA", "family": "Purple", "lightness": 94, "warm_cool_score": -0.15, "saturation": 0.2},
    {"name": "Soft Lavender", "hex": "#C8A2C8", "family": "Purple", "lightness": 78, "warm_cool_score": -0.05, "saturation": 0.3},

    # YELLOWS / ORANGES / NEUTRALS
    {"name": "Mustard Yellow", "hex": "#FFDB58", "family": "Yellow", "lightness": 75, "warm_cool_score": 0.8, "saturation": 0.75},
    {"name": "Amber", "hex": "#FFBF00", "family": "Yellow", "lightness": 72, "warm_cool_score": 0.85, "saturation": 0.95},
    {"name": "Saffron", "hex": "#F4C430", "family": "Yellow", "lightness": 74, "warm_cool_score": 0.8, "saturation": 0.85},
    {"name": "Pastel Yellow", "hex": "#FFFFE0", "family": "Yellow", "lightness": 98, "warm_cool_score": 0.4, "saturation": 0.15},
    {"name": "Terracotta", "hex": "#E2725B", "family": "Orange", "lightness": 62, "warm_cool_score": 0.8, "saturation": 0.65},
    {"name": "Burnt Orange", "hex": "#CC5500", "family": "Orange", "lightness": 42, "warm_cool_score": 0.95, "saturation": 0.95},
    {"name": "Rust", "hex": "#B7410E", "family": "Orange", "lightness": 38, "warm_cool_score": 0.95, "saturation": 0.9},
    {"name": "Cream / Ivory", "hex": "#FFFDD0", "family": "Neutral", "lightness": 99, "warm_cool_score": 0.15, "saturation": 0.05},
    {"name": "Off-White", "hex": "#FAF9F6", "family": "Neutral", "lightness": 99, "warm_cool_score": 0.0, "saturation": 0.02},
    {"name": "Pure White", "hex": "#FFFFFF", "family": "Neutral", "lightness": 100, "warm_cool_score": 0.0, "saturation": 0.0},
    {"name": "Jet Black", "hex": "#0A0A0A", "family": "Neutral", "lightness": 2, "warm_cool_score": 0.0, "saturation": 0.0},
    {"name": "Charcoal Grey", "hex": "#36454F", "family": "Neutral", "lightness": 28, "warm_cool_score": -0.1, "saturation": 0.08},
    {"name": "Ash Grey", "hex": "#B2BEB5", "family": "Neutral", "lightness": 76, "warm_cool_score": -0.05, "saturation": 0.06},
    {"name": "Stone / Khaki", "hex": "#C3B091", "family": "Neutral", "lightness": 70, "warm_cool_score": 0.25, "saturation": 0.25},
    {"name": "Camel Tan", "hex": "#C19A6B", "family": "Neutral", "lightness": 60, "warm_cool_score": 0.45, "saturation": 0.45},
    {"name": "Ochre Tan", "hex": "#CC7722", "family": "Brown", "lightness": 50, "warm_cool_score": 0.85, "saturation": 0.7},
    {"name": "Mahogany Brown", "hex": "#C04000", "family": "Brown", "lightness": 38, "warm_cool_score": 0.8, "saturation": 0.75},
    {"name": "Rich Chocolate", "hex": "#7B3F00", "family": "Brown", "lightness": 30, "warm_cool_score": 0.5, "saturation": 0.85},
    {"name": "Taupe", "hex": "#483C32", "family": "Brown", "lightness": 22, "warm_cool_score": 0.1, "saturation": 0.25},
    {"name": "Beige", "hex": "#F5F5DC", "family": "Neutral", "lightness": 95, "warm_cool_score": 0.2, "saturation": 0.1},
    {"name": "Pearl White", "hex": "#EAE6E1", "family": "Neutral", "lightness": 93, "warm_cool_score": 0.1, "saturation": 0.05},
    {"name": "Copper", "hex": "#B87333", "family": "Brown", "lightness": 48, "warm_cool_score": 0.65, "saturation": 0.7},
    {"name": "Bronze", "hex": "#CD7F32", "family": "Brown", "lightness": 52, "warm_cool_score": 0.7, "saturation": 0.7},
]


def _hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _contrast_level(L_skin, L_fabric):
    """0-1 absolute contrast between skin L* and fabric L*."""
    return min(1.0, abs(L_skin - L_fabric) / 80.0)


def _score_color_for_skin(color_entry, tone_label, undertone_label, undertone_strength, med_L, skin_lab_triplet):
    """
    Dynamic scoring per clothing color. Returns (score 0-100, reason_str, is_avoid).
    """
    family = color_entry['family']
    name = color_entry['name']
    Lc = color_entry['lightness']
    wc = color_entry['warm_cool_score']
    sat = color_entry['saturation']
    rgb = np.array(_hex_to_rgb(color_entry['hex']), dtype=np.float32).reshape((1, 3))
    clab = rgb_to_lab_batch(rgb)[0]

    # 1. Contrast effect
    contrast = _contrast_level(med_L, Lc)

    # 2. Undertone harmony
    if undertone_label == 'Warm':
        undertone_harmony = 0.5 + 0.5 * max(0.0, min(1.0, (wc + 1.0) / 2.0)) * max(0.2, abs(undertone_strength))
    elif undertone_label == 'Cool':
        undertone_harmony = 0.5 + 0.5 * max(0.0, min(1.0, (1.0 - wc) / 2.0)) * max(0.2, abs(undertone_strength))
    else:
        undertone_harmony = 0.65 + 0.2 * (1.0 - abs(wc))

    # 3. Tone-specific palette tuning (favors certain L-ranges depending on depth)
    if tone_label == 'Very Light':
        if Lc >= 95 and sat > 0.6:
            tone_tune = -0.3
        elif Lc <= 15:
            tone_tune = -0.25
        elif 50 <= Lc <= 85:
            tone_tune = 0.25
        else:
            tone_tune = 0.0
        avoid_if = (Lc >= 97 and sat < 0.15) or (abs(wc) > 0.7 and undertone_label == 'Cool')
    elif tone_label == 'Light':
        if Lc >= 96 and sat < 0.1:
            tone_tune = -0.15
        elif 40 <= Lc <= 82:
            tone_tune = 0.25
        else:
            tone_tune = 0.0
        avoid_if = (abs(wc - 0.9) < 0.02 and undertone_label == 'Cool') or (Lc >= 97)
    elif tone_label == 'Medium':
        if 30 <= Lc <= 75:
            tone_tune = 0.25
        else:
            tone_tune = 0.0
        avoid_if = (family == 'Neutral' and Lc >= 98)
    elif tone_label == 'Tan':
        if Lc <= 20:
            tone_tune = -0.05
        elif 25 <= Lc <= 80:
            tone_tune = 0.22
        else:
            tone_tune = 0.0
        avoid_if = (family == 'Yellow' and Lc >= 95)
    else:  # Deep
        if Lc <= 15 and sat < 0.1:
            tone_tune = -0.1
        elif 18 <= Lc <= 78:
            tone_tune = 0.28
        else:
            tone_tune = 0.0
        avoid_if = (family == 'Yellow' and Lc >= 92) or (family == 'Neutral' and Lc >= 95 and sat < 0.08)

    # 4. Overall composite score
    w_tone = 0.30
    w_undertone = 0.30
    w_contrast = 0.25
    w_tune = 0.15

    score = (
        w_tone * (1.0 - abs(tone_label_to_center_L(tone_label) - Lc) / 100.0)
        + w_undertone * undertone_harmony
        + w_contrast * (0.4 + 0.6 * contrast)
        + w_tune * (0.5 + 0.5 * (1.0 + tone_tune))
    )

    score = max(0.0, min(1.0, score))
    score_int = int(round(score * 100))

    # 5. Generate a short, specific reason
    reasons = []
    if undertone_label == 'Warm' and wc > 0.2:
        reasons.append(f"Enhances your warm undertone")
    elif undertone_label == 'Cool' and wc < -0.2:
        reasons.append(f"Complements your cool undertone")
    elif undertone_label == 'Neutral':
        if wc <= 0.2:
            reasons.append(f"Flattering for your balanced undertone")
        else:
            reasons.append(f"Adds depth without clashing on neutral skin")

    if contrast >= 0.4:
        reasons.append(f"Creates strong, sculpting contrast")
    elif contrast >= 0.2:
        reasons.append(f"Creates balanced medium contrast")
    elif contrast < 0.1 and family == 'Neutral':
        reasons.append(f"Very low contrast — may appear flat")
        avoid_if = True

    if family == 'Neutral' and tone_label in ('Very Light', 'Light') and Lc >= 96:
        reasons.append(f"Can wash out lighter complexions")
        avoid_if = True

    if wc * undertone_strength < -0.18 and abs(undertone_strength) > 0.3:
        if undertone_label == 'Warm' and wc < -0.1:
            reasons.append(f"Cool hue may dull warm golden undertones")
            avoid_if = True
        elif undertone_label == 'Cool' and wc > 0.1:
            reasons.append(f"Warm hue may sallow cool rosy undertones")
            avoid_if = True

    # Family-specific nuanced reasons
    if not reasons:
        reasons.append(f"Harmonizes well with a {tone_label.lower()} complexion")

    reason = reasons[0] + '.'

    return score_int, reason, avoid_if


def tone_label_to_center_L(tone_label):
    return {
        'Very Light': 85,
        'Light': 72,
        'Medium': 60,
        'Tan': 46,
        'Deep': 32,
    }.get(tone_label, 60)


def _generate_color_recommendations(tone_label, undertone_label, undertone_strength, med_L, skin_rgb_triplet):
    """Generate exactly 10 recommended + 5 carefully-use colors (dynamic, based on analysis)."""
    scored = []
    for c in _CLOTHING_COLOR_LIBRARY:
        score, reason, avoid = _score_color_for_skin(
            c, tone_label, undertone_label, undertone_strength, med_L, skin_rgb_triplet
        )
        scored.append((score, reason, avoid, c))

    scored.sort(key=lambda x: (-x[0], x[3]['name']))

    chosen_names = set()
    recommended = []
    # Prioritize diverse families, not all the same color
    family_count = {}
    for score, reason, avoid, c in scored:
        if avoid:
            continue
        fam = c['family']
        if family_count.get(fam, 0) >= 2:
            continue
        if c['name'] in chosen_names:
            continue
        chosen_names.add(c['name'])
        family_count[fam] = family_count.get(fam, 0) + 1
        recommended.append({
            "name": c['name'],
            "hex": c['hex'],
            "reason": reason,
        })
        if len(recommended) == 10:
            break

    # If 10 weren't found, loosen family constraints
    if len(recommended) < 10:
        for score, reason, avoid, c in scored:
            if avoid:
                continue
            if c['name'] in chosen_names:
                continue
            chosen_names.add(c['name'])
            recommended.append({
                "name": c['name'],
                "hex": c['hex'],
                "reason": reason,
            })
            if len(recommended) == 10:
                break

    # --- 5 to use carefully: prefer low-scoring colors OR explicitly marked avoid ---
    care_pool = [
        (s, r, True, c) if avo else (s - 15, r, False, c)
        for s, r, avo, c in scored
    ]
    care_pool.sort(key=lambda x: x[0])

    careful = []
    care_family_count = {}
    for score, reason, avoid, c in care_pool:
        fam = c['family']
        if care_family_count.get(fam, 0) >= 1:
            continue
        if c['name'] in chosen_names:
            continue
        chosen_names.add(c['name'])
        care_family_count[fam] = care_family_count.get(fam, 0) + 1

        # Enrich the "careful" reason if it's too generic
        care_reason = reason
        if not ('low contrast' in care_reason.lower() or 'wash' in care_reason.lower() or
                'clash' in care_reason.lower() or 'dull' in care_reason.lower() or
                'sallow' in care_reason.lower() or 'flat' in care_reason.lower()):
            care_reason_specific = ""
            if _contrast_level(med_L, c['lightness']) < 0.12:
                care_reason_specific = "May create very low contrast with your skin."
            elif undertone_label == 'Warm' and c['warm_cool_score'] < -0.2:
                care_reason_specific = "Cool shade may clash with your warm undertone unless styled with layers."
            elif undertone_label == 'Cool' and c['warm_cool_score'] > 0.25:
                care_reason_specific = "Strongly warm shade may sallow your cool undertone; use only with complementary layering."
            else:
                care_reason_specific = "May be harder to style alongside your detected skin characteristics."
            care_reason = care_reason_specific

        careful.append({
            "name": c['name'],
            "hex": c['hex'],
            "reason": care_reason,
        })
        if len(careful) == 5:
            break

    return recommended[:10], careful[:5]


def _detect_skin_pixels(img_bgr):
    """
    Multi-pass skin detection using:
      1. Robust HSV band (human-only ranges)
      2. YCrCb skin band (standard in skin-detection literature)
      3. CIELAB ab-region (a* 123-170, b* 120-190)
      4. Intersection + morphological cleanup
    Returns (skin_mask_uint8, face_region_or_none)
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    lab_img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    h, w = img_bgr.shape[:2]

    # 1. HSV skin band (conservative to avoid red clothes, excludes saturated vivid reds)
    hsv_low1 = np.array([0, 20, 60], dtype=np.uint8)
    hsv_high1 = np.array([17, 130, 255], dtype=np.uint8)
    hsv_low2 = np.array([165, 20, 60], dtype=np.uint8)
    hsv_high2 = np.array([180, 130, 255], dtype=np.uint8)
    m1 = cv2.bitwise_or(cv2.inRange(hsv, hsv_low1, hsv_high1), cv2.inRange(hsv, hsv_low2, hsv_high2))

    # 2. YCrCb band (Kovac algorithm)
    ycrcb_low = np.array([0, 133, 77], dtype=np.uint8)
    ycrcb_high = np.array([255, 173, 127], dtype=np.uint8)
    m2 = cv2.inRange(ycrcb, ycrcb_low, ycrcb_high)

    # 3. CIELAB skin ab band
    lab_low = np.array([20, 122, 118], dtype=np.uint8)
    lab_high = np.array([240, 173, 195], dtype=np.uint8)
    m3 = cv2.inRange(lab_img, lab_low, lab_high)

    # Combine: union of HSV∩YCrCb plus (LAB alone is a weaker second opinion)
    combined = cv2.bitwise_and(m1, m2)
    combined = cv2.bitwise_or(combined, cv2.bitwise_and(cv2.bitwise_and(m1, m3), m2))
    combined = cv2.bitwise_or(combined, cv2.bitwise_and(m3, m2))

    # Central-face bias: assume face is somewhere in image center (especially uploaded selfies)
    # Give more weight to regions inside 40%-80% height and 20%-80% width band
    center_mask = np.zeros_like(combined)
    y0, y1 = int(h * 0.15), int(h * 0.90)
    x0, x1 = int(w * 0.12), int(w * 0.88)
    center_mask[y0:y1, x0:x1] = 255

    combined = cv2.bitwise_and(combined, center_mask)

    # Morphological cleanup
    k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    cleaned = cv2.morphologyEx(combined, cv2.MORPH_OPEN, k3, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, k3, iterations=2)

    # Keep only the largest connected component (it's almost certainly the face)
    num, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
    best_area = 0
    best_mask = np.zeros_like(cleaned)
    if num >= 2:
        for i in range(1, num):
            area = stats[i, cv2.CC_STAT_AREA]
            if area > best_area:
                best_area = area
                idx = i
        if best_area > max(80, int(h * w * 0.005)):
            best_mask[labels == idx] = 255
    else:
        best_mask = cleaned

    return best_mask, None

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
        if 'image' not in request.files:
            return jsonify({"error": "No image"}), 400
        file = request.files['image']
        nparr = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({"error": "Invalid image"}), 400

        original_h, original_w = img.shape[:2]

        # Resize to a consistent working size (speed + stability)
        work_w = 320
        ratio = work_w / max(1, original_w)
        work_h = max(int(original_h * ratio), 200)
        work_img = cv2.resize(img, (work_w, work_h), interpolation=cv2.INTER_AREA)

        # --- STEP 1: Detect skin pixels with multi-band detector ---
        skin_mask, _ = _detect_skin_pixels(work_img)

        total_px = work_w * work_h
        n_skin_px = int(np.count_nonzero(skin_mask))
        skin_ratio = n_skin_px / max(1, total_px)

        # If the mask didn't find anything (bad lighting, weird image),
        # try a much more lenient fallback: only remove pure white/black bg + crop center
        if n_skin_px < max(120, int(total_px * 0.02)):
            hsv = cv2.cvtColor(work_img, cv2.COLOR_BGR2HSV)
            lab2 = cv2.cvtColor(work_img, cv2.COLOR_BGR2LAB)
            white_bg = cv2.inRange(hsv, np.array([0, 0, 225]), np.array([180, 45, 255]))
            black_bg = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 22]))
            bg_only = cv2.bitwise_or(white_bg, black_bg)
            light_bg = cv2.inRange(lab2, np.array([205, 118, 118]), np.array([255, 137, 137]))
            bg = cv2.bitwise_or(bg_only, light_bg)
            center_mask = np.zeros_like(bg)
            cy0, cy1 = int(work_h * 0.20), int(work_h * 0.85)
            cx0, cx1 = int(work_w * 0.20), int(work_w * 0.80)
            center_mask[cy0:cy1, cx0:cx1] = 255
            skin_mask = cv2.bitwise_and(cv2.bitwise_not(bg), center_mask)
            n_skin_px = int(np.count_nonzero(skin_mask))
            skin_ratio = n_skin_px / max(1, total_px)

        if n_skin_px < 30:
            return jsonify({
                "skin_tone": "Medium",
                "skin_hex": "#B28F69",
                "undertone": "Neutral",
                "confidence": 25,
                "warnings": [
                    "Could not detect a clear face region.",
                    "Please upload a clear, front-facing photo in natural or neutral lighting for more accurate skin-tone analysis."
                ],
                "recommended_colors": [],
                "colors_to_use_carefully": [],
                "analysis_not_available": True,
            }), 200

        work_rgb = cv2.cvtColor(work_img, cv2.COLOR_BGR2RGB)
        skin_pixels = work_rgb[skin_mask > 0]

        # --- STEP 2: Robust stats: remove 20-80% L* percentile, weighted median ---
        (
            representative_rgb,
            n_central,
            med_L,
            std_L,
            central_lab,
        ) = _compute_robust_skin_stats(skin_pixels)

        if representative_rgb is None:
            return jsonify({
                "skin_tone": "Medium",
                "skin_hex": "#B28F69",
                "undertone": "Neutral",
                "confidence": 25,
                "warnings": [
                    "Please upload a clear, front-facing photo in natural or neutral lighting for more accurate skin-tone analysis."
                ],
                "recommended_colors": [],
                "colors_to_use_carefully": [],
                "analysis_not_available": True,
            }), 200

        L_range = float(np.max(central_lab[:, 0]) - np.min(central_lab[:, 0])) if len(central_lab) else 0.0
        A_range = float(np.max(central_lab[:, 1]) - np.min(central_lab[:, 1])) if len(central_lab) else 0.0
        B_range = float(np.max(central_lab[:, 2]) - np.min(central_lab[:, 2])) if len(central_lab) else 0.0

        # --- STEP 3: Classify skin tone + undertone ---
        tone_label = _classify_tone(med_L)
        undertone_label, undertone_conf, undertone_strength = _undertone_from_rgb_and_central_lab(
            central_lab, med_L, tone_label
        )

        # --- STEP 4: Image quality + final confidence ---
        quality_score, quality_warnings = _assess_quality(
            (work_h, work_w),
            n_central,
            std_L,
            skin_ratio,
            L_range,
            A_range,
            B_range,
        )

        # Confidence blend: quality * undertone_confidence consistency
        if quality_score < 40:
            final_conf = max(28, quality_score)
        else:
            final_conf = int(round(
                0.55 * quality_score
                + 0.25 * undertone_conf
                + 0.20 * min(98, 40 + n_central / 20.0)
            ))
        final_conf = max(25, min(98, final_conf))

        if final_conf < 50 and not quality_warnings:
            quality_warnings.append(
                "Please upload a clear, front-facing photo in natural or neutral lighting for more accurate skin-tone analysis."
            )

        # Representative skin hex
        r, g, b = [int(round(x)) for x in representative_rgb]
        skin_hex = '#{:02x}{:02x}{:02x}'.format(r, g, b)

        # --- STEP 5: Dynamic color recommendations (10 good, 5 careful) ---
        skin_lab_trip = rgb_to_lab_batch(
            np.array([[r, g, b]], dtype=np.float32)
        )[0]

        try:
            rec10, care5 = _generate_color_recommendations(
                tone_label,
                undertone_label,
                undertone_strength,
                med_L,
                (r, g, b),
            )
        except Exception as ce:
            print(f"[skintone] color rec exception: {ce}")
            rec10, care5 = [], []

        # Pad to exactly 10/5 if needed (safety)
        _REC_FALLBACKS = [
            {"name": "Navy Blue", "hex": "#0F1C40", "reason": "Universally flattering neutral that creates clean contrast."},
            {"name": "Emerald Green", "hex": "#50C878", "reason": "Rich jewel tone that complements most complexions beautifully."},
            {"name": "Burgundy", "hex": "#800020", "reason": "Deep red-wine hue that adds elegant warmth."},
            {"name": "Teal", "hex": "#008080", "reason": "Blue-green balance that is chic and versatile."},
        ]
        _CARE_FALLBACKS = [
            {"name": "Ash Grey", "hex": "#B2BEB5", "reason": "Very low contrast shade; pair with brighter layers to avoid flatness."},
            {"name": "Beige", "hex": "#F5F5DC", "reason": "Very light neutral; pair with a statement layer to keep depth."},
        ]
        while len(rec10) < 10 and _REC_FALLBACKS:
            fb = _REC_FALLBACKS.pop(0)
            if fb['name'] not in {c['name'] for c in rec10}:
                rec10.append(fb)
        while len(care5) < 5 and _CARE_FALLBACKS:
            fb = _CARE_FALLBACKS.pop(0)
            if fb['name'] not in {c['name'] for c in care5}:
                care5.append(fb)

        # Backwards-compatible legacy skin_tone string for older parts of the app:
        # map our 5 labels to the strings previously used ("Fair", "Light", "Medium", "Olive", "Dark")
        legacy_map = {
            'Very Light': 'Fair',
            'Light': 'Light',
            'Medium': 'Medium',
            'Tan': 'Medium/Wheatish',
            'Deep': 'Dark',
        }
        legacy_skin_tone = legacy_map.get(tone_label, 'Medium')

        response_payload = {
            # Backwards-compatible fields (existing UI + recommendations API rely on these):
            "skin_tone": legacy_skin_tone,
            "skin_hex": skin_hex,
            # New, detailed accurate fields:
            "detailed_skin_tone": tone_label,
            "undertone": undertone_label,
            "undertone_strength": round(undertone_strength, 3),
            "confidence": final_conf,
            "skin_lightness_L": round(float(med_L), 2),
            "skin_ratio": round(skin_ratio, 3),
            "central_pixels": int(n_central),
            "warnings": quality_warnings,
            "recommended_colors": rec10[:10],
            "colors_to_use_carefully": care5[:5],
        }
        return jsonify(response_payload), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@accessory_bp.route('/color-combinations', methods=['POST'])
@accessory_bp.route('/color-match', methods=['POST'])
def get_color_combinations():
    """Clothing-color pairing from HSL / 24-hue theory. Independent of skin tone."""
    try:
        data = request.json or {}
        base_color = data.get('color', '#001F3F')
        full_result = build_color_combinations(base_color)
        color_theory = full_result.get('color_theory', {})
        filtered_result = {
            'complementary': color_theory.get('complementary', []),
            'analogous': color_theory.get('analogous', []),
            'triadic': color_theory.get('triadic', []),
            'neutral': full_result.get('neutral_matches', []),
            'notes': full_result.get('theory_notes', {})
        }
        return jsonify(filtered_result)
    except Exception as e:
        print(f"Color combinations error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'complementary': ['Camel', 'Cream', 'White'],
            'analogous': ['Royal Blue', 'Teal', 'Midnight Blue'],
            'triadic': ['Rust', 'Mustard'],
            'neutral': ['Ivory', 'Beige', 'Grey']
        }), 200

