"""
Fashion color theory + practical outfit pairing.

Pipeline: HEX/name → HSL → hue relationships on a 24-hue wheel
→ fashion-adjusted shades (S/L) → named clothing colors
→ practical combination groups.

Independent of skin tone / complexion.
"""
from __future__ import annotations

import colorsys
import re
from typing import Dict, List, Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Wearable wardrobe palette (clothing colors, not neon primaries)
# ---------------------------------------------------------------------------
FASHION_SWATCHES: List[Dict] = [
    # Neutrals
    {"name": "White", "hex": "#FFFFFF", "neutral": True},
    {"name": "Off-White", "hex": "#FAF7F2", "neutral": True},
    {"name": "Ivory", "hex": "#FFFFF0", "neutral": True},
    {"name": "Cream", "hex": "#F5F0E1", "neutral": True},
    {"name": "Champagne", "hex": "#F7E7CE", "neutral": True},
    {"name": "Beige", "hex": "#D8C3A5", "neutral": True},
    {"name": "Sand", "hex": "#C2B280", "neutral": True},
    {"name": "Taupe", "hex": "#8B7E74", "neutral": True},
    {"name": "Camel", "hex": "#C19A6B", "neutral": True},
    {"name": "Tan", "hex": "#C4A574", "neutral": True},
    {"name": "Khaki", "hex": "#C3B091", "neutral": True},
    {"name": "Brown", "hex": "#5C3A21", "neutral": True},
    {"name": "Chocolate Brown", "hex": "#4A2C1E", "neutral": True},
    {"name": "Cognac", "hex": "#9E5B32", "neutral": True},
    {"name": "Grey", "hex": "#8A8D91", "neutral": True},
    {"name": "Light Grey", "hex": "#C8CBCE", "neutral": True},
    {"name": "Charcoal", "hex": "#36454F", "neutral": True},
    {"name": "Black", "hex": "#111111", "neutral": True},
    {"name": "Navy Blue", "hex": "#001F3F", "neutral": True},
    {"name": "Silver", "hex": "#C0C0C0", "neutral": True},
    # Blues
    {"name": "Midnight Blue", "hex": "#191970", "neutral": False},
    {"name": "Royal Blue", "hex": "#4169E1", "neutral": False},
    {"name": "Denim Blue", "hex": "#466EA0", "neutral": False},
    {"name": "Light Blue", "hex": "#ADD8E6", "neutral": False},
    {"name": "Sky Blue", "hex": "#87CEEB", "neutral": False},
    {"name": "Powder Blue", "hex": "#B0E0E6", "neutral": False},
    {"name": "Teal", "hex": "#008080", "neutral": False},
    {"name": "Deep Teal", "hex": "#0F5C5C", "neutral": False},
    {"name": "Turquoise", "hex": "#40C8D0", "neutral": False},
    # Greens
    {"name": "Emerald Green", "hex": "#197D4B", "neutral": False},
    {"name": "Forest Green", "hex": "#144123", "neutral": False},
    {"name": "Olive Green", "hex": "#5F6E2D", "neutral": False},
    {"name": "Sage Green", "hex": "#91AF8C", "neutral": False},
    {"name": "Mint", "hex": "#98D7C2", "neutral": False},
    # Reds / pinks
    {"name": "Burgundy", "hex": "#800020", "neutral": False},
    {"name": "Wine", "hex": "#69122A", "neutral": False},
    {"name": "Maroon", "hex": "#550F19", "neutral": False},
    {"name": "Ruby Red", "hex": "#C81928", "neutral": False},
    {"name": "Brick Red", "hex": "#CB4154", "neutral": False},
    {"name": "Blush Pink", "hex": "#F5B9C3", "neutral": False},
    {"name": "Dusty Rose", "hex": "#C08081", "neutral": False},
    {"name": "Hot Pink", "hex": "#DC2882", "neutral": False},
    {"name": "Coral", "hex": "#FF7F50", "neutral": False},
    # Yellows / oranges
    {"name": "Mustard", "hex": "#E1A519", "neutral": False},
    {"name": "Gold", "hex": "#D4AF37", "neutral": False},
    {"name": "Soft Yellow", "hex": "#FAE896", "neutral": False},
    {"name": "Orange", "hex": "#E07020", "neutral": False},
    {"name": "Rust", "hex": "#B7410E", "neutral": False},
    {"name": "Terracotta", "hex": "#E2725B", "neutral": False},
    {"name": "Burnt Orange", "hex": "#CC5500", "neutral": False},
    # Purples
    {"name": "Lavender", "hex": "#B49BD7", "neutral": False},
    {"name": "Plum", "hex": "#8E4585", "neutral": False},
    {"name": "Deep Purple", "hex": "#5A195F", "neutral": False},
    {"name": "Royal Purple", "hex": "#73289B", "neutral": False},
]


# Practical fashion pairings used as ranking hints after hue math.
# Not an exclusive list — theory-generated candidates still compete.
FASHION_PAIRINGS = {
    "navy": {
        "best": ["White", "Cream", "Beige", "Light Blue", "Grey", "Burgundy", "Camel"],
        "accent": ["Mustard", "Gold", "Coral"],
        "contrast": ["White", "Mustard", "Burgundy"],
    },
    "burgundy": {
        "best": ["Cream", "Beige", "Black", "Navy Blue", "Grey", "Blush Pink", "Forest Green"],
        "accent": ["Gold", "Mustard", "Blush Pink"],
        "contrast": ["Cream", "Forest Green", "Navy Blue"],
    },
    "olive": {
        "best": ["Cream", "Beige", "White", "Brown", "Camel", "Rust", "Burgundy", "Black"],
        "accent": ["Rust", "Mustard", "Burgundy"],
        "contrast": ["Cream", "Rust", "Burgundy"],
    },
    "mustard": {
        "best": ["Navy Blue", "Black", "Cream", "Brown", "Burgundy", "Olive Green", "Denim Blue"],
        "accent": ["Burgundy", "Navy Blue"],
        "contrast": ["Navy Blue", "Black", "Deep Teal"],
    },
    "emerald": {
        "best": ["Cream", "White", "Black", "Beige", "Navy Blue", "Burgundy"],
        "accent": ["Gold", "Mustard", "Coral"],
        "contrast": ["Cream", "Burgundy", "Gold"],
    },
    "orange": {
        "best": ["Navy Blue", "Cream", "White", "Brown", "Beige", "Olive Green"],
        "accent": ["Teal", "Gold", "Navy Blue"],
        "contrast": ["Navy Blue", "Deep Teal", "White"],
    },
    "black": {
        "best": ["White", "Cream", "Grey", "Burgundy", "Camel", "Emerald Green"],
        "accent": ["Gold", "Mustard", "Hot Pink"],
        "contrast": ["White", "Mustard", "Emerald Green"],
    },
    "white": {
        "best": ["Navy Blue", "Black", "Beige", "Grey", "Burgundy", "Denim Blue"],
        "accent": ["Gold", "Coral", "Emerald Green"],
        "contrast": ["Black", "Navy Blue", "Burgundy"],
    },
    "red": {
        "best": ["Navy Blue", "Black", "Cream", "White", "Grey", "Denim Blue"],
        "accent": ["Gold", "Camel"],
        "contrast": ["White", "Navy Blue", "Deep Teal"],
    },
    "teal": {
        "best": ["Cream", "White", "Navy Blue", "Coral", "Camel", "Grey"],
        "accent": ["Coral", "Gold", "Rust"],
        "contrast": ["Coral", "Cream", "Rust"],
    },
}

HUE_NAMES_24 = [
    (0, "Red"), (15, "Red-Orange"), (30, "Orange"), (45, "Yellow-Orange"),
    (60, "Yellow"), (75, "Yellow-Green"), (90, "Green"), (105, "Green"),
    (120, "Green"), (135, "Blue-Green"), (150, "Blue-Green"), (165, "Teal"),
    (180, "Cyan"), (195, "Teal"), (210, "Blue"), (225, "Blue"),
    (240, "Blue-Violet"), (255, "Violet"), (270, "Violet"), (285, "Violet"),
    (300, "Magenta"), (315, "Rose"), (330, "Rose"), (345, "Red"),
]


def _clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def normalize_hex(value: str) -> Optional[str]:
    if not value:
        return None
    text = str(value).strip()
    if not text.startswith("#"):
        return None
    hex_part = text[1:]
    if len(hex_part) == 3:
        hex_part = "".join(ch * 2 for ch in hex_part)
    if not re.fullmatch(r"[0-9A-Fa-f]{6}", hex_part):
        return None
    return f"#{hex_part.upper()}"


def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
    h = normalize_hex(hex_code) or "#808080"
    return int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{int(_clamp(r, 0, 255)):02X}{int(_clamp(g, 0, 255)):02X}{int(_clamp(b, 0, 255)):02X}"


def hex_to_hsl(hex_code: str) -> Tuple[float, float, float]:
    r, g, b = hex_to_rgb(hex_code)
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    return (h * 360.0) % 360.0, s, l


def hsl_to_hex(h: float, s: float, l: float) -> str:
    r, g, b = colorsys.hls_to_rgb((h % 360.0) / 360.0, _clamp(l), _clamp(s))
    return rgb_to_hex(round(r * 255), round(g * 255), round(b * 255))


def hue_distance(a: float, b: float) -> float:
    d = abs(a - b) % 360.0
    return min(d, 360.0 - d)


def hue_family_name(h: float) -> str:
    best = HUE_NAMES_24[0][1]
    best_d = 999
    for deg, name in HUE_NAMES_24:
        d = hue_distance(h, deg)
        if d < best_d:
            best_d = d
            best = name
    return best


def temperature_label(h: float, s: float, l: float, is_neutral: bool) -> str:
    if is_neutral and s < 0.12:
        return "neutral"
    if s < 0.08 or l < 0.06 or l > 0.94:
        return "neutral"
    if 345 <= h or h < 55:
        return "warm"
    if 55 <= h < 90:
        return "warm" if s > 0.25 and l > 0.28 else "neutral-warm"
    if 90 <= h < 150:
        return "cool" if h > 120 else "neutral-cool"
    if 150 <= h < 270:
        return "cool"
    if 270 <= h < 310:
        return "cool" if l < 0.55 else "neutral-cool"
    return "warm"


def is_fashion_neutral(h: float, s: float, l: float, name: str = "") -> bool:
    n = name.lower()
    if any(k in n for k in (
        "white", "ivory", "cream", "beige", "taupe", "grey", "gray",
        "charcoal", "black", "brown", "camel", "navy", "tan", "off-white",
        "khaki", "sand", "cognac",
    )):
        return True
    if s < 0.12:
        return True
    if l > 0.92 and s < 0.22:
        return True
    if l < 0.07:
        return True
    if 18 <= h <= 48 and s < 0.48 and 0.22 <= l <= 0.78:
        return True
    if 200 <= h <= 250 and s <= 0.75 and l <= 0.22:
        return True
    return False


def saturation_label(s: float) -> str:
    if s < 0.12:
        return "neutral"
    if s < 0.35:
        return "muted"
    if s < 0.62:
        return "moderate"
    return "high"


def lightness_label(l: float) -> str:
    if l < 0.18:
        return "deep"
    if l < 0.38:
        return "dark"
    if l < 0.62:
        return "medium"
    if l < 0.82:
        return "light"
    return "pale"


def _swatch_distance(h: float, s: float, l: float, other: Dict) -> float:
    oh, os, ol = other["hsl"]
    dh = hue_distance(h, oh) / 180.0
    if s < 0.12 and os < 0.18:
        return abs(s - os) * 2.0 + abs(l - ol) * 2.4
    return dh * 3.2 + abs(s - os) * 1.05 + abs(l - ol) * 1.2


def _prepare_palette() -> None:
    for item in FASHION_SWATCHES:
        item["hsl"] = hex_to_hsl(item["hex"])


_prepare_palette()

_NAME_INDEX = {item["name"].lower(): item for item in FASHION_SWATCHES}
for alias, target in {
    "navy": "navy blue",
    "emerald": "emerald green",
    "olive": "olive green",
    "forest": "forest green",
    "wine": "wine",
    "grey": "grey",
    "gray": "grey",
    "off white": "off-white",
    "blush": "blush pink",
}.items():
    if target in _NAME_INDEX:
        _NAME_INDEX[alias] = _NAME_INDEX[target]


def generated_display_name(h: float, s: float, l: float) -> str:
    family = hue_family_name(h)
    sat = saturation_label(s)
    lit = lightness_label(l)
    if sat == "neutral":
        return f"{lit.title()} Grey" if 0.12 < l < 0.88 else ("Black" if l < 0.2 else "White")
    prefix = {
        "deep": "Deep", "dark": "Deep", "medium": "Muted" if sat == "muted" else "",
        "light": "Light", "pale": "Pale",
    }.get(lit, "")
    if sat == "muted" and not prefix:
        prefix = "Dusty"
    elif sat == "high" and lit in ("medium", "light"):
        prefix = prefix or "Bright"
    return f"{prefix} {family}".strip()


def closest_named(h: float, s: float, l: float, generated_hex: Optional[str] = None,
                  max_hue: float = 28.0) -> Dict:
    """Snap to a wardrobe name only when hue (and S/L) actually match."""
    chromatic = s >= 0.14
    best = None
    best_d = 1e9
    for item in FASHION_SWATCHES:
        oh, os, ol = item["hsl"]
        if chromatic and hue_distance(h, oh) > max_hue:
            continue
        if chromatic and item.get("neutral") and os < 0.22 and "navy" not in item["name"].lower():
            # Don't rename an orange/teal into brown/grey just because L is close.
            if hue_distance(h, oh) > 16:
                continue
        d = _swatch_distance(h, s, l, item)
        if d < best_d:
            best_d = d
            best = item
    if best is None or best_d > 0.48:
        hex_code = generated_hex or hsl_to_hex(h, s, l)
        return {
            "name": generated_display_name(h, s, l),
            "hex": hex_code,
            "neutral": is_fashion_neutral(h, s, l),
        }
    return {
        "name": best["name"],
        "hex": best["hex"],
        "neutral": best.get("neutral", False),
    }


def resolve_input_color(raw: str) -> Tuple[str, str, Tuple[float, float, float]]:
    hex_code = normalize_hex(raw)
    if not hex_code:
        key = str(raw or "").strip().lower()
        item = _NAME_INDEX.get(key)
        if item:
            h, s, l = item["hsl"]
            return item["name"], item["hex"], (h, s, l)
        for name, sw in _NAME_INDEX.items():
            if key and (key in name or name in key):
                h, s, l = sw["hsl"]
                return sw["name"], sw["hex"], (h, s, l)
        hex_code = "#001F3F"
    h, s, l = hex_to_hsl(hex_code)
    named = closest_named(h, s, l, generated_hex=hex_code, max_hue=36.0)
    # Keep the user's exact hex; only borrow a wardrobe name when it is close.
    return named["name"], hex_code, (h, s, l)


def fashion_adjust(src_s: float, src_l: float, target_h: float, intent: str = "pair") -> Tuple[float, float]:
    """Turn a related hue into a wearable clothing shade (not a neon picker color)."""
    if intent == "accent":
        s = _clamp(max(0.40, min(0.70, src_s * 0.45 + 0.32)))
        l = 0.48 if src_l < 0.4 else 0.42
        l = _clamp(l, 0.34, 0.58)
    elif intent == "muted":
        s = _clamp(min(0.42, src_s * 0.42 + 0.18), 0.22, 0.48)
        if src_l < 0.22:
            l = _clamp(0.32 + src_l * 0.4, 0.28, 0.44)
        elif src_l > 0.78:
            l = 0.42
        else:
            l = _clamp(src_l * 0.78, 0.24, 0.50)
    elif intent == "contrast":
        s = _clamp(min(0.55, max(0.28, src_s * 0.58)), 0.24, 0.58)
        l = 0.78 if src_l < 0.45 else 0.22
    elif intent == "mono-tint":
        s = _clamp(src_s * 0.42, 0.12, 0.48)
        l = _clamp(max(src_l + 0.28, 0.55), 0.50, 0.86)
    elif intent == "mono-shade":
        if src_l < 0.22:
            s = _clamp(src_s * 0.7, 0.22, 0.62)
            l = _clamp(0.30, 0.24, 0.38)
        else:
            s = _clamp(src_s * 0.9 + 0.05, 0.18, 0.7)
            l = _clamp(src_l * 0.52, 0.12, 0.30)
    elif intent == "mono-tone":
        s = _clamp(src_s * 0.40, 0.12, 0.42)
        if src_l < 0.22:
            l = 0.42
        else:
            l = _clamp(src_l * 0.72 + 0.12, 0.30, 0.58)
    else:  # pair
        if src_s > 0.58:
            s = _clamp(0.30 + src_s * 0.10, 0.24, 0.46)
        else:
            s = _clamp(src_s * 0.75 + 0.10, 0.22, 0.52)
        if src_l < 0.22:
            l = _clamp(0.34, 0.28, 0.46)
        else:
            l = _clamp(src_l * 0.62 + 0.16, 0.22, 0.52)
    return s, l


def _color_obj(h: float, s: float, l: float, explanation: str, relationship: str,
               prefer_named: bool = True) -> Dict:
    hex_code = hsl_to_hex(h, s, l)
    named = closest_named(h, s, l, generated_hex=hex_code)
    return {
        "name": named["name"],
        "hex": named["hex"] if prefer_named else hex_code,
        "hsl": {"h": round(h, 1), "s": round(s, 3), "l": round(l, 3)},
        "explanation": explanation,
        "relationship": relationship,
        "is_neutral": named.get("neutral") or is_fashion_neutral(h, s, l, named["name"]),
        "temperature": temperature_label(h, s, l, named.get("neutral", False)),
    }


def _from_named(name: str, explanation: str, relationship: str) -> Optional[Dict]:
    item = _NAME_INDEX.get(name.lower())
    if not item:
        return None
    h, s, l = item["hsl"]
    return {
        "name": item["name"],
        "hex": item["hex"],
        "hsl": {"h": round(h, 1), "s": round(s, 3), "l": round(l, 3)},
        "explanation": explanation,
        "relationship": relationship,
        "is_neutral": item.get("neutral", False),
        "temperature": temperature_label(h, s, l, item.get("neutral", False)),
    }


def detect_family(name: str, h: float, s: float, l: float) -> Optional[str]:
    n = name.lower()
    if "navy" in n or (200 <= h <= 250 and l < 0.24 and s > 0.15):
        return "navy"
    if any(k in n for k in ("burgundy", "wine", "maroon")) or (
        (hue_distance(h, 350) < 25 or hue_distance(h, 0) < 18) and 0.18 < l < 0.35 and s > 0.25
    ):
        return "burgundy"
    if "olive" in n or (55 <= h <= 100 and 0.18 <= s <= 0.55 and 0.2 <= l <= 0.5):
        return "olive"
    if "mustard" in n or (38 <= h <= 58 and s > 0.4 and 0.35 <= l <= 0.65):
        return "mustard"
    if "emerald" in n or (140 <= h <= 170 and s > 0.35 and 0.18 <= l <= 0.5):
        return "emerald"
    if "teal" in n or (160 <= h <= 195 and s > 0.25 and 0.18 <= l <= 0.5):
        return "teal"
    if "orange" in n or "rust" in n or "terracotta" in n or (18 <= h <= 40 and s > 0.4 and l > 0.28):
        return "orange"
    if "black" in n or (l < 0.08 and s < 0.2):
        return "black"
    if "white" in n or "ivory" in n or (l > 0.92 and s < 0.2):
        return "white"
    if "red" in n or (hue_distance(h, 0) < 12 and s > 0.5 and 0.28 < l < 0.6):
        return "red"
    return None


def _dedupe(colors: List[Dict], selected_hex: str, selected_name: str) -> List[Dict]:
    seen = {selected_hex.upper(), selected_name.lower()}
    out = []
    for c in colors:
        if not c:
            continue
        key = c["hex"].upper()
        name_key = c["name"].lower()
        if key in seen or name_key in seen:
            continue
        seen.add(key)
        seen.add(name_key)
        out.append(c)
    return out


def _names(colors: List[Dict]) -> List[str]:
    return [c["name"] for c in colors]


def pick_related(
    target_h: float,
    src_h: float,
    src_s: float,
    src_l: float,
    intent: str,
    explanation: str,
    relationship: str,
    exclude: Set[str],
    count: int = 2,
    max_hue: float = 36.0,
) -> List[Dict]:
    """Pick wearable palette colors near a theoretical hue, then fall back to generated HSL."""
    ts, tl = fashion_adjust(src_s, src_l, target_h, intent)
    scored: List[Tuple[float, Dict]] = []
    for item in FASHION_SWATCHES:
        name_l = item["name"].lower()
        if name_l in exclude:
            continue
        oh, os, ol = item["hsl"]
        dh = hue_distance(target_h, oh)
        if dh > max_hue:
            continue
        # Analogous / split: skip colors that are basically the selected hue.
        if hue_distance(oh, src_h) < 8 and abs(ol - src_l) < 0.10:
            continue
        score = (dh / 32.0) + abs(os - ts) * 1.15 + abs(ol - tl) * 1.25
        if src_s > 0.55 and os > 0.68 and intent != "accent":
            score += 0.55
        if intent == "muted" and os > 0.62:
            score += 0.35
        if src_l < 0.25:
            score += abs(ol - 0.38) * 0.55
        scored.append((score, item))
    scored.sort(key=lambda x: x[0])
    out: List[Dict] = []
    used = set(exclude)
    for _, item in scored:
        if item["name"].lower() in used:
            continue
        obj = _from_named(item["name"], explanation, relationship)
        if obj:
            out.append(obj)
            used.add(item["name"].lower())
        if len(out) >= count:
            break
    if not out:
        out.append(_color_obj(target_h, ts, tl, explanation, relationship))
    return out


def merge_priority(*groups: List[Dict], selected_hex: str, selected_name: str, limit: int) -> List[Dict]:
    merged: List[Dict] = []
    for g in groups:
        merged.extend(g or [])
    return _dedupe(merged, selected_hex, selected_name)[:limit]


def build_color_combinations(raw_color: str) -> Dict:
    name, hex_code, (h, s, l) = resolve_input_color(raw_color)
    selected_neutral = is_fashion_neutral(h, s, l, name)
    family = detect_family(name, h, s, l)
    temp = temperature_label(h, s, l, selected_neutral)
    exclude: Set[str] = {name.lower()}

    # --- Theoretical hue relationships (24-hue wheel) ---
    comp_h = (h + 180.0) % 360.0
    analog_hues = [(h - 40.0) % 360.0, (h + 40.0) % 360.0, (h - 25.0) % 360.0]
    split_hues = [(comp_h - 30.0) % 360.0, (comp_h + 30.0) % 360.0]
    triad_hues = [(h + 120.0) % 360.0, (h + 240.0) % 360.0]
    tetra_hues = [(h + 90.0) % 360.0, (h + 180.0) % 360.0, (h + 270.0) % 360.0]

    analog_note = (
        "Neighboring hues (±30–45°) create a cohesive look. Keep one color dominant "
        "and mute supporting pieces; add a neutral if both feel rich."
    )
    if selected_neutral and s < 0.12:
        analog_note = (
            "With a true neutral, analogous partners are nearby greys and soft earth tones "
            "rather than a loud chroma shift."
        )

    analogous: List[Dict] = []
    for ah, intent in zip(analog_hues, ("muted", "pair", "muted")):
        analogous.extend(pick_related(
            ah, h, s, l, intent, analog_note, "analogous", exclude, count=1, max_hue=32.0,
        ))
        exclude.add(analogous[-1]["name"].lower())
    analogous = _dedupe(analogous, hex_code, name)[:3]

    comp_note = (
        f"Complementary hues sit ~180° apart ({hue_family_name(h)} ↔ {hue_family_name(comp_h)}). "
        "In clothing this is strong contrast — use a deeper or muted shade rather than two neon primaries."
    )
    complementary = pick_related(
        comp_h, h, s, l, "muted" if s > 0.45 else "pair",
        comp_note, "complementary", {name.lower()}, count=2, max_hue=34.0,
    )
    complementary = _dedupe(complementary, hex_code, name)[:2]

    split_note = (
        f"Split-complementary uses the neighbors of {hue_family_name(comp_h)} instead of the exact opposite. "
        "You get contrast with less clash than a direct complement."
    )
    split_comp: List[Dict] = []
    used_split = {name.lower()}
    for sh in split_hues:
        split_comp.extend(pick_related(
            sh, h, s, l, "muted" if s > 0.5 else "pair",
            split_note, "split-complementary", used_split, count=1, max_hue=30.0,
        ))
        if split_comp:
            used_split.add(split_comp[-1]["name"].lower())
    split_comp = _dedupe(split_comp, hex_code, name)[:2]

    triad_note = (
        "Triadic hues are ~120° apart. For clothing use 60% dominant / 30% secondary / 10% accent — "
        "do not wear all three at full saturation."
    )
    triadic: List[Dict] = []
    used_t = {name.lower()}
    for th, role in zip(triad_hues, ("pair", "accent")):
        triadic.extend(pick_related(
            th, h, s, l, role, triad_note, "triadic", used_t, count=1, max_hue=32.0,
        ))
        if triadic:
            used_t.add(triadic[-1]["name"].lower())
    triadic = _dedupe(triadic, hex_code, name)[:2]

    tetra_note = (
        "Tetradic (double-complementary) is two complementary pairs. Keep one color dominant; "
        "treat the rest as secondary or small accents."
    )
    tetradic: List[Dict] = []
    used_q = {name.lower()}
    for th, role in zip(tetra_hues, ("pair", "muted", "accent")):
        tetradic.extend(pick_related(
            th, h, s, l, role, tetra_note, "tetradic", used_q, count=1, max_hue=32.0,
        ))
        if tetradic:
            used_q.add(tetradic[-1]["name"].lower())
    tetradic = _dedupe(tetradic, hex_code, name)[:3]

    # Monochromatic: same hue, different S/L — never identical hexes.
    if selected_neutral and s < 0.12:
        mono_specs = [
            (h, _clamp(s, 0.0, 0.08), _clamp(l * 0.28 if l > 0.3 else 0.18, 0.05, 0.22),
             "A deeper value in the same neutral family."),
            (h, _clamp(s + 0.05, 0.0, 0.16), 0.42,
             "A mid-value companion in the same family."),
            (h, _clamp(s * 0.5, 0.0, 0.1), _clamp(max(l, 0.55) + 0.22, 0.72, 0.94),
             "A lighter tint of the same neutral."),
        ]
        if l > 0.88:
            mono_specs = [
                (h, 0.0, 0.12, "A deep charcoal value against white / ivory."),
                (h, 0.04, 0.42, "A mid grey that keeps the look monochrome."),
                (h, 0.06, 0.72, "A light grey tint in the same family."),
            ]
        elif l < 0.1:
            mono_specs = [
                (h, 0.0, 0.28, "Charcoal — a lifted shade of black."),
                (h, 0.03, 0.50, "Mid grey in the same achromatic family."),
                (h, 0.0, 0.86, "Off-white as the lightest monochrome step."),
            ]
    else:
        intents = ("mono-shade", "mono-tone", "mono-tint")
        notes = (
            "A deeper or mid shade of the same hue for trousers, knits, or layering.",
            "A toned (greyed) version of the same hue for a quieter supporting piece.",
            "A lighter tint of the same hue for shirts, lining, or summer fabrics.",
        )
        mono_specs = []
        for intent, note in zip(intents, notes):
            ms, ml_ = fashion_adjust(s, l, h, intent)
            if abs(ml_ - l) < 0.10:
                ml_ = _clamp(l + (0.22 if "tint" in intent else -0.16))
            if abs(ms - s) < 0.04 and abs(ml_ - l) < 0.12:
                ms = _clamp(s * 0.55)
            mono_specs.append((h, ms, ml_, note))

    monochromatic = []
    used_hex = {hex_code.upper()}
    for mh, ms, ml_, note in mono_specs:
        obj = _color_obj(mh, ms, ml_, note, "monochromatic", prefer_named=False)
        # If snapping collapsed to the same hex, keep the generated shade.
        if obj["hex"].upper() in used_hex:
            obj["hex"] = hsl_to_hex(mh, ms, ml_)
            obj["name"] = generated_display_name(mh, ms, ml_)
        if obj["hex"].upper() in used_hex:
            continue
        used_hex.add(obj["hex"].upper())
        monochromatic.append(obj)
    monochromatic = _dedupe(monochromatic, hex_code, name)[:3]

    # --- Neutrals that balance the selected color ---
    if selected_neutral and ("navy" not in name.lower()) and l < 0.15:
        preferred_neutrals = ["White", "Cream", "Ivory", "Grey", "Camel"]
    elif selected_neutral and l > 0.88:
        preferred_neutrals = ["Navy Blue", "Black", "Charcoal", "Beige", "Camel"]
    elif selected_neutral and "navy" in name.lower():
        preferred_neutrals = ["White", "Cream", "Ivory", "Beige", "Grey", "Camel"]
    elif s > 0.55:
        preferred_neutrals = ["Cream", "White", "Beige", "Navy Blue", "Black", "Camel", "Grey"]
    elif temp.startswith("warm"):
        preferred_neutrals = ["Cream", "Ivory", "Beige", "Camel", "Brown", "Navy Blue", "White"]
    else:
        preferred_neutrals = ["White", "Ivory", "Grey", "Charcoal", "Navy Blue", "Black", "Beige"]

    neutral_matches = []
    for n in preferred_neutrals:
        obj = _from_named(
            n,
            f"{name} + {n}: a reliable neutral pairing. The quiet color lets {name} stay the focus.",
            "neutral",
        )
        if obj:
            neutral_matches.append(obj)
    neutral_matches = _dedupe(neutral_matches, hex_code, name)[:5]

    knowledge_best: List[Dict] = []
    knowledge_accent: List[Dict] = []
    knowledge_contrast: List[Dict] = []
    if family and family in FASHION_PAIRINGS:
        pack = FASHION_PAIRINGS[family]
        for n in pack["best"]:
            obj = _from_named(
                n,
                f"{name} + {n}: a practical fashion combination used in real outfits.",
                "fashion",
            )
            if obj:
                knowledge_best.append(obj)
        for n in pack["accent"]:
            obj = _from_named(
                n,
                f"Works as a small accent with {name} (shoes, bag, scarf, jewellery, belt, tie).",
                "accent",
            )
            if obj:
                knowledge_accent.append(obj)
        for n in pack["contrast"]:
            obj = _from_named(
                n,
                f"Creates a stronger outfit contrast with {name}. Use as the smaller share of the look.",
                "contrast",
            )
            if obj:
                knowledge_contrast.append(obj)

    # Best fashion matches: knowledge first (never sorted away), then neutrals, then theory.
    theory_support = analogous[:2] + complementary[:1] + split_comp[:1] + monochromatic[1:2]
    if not selected_neutral or family == "navy":
        best_matches = merge_priority(
            knowledge_best, neutral_matches[:3], theory_support,
            selected_hex=hex_code, selected_name=name, limit=8,
        )
    else:
        best_matches = merge_priority(
            knowledge_best, theory_support, complementary[:1],
            selected_hex=hex_code, selected_name=name, limit=8,
        )
    if len(best_matches) < 5:
        best_matches = merge_priority(
            best_matches, neutral_matches, analogous, complementary,
            selected_hex=hex_code, selected_name=name, limit=8,
        )

    for c in best_matches:
        pair = f"{name} + {c['name']}"
        rel = c.get("relationship")
        if rel == "analogous":
            c["explanation"] = (
                f"{pair}: analogous harmony. Use {name} as the dominant piece and "
                f"{c['name']} as support, plus a neutral if both feel rich."
            )
        elif rel == "complementary":
            c["explanation"] = (
                f"{pair}: complementary contrast with fashion-adjusted depth — "
                "stronger than analogous, calmer than two bright primaries."
            )
        elif rel == "neutral":
            c["explanation"] = f"{pair}: a reliable wardrobe pairing. The neutral lets {name} stay the focus."
        elif rel == "fashion":
            c["explanation"] = f"{pair}: a practical fashion combination used in real outfits."
        elif rel == "monochromatic":
            c["explanation"] = f"{pair}: monochromatic — same hue family, different depth."
        elif rel == "split-complementary":
            c["explanation"] = (
                f"{pair}: split-complementary contrast that is usually easier than a direct opposite."
            )

    accent_pool = knowledge_accent + triadic[-1:] + tetradic[-1:]
    if family in ("navy", "black", "emerald", "burgundy"):
        gold = _from_named("Gold", "Metallic gold is a classic small-area accent.", "accent")
        if gold:
            accent_pool.insert(0, gold)
    if family == "navy":
        mustard = _from_named(
            "Mustard",
            "Mustard is a high-impact accent against navy, best in small doses.",
            "accent",
        )
        if mustard:
            accent_pool.insert(0, mustard)
    accent_colors = _dedupe(accent_pool, hex_code, name)[:4]

    contrast_pool = list(knowledge_contrast)
    if l < 0.35:
        contrast_pool += [
            _from_named("White", "Maximum value contrast — crisp and graphic.", "contrast"),
            _from_named("Cream", "Softer than white but still high contrast on a dark base.", "contrast"),
        ]
    else:
        contrast_pool.append(_from_named("Black", "Deep value contrast against a lighter garment.", "contrast"))
        contrast_pool.append(_from_named("Navy Blue", "Dark structured contrast that is easier than pure black in casual wear.", "contrast"))
    if complementary:
        contrast_pool.append(complementary[0])
    strong_contrast = _dedupe(contrast_pool, hex_code, name)[:4]

    # Use carefully: high-saturation theory partners — not "bad", just loud.
    loud_comp = _color_obj(
        comp_h, _clamp(max(s, 0.78), 0.70, 0.95), _clamp(max(l, 0.48), 0.45, 0.58),
        f"A fully saturated {hue_family_name(h)} + {hue_family_name(comp_h)} pairing is theoretically complementary "
        "but visually loud in clothing. Mute one shade or keep one color to a small accent.",
        "use-carefully",
        prefer_named=False,
    )
    loud_triad = _color_obj(
        triad_hues[0], _clamp(max(s, 0.74), 0.66, 0.92), 0.50,
        "Equal-strength triadic colors fight for attention. Keep the 60-30-10 rule if you use this hue.",
        "use-carefully",
        prefer_named=False,
    )
    loud_analog = _color_obj(
        (h + 40.0) % 360.0, 0.86, 0.52,
        "Two highly saturated neighboring hues can look costume-like together. Mute one, or separate them with a neutral.",
        "use-carefully",
        prefer_named=False,
    )
    use_carefully = _dedupe([loud_comp, loud_triad, loud_analog], hex_code, name)[:4]

    selected_payload = {
        "name": name,
        "hex": hex_code,
        "hsl": {"h": round(h, 1), "s": round(s, 3), "l": round(l, 3)},
        "temperature": temp,
        "is_neutral": selected_neutral,
        "saturation": saturation_label(s),
        "lightness": lightness_label(l),
        "hue_family": hue_family_name(h),
        "wheel": "24-hue",
    }

    color_theory = {
        "analogous": analogous[:3],
        "complementary": complementary[:2],
        "split_complementary": split_comp,
        "triadic": triadic,
        "monochromatic": monochromatic,
        "tetradic": tetradic,
    }

    theory_notes = {
        "analogous": analog_note,
        "complementary": comp_note,
        "split_complementary": split_note,
        "triadic": triad_note,
        "monochromatic": "Same hue at different lightness and saturation — shades, tints, and tones. Not the same HEX repeated.",
        "tetradic": tetra_note,
    }

    complementary_names = _names(complementary)
    analogous_names = _names(analogous[:3])
    triadic_names = _names(triadic)
    if len(triadic_names) < 3 and accent_colors:
        triadic_names.append(accent_colors[0]["name"])
    neutral_names = _names(neutral_matches[:3])

    return {
        "selected": selected_payload,
        "selected_color": name,
        "selected_hex": hex_code,
        "color_theory": color_theory,
        "theory_notes": theory_notes,
        "best_matches": best_matches,
        "neutral_matches": neutral_matches,
        "accent_colors": accent_colors,
        "strong_contrast": strong_contrast,
        "use_carefully": use_carefully,
        "recommended": _names(best_matches),
        "complementary": complementary_names,
        "analogous": analogous_names,
        "triadic": triadic_names,
        "neutral": neutral_names,
        "split_complementary": _names(split_comp),
        "monochromatic": _names(monochromatic),
        "fashion_rule": (
            "60% dominant / 30% secondary / 10% accent. "
            "High saturation pairs best with a muted or neutral companion."
        ),
        "module": "color_theory",
        "independent_of_skin_tone": True,
    }
