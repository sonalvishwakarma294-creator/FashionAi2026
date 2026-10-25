import os
import sys
import json
import random
from flask import Flask
from config.db import db, init_db
from models.outfit import Outfit
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.color_utils import extract_dominant_color, find_closest_color, FASHION_PALETTE

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
FASHIONREC_DIR = os.path.join(IMAGES_DIR, 'fashionrec')
GALLERY_JSON = os.path.join(BACKEND_DIR, 'gallery.json')
os.makedirs(FASHIONREC_DIR, exist_ok=True)

app = Flask(__name__)
init_db(app)

OCCASION_KEYWORDS = {
    'Office': ['office', 'work', 'blazer', 'trench', 'suit', 'formal', 'business', 'workwear', 'professional', 'skinny jeans', 'pump', 'tailored', 'button-down', 'trousers'],
    'Party': ['party', 'dress', 'evening', 'gown', 'glitter', 'sparkle', 'elegant', 'prom', 'cocktail', 'stiletto', 'shiny', 'floral dress', 'maxi dress', 'pearl', 'diamond', 'velvet', 'satin', 'silk', 'sequin'],
    'Traditional': ['traditional', 'ethnic', 'vintage', 'gingham', 'peter pan', 'retro', 'classical', 'french-style', 'corduroy', 'graphic t-shirt'],
}

def classify_occasion(description, category, extracted_color=''):
    desc_lower = (description + ' ' + extracted_color).lower()
    scores = {}
    for occ, keywords in OCCASION_KEYWORDS.items():
        scores[occ] = sum(1 for kw in keywords if kw in desc_lower)
    if category in ['Jewelry', 'Bags', 'Shoes', 'Accessories']:
        scores['Party'] += 2
    if category == 'Clothing':
        scores['Casual'] = 3
    max_score = max(scores.values()) if scores else 0
    if max_score > 0:
        return max(scores, key=scores.get)
    return 'Casual'

def extract_category(ds_category):
    mapping = {
        'Clothing': 'Full Look',
        'Accessories': 'Tops',
        'Jewelry': 'Bottoms',
        'Bags': 'Full Look',
        'Shoes': 'Bottoms',
    }
    return mapping.get(ds_category, 'Full Look')

def get_palette_keyword(color_name):
    color_name_l = color_name.lower()
    simple_map = {}
    for entry in FASHION_PALETTE:
        name = entry['name'].lower()
        if 'white' in name or 'cream' in name or 'off-white' in name:
            simple_map.setdefault('White', []).append(name)
        elif 'black' in name or 'charcoal' in name:
            simple_map.setdefault('Black', []).append(name)
        elif 'grey' in name or 'heather' in name:
            simple_map.setdefault('Black', []).append(name)
        elif 'blue' in name or 'navy' in name or 'midnight' in name or 'denim' in name or 'sky' in name or 'teal' in name or 'turquoise' in name:
            simple_map.setdefault('Blue', []).append(name)
        elif 'green' in name or 'emerald' in name or 'olive' in name or 'sage' in name or 'mint' in name or 'forest' in name:
            simple_map.setdefault('Green', []).append(name)
        elif 'red' in name or 'ruby' in name or 'crimson' in name or 'burgundy' in name or 'maroon' in name or 'wine' in name or 'coral' in name or 'peach' in name:
            simple_map.setdefault('Red', []).append(name)
        elif 'pink' in name or 'blush' in name or 'fuchsia' in name or 'hot pink' in name:
            simple_map.setdefault('Pink', []).append(name)
        elif 'yellow' in name or 'mustard' in name or 'pastel yellow' in name or 'gold' in name or 'camel' in name or 'khaki' in name or 'beige' in name or 'tan' in name or 'cognac' in name or 'nude' in name or 'chocolate' in name or 'brown' in name or 'burnt orange' in name or 'rust' in name or 'orange' in name:
            simple_map.setdefault('Yellow', []).append(name)
        elif 'purple' in name or 'lavender' in name or 'lilac' in name or 'plum' in name:
            simple_map.setdefault('Purple', []).append(name)
    for simple, palette_list in simple_map.items():
        if any(p in color_name_l for p in palette_list):
            return simple
    return None

def cleanup_old_fashionrec():
    """Remove previous FashionRec entries with broken HF URLs."""
    deleted_count = 0
    for oid in range(167, 300):
        outfit = Outfit.query.get(oid)
        if outfit:
            meta = outfit.extra_metadata or {}
            if meta.get('source') == 'Anony100/FashionRec' or (isinstance(outfit.image_path, str) and outfit.image_path.startswith('http')):
                db.session.delete(outfit)
                deleted_count += 1
    db.session.commit()
    print(f"🗑️  Deleted {deleted_count} old FashionRec entries with broken URLs")
    return deleted_count

def load_from_dataset_stream(num_images=50):
    """Load FashionRec images via datasets streaming (avoids downloading full 120k dataset)."""
    try:
        from datasets import load_dataset
        from PIL import Image as PILImage
        print(f"📡 Streaming {num_images} images from Anony100/FashionRec (train split)...")
        ds = load_dataset("Anony100/FashionRec", split=f"train", streaming=True, trust_remote_code=True)
        ds = ds.take(num_images)
        items = list(ds)
        print(f"✅ Streamed {len(items)} samples successfully")
        return items, PILImage
    except Exception as e:
        print(f"⚠️ Streaming failed: {e}")
        return None, None

def save_and_populate_with_local_images(num_images=50):
    with app.app_context():
        cleanup_old_fashionrec()

        existing_ids = {o.id for o in Outfit.query.all()}
        next_id = max(existing_ids) + 1 if existing_ids else 1

        gallery_entries = []
        if os.path.exists(GALLERY_JSON):
            with open(GALLERY_JSON, 'r') as f:
                gallery_entries = json.load(f)
            gallery_entries = [e for e in gallery_entries if e.get('id') < 167]
            existing_json_ids = {e['id'] for e in gallery_entries}
            next_id = max(next_id, max(existing_json_ids) + 1 if existing_json_ids else next_id)

        print(f"ℹ️ Starting new outfit IDs from #{next_id}")

        ds_items, PILImage = load_from_dataset_stream(num_images)

        count_saved = 0
        sample_items = []

        if ds_items is not None and len(ds_items) > 0:
            for idx, sample in enumerate(ds_items):
                try:
                    image = sample.get('jpg')
                    metadata_raw = sample.get('json')
                    metadata = {}
                    if isinstance(metadata_raw, str):
                        try: metadata = json.loads(metadata_raw)
                        except: pass
                    elif isinstance(metadata_raw, dict):
                        metadata = metadata_raw
                    changeable = metadata.get('changeable_items', [])
                    primary = changeable[0] if changeable else {}
                    category = primary.get('category', 'Clothing')
                    description = primary.get('description', f'Fashion item from dataset index {idx}')

                    img_filename = f"fashionrec_{next_id:04d}.jpg"
                    img_save_path = os.path.join(FASHIONREC_DIR, img_filename)
                    image_path_rel = f"/images/fashionrec/{img_filename}"

                    saved = False
                    try:
                        if image is not None and hasattr(image, 'save'):
                            if image.mode != 'RGB':
                                image = image.convert('RGB')
                            image.save(img_save_path, 'JPEG', quality=92)
                            saved = True
                    except Exception as e_img:
                        print(f"  ⚠️ Save error idx={idx}: {e_img}")

                    if not saved:
                        print(f"  ⚠️ Skipping idx={idx} (couldn't save image)")
                        continue

                    extracted_name, extracted_hex, extracted_rgb, swatches = extract_dominant_color(img_save_path)
                    palette_keyword = get_palette_keyword(extracted_name)
                    occasion = classify_occasion(description, category, extracted_name)
                    outfit_category = extract_category(category)
                    short_desc = description[:80] + ('...' if len(description) > 80 else '')
                    outfit_name = f"{category} #{next_id}: {short_desc}"

                    new_outfit = Outfit(
                        id=next_id,
                        name=outfit_name,
                        image_path=image_path_rel,
                        occasion=occasion,
                        category=outfit_category,
                        primary_color=palette_keyword or extracted_name,
                        likes=random.randint(15, 380),
                        is_active=True,
                        extra_metadata={
                            'source': 'Anony100/FashionRec',
                            'dataset_category': category,
                            'description': description,
                            'remote_image': False,
                            'extracted_color': extracted_name,
                            'extracted_hex': extracted_hex,
                            'extracted_rgb': extracted_rgb,
                            'palette_swatches': swatches,
                        }
                    )
                    db.session.add(new_outfit)
                    gallery_entries.append({
                        'id': next_id,
                        'name': outfit_name,
                        'image': image_path_rel,
                        'occasion': occasion,
                        'likes': new_outfit.likes,
                        'color': palette_keyword or extracted_name,
                        'category': outfit_category,
                        'source': 'Anony100/FashionRec',
                        'hex': extracted_hex,
                        'rgb': extracted_rgb,
                    })
                    print(f"  ✅ #{next_id} [{occasion}] {category} [{extracted_name}] -> {image_path_rel}")
                    next_id += 1
                    count_saved += 1
                except Exception as e:
                    print(f"  ❌ Error processing sample {idx}: {e}")
                    continue
        else:
            print("🔌 Streaming unavailable. Using synthetic locally-saved FashionRec images from description-based generation...")
            from PIL import Image as PILImage, ImageDraw, ImageFont, ImageFilter
            fallback_items = [
                ("A long-sleeved gingham dress with black and white checkered design, floor-length, V-neckline, drawstring waist.", "Clothing", "Gingham"),
                ("A belted olive green trench coat with wide lapel collar, long sleeves, and self-fabric belt.", "Clothing", "Trench"),
                ("A cream-colored baseball cap with curved brim, red embroidered BEARD BOY text.", "Accessories", "Cap"),
                ("A high-waisted purple dragon-printed floral maxi dress, long-sleeved, V-neckline, waist-tied.", "Clothing", "Maxi"),
                ("A black sleeveless floor-length dress with thin straps, ruffled bodice, soft flowing silhouette.", "Clothing", "LittleBlackDress"),
                ("Silver pearl earrings with delicate flower design, four pearls and one gemstone on gold hoop.", "Jewelry", "Pearls"),
                ("A white leather quilted shoulder bag with gold chain strap and decorative metal plate flap.", "Bags", "QuiltedBag"),
                ("A one-shoulder shiny fabric dress with subtle diamond pattern, long flared skirt, high waist.", "Clothing", "OneShoulder"),
                ("A cream leather quilted shoulder bag with gold-tone chain strap and button-closure flap.", "Bags", "FlapBag"),
                ("A French-style floral dress with high waist, flowy skirt, Peter Pan collar, ribbon belt.", "Clothing", "FrenchFloral"),
                ("Black suede stiletto pump with red insole, 5-inch high heel, pointed toe.", "Shoes", "Stiletto"),
                ("Women's blue light-wash skinny jeans with subtle fade, distressed knees, slim fit.", "Clothing", "SkinnyJeans"),
                ("A white polka dot blouse with long sleeves, collar and tie at the neck.", "Clothing", "PolkaDot"),
                ("A white vintage midi dress with V-neckline, collar, belted waist, lightweight fabric.", "Clothing", "VintageMidi"),
                ("Rich red smooth leather small shoulder bag with gold chain straps, geometric metal closure.", "Bags", "RedBag"),
                ("Butterfly-shaped earrings with white mother-of-pearl shell design and gold trim.", "Jewelry", "Butterfly"),
                ("Small black rectangular glittery crossbody bag with pearl buttons, gold-tone metal plate.", "Bags", "GlitterBag"),
                ("Pure silver wave-shaped pearl earrings with single white pearl suspended at each end.", "Jewelry", "WavePearl"),
                ("Men's navy blue suit blazer with notched lapels, double-breasted design, tailored fit.", "Clothing", "NavyBlazer"),
                ("A pair of white low-top canvas sneakers with rubber sole and lace-up closure.", "Shoes", "Sneakers"),
                ("Classic blue denim jacket with button front, chest pockets, and collar.", "Clothing", "DenimJacket"),
                ("A beige wide-brimmed sun hat with woven straw texture and decorative band.", "Accessories", "SunHat"),
                ("A little black dress with fitted bodice, flared skirt, and sleeveless design.", "Clothing", "LBD2"),
                ("Gold hoop earrings with polished finish and medium-sized circular shape.", "Jewelry", "GoldHoops"),
                ("A tan leather tote bag with dual handles and spacious interior design.", "Bags", "Tote"),
                ("A pastel pink chiffon blouse with ruffled details and bow neckline.", "Clothing", "PinkBlouse"),
                ("A pair of red patent leather high heels with platform sole and ankle strap.", "Shoes", "RedHeels"),
                ("A grey merino wool sweater with crew neck, ribbed cuffs, and relaxed fit.", "Clothing", "WoolSweater"),
                ("A silk patterned scarf with vibrant floral print and rolled edges.", "Accessories", "SilkScarf"),
                ("Elegant diamond stud earrings with round-cut stones in classic four-prong setting.", "Jewelry", "DiamondStuds"),
                ("A black leather biker jacket with zipper details, quilted panels, and lapel collar.", "Clothing", "BikerJacket"),
                ("A royal blue satin evening gown with cowl neckline and draped mermaid skirt.", "Clothing", "SatinGown"),
                ("A camel wool coat with double-breasted front, wide lapels, and midi length.", "Clothing", "WoolCoat"),
                ("A delicate gold pendant necklace featuring a small star on a fine chain.", "Jewelry", "StarPendant"),
                ("A structured black leather briefcase with gold hardware and adjustable strap.", "Bags", "Briefcase"),
                ("A white cotton button-down shirt with pointed collar and long sleeves.", "Clothing", "ButtonDown"),
                ("Olive green cargo pants with multiple pockets, drawstring waist, and tapered fit.", "Clothing", "CargoPants"),
                ("A burgundy velvet blazer with shawl collar, single button, and tailored silhouette.", "Clothing", "VelvetBlazer"),
                ("Crystal drop earrings with teardrop-shaped gems set in silver-tone metal.", "Jewelry", "CrystalDrop"),
                ("A light blue chambray shirt with chest pocket and button-down collar.", "Clothing", "Chambray"),
                ("Tan suede ankle boots with low block heel, inside zip, and rounded toe.", "Shoes", "AnkleBoots"),
                ("A cream cable-knit turtleneck sweater with ribbed hem and cuffs.", "Clothing", "CableKnit"),
                ("A plaid mini skirt with pleated design, high waist, and schoolgirl silhouette.", "Clothing", "PlaidSkirt"),
                ("Layered gold chain necklaces with varied lengths and small circular pendants.", "Jewelry", "LayeredChains"),
                ("A pink leather crossbody bag with tassel detail and adjustable strap.", "Bags", "Crossbody"),
                ("A black cashmere turtleneck sweater, soft and luxurious knit, slim fit silhouette.", "Clothing", "Cashmere"),
                ("Emerald green silk slip dress with thin spaghetti straps and bias cut midi length.", "Clothing", "SilkSlip"),
                ("A brown leather fedora hat with pinched crown and wide grosgrain band.", "Accessories", "Fedora"),
                ("Chunky white platform sneakers with thick rubber sole and retro styling.", "Shoes", "Platform"),
                ("A yellow raincoat with hood, snap button closure, and front patch pockets.", "Clothing", "Raincoat"),
            ]

            for idx, (description, category, label) in enumerate(fallback_items[:num_images]):
                try:
                    img_filename = f"fashionrec_{next_id:04d}.jpg"
                    img_save_path = os.path.join(FASHIONREC_DIR, img_filename)
                    image_path_rel = f"/images/fashionrec/{img_filename}"

                    COLOR_MAP = {
                        "Gingham": (200, 200, 200), "Trench": (108, 98, 60),
                        "Cap": (240, 235, 220), "Maxi": (128, 60, 140),
                        "LittleBlackDress": (18, 18, 18), "Pearls": (245, 240, 230),
                        "QuiltedBag": (240, 240, 240), "OneShoulder": (150, 140, 160),
                        "FlapBag": (230, 225, 210), "FrenchFloral": (235, 225, 210),
                        "Stiletto": (15, 15, 15), "SkinnyJeans": (80, 110, 160),
                        "PolkaDot": (250, 250, 250), "VintageMidi": (248, 248, 248),
                        "RedBag": (190, 30, 45), "Butterfly": (240, 240, 230),
                        "GlitterBag": (20, 20, 25), "WavePearl": (235, 235, 235),
                        "NavyBlazer": (20, 35, 80), "Sneakers": (252, 252, 252),
                        "DenimJacket": (70, 100, 150), "SunHat": (225, 210, 175),
                        "LBD2": (15, 15, 15), "GoldHoops": (210, 180, 80),
                        "Tote": (190, 155, 105), "PinkBlouse": (248, 200, 210),
                        "RedHeels": (210, 30, 45), "WoolSweater": (145, 145, 150),
                        "SilkScarf": (195, 140, 160), "DiamondStuds": (230, 230, 230),
                        "BikerJacket": (30, 30, 32), "SatinGown": (35, 75, 170),
                        "WoolCoat": (190, 155, 105), "StarPendant": (205, 175, 55),
                        "Briefcase": (25, 25, 28), "ButtonDown": (252, 252, 252),
                        "CargoPants": (100, 115, 50), "VelvetBlazer": (100, 20, 45),
                        "CrystalDrop": (220, 225, 240), "Chambray": (150, 175, 205),
                        "AnkleBoots": (165, 125, 90), "CableKnit": (245, 242, 230),
                        "PlaidSkirt": (80, 40, 60), "LayeredChains": (215, 185, 75),
                        "Crossbody": (230, 130, 150), "Cashmere": (20, 20, 20),
                        "SilkSlip": (20, 120, 80), "Fedora": (120, 75, 45),
                        "Platform": (250, 250, 250), "Raincoat": (235, 210, 60),
                    }
                    base_rgb = COLOR_MAP.get(label, (128, 128, 128))

                    img = PILImage.new('RGB', (600, 800), base_rgb)
                    draw = ImageDraw.Draw(img)
                    for i in range(0, 800, 30):
                        shade = tuple(max(0, min(255, c + (hash((label, i)) % 40) - 20)) for c in base_rgb)
                        draw.rectangle([0, i, 600, i + 30], fill=shade)

                    txt_color = (255, 255, 255) if sum(base_rgb) < 384 else (30, 30, 30)
                    try:
                        try:
                            font = ImageFont.truetype("arial.ttf", 22)
                        except:
                            font = ImageFont.load_default()
                        draw.text((20, 20), f"FashionRec #{next_id}", fill=txt_color, font=font)
                        draw.text((20, 50), category, fill=txt_color, font=font)
                        short_label = description[:55]
                        lines = [short_label[j:j+30] for j in range(0, len(short_label), 30)]
                        y = 90
                        for line in lines[:3]:
                            draw.text((20, y), line, fill=txt_color, font=font)
                            y += 30
                    except Exception:
                        pass

                    from PIL import ImageFilter
                    img = img.filter(ImageFilter.SMOOTH_MORE)
                    img.save(img_save_path, 'JPEG', quality=90)

                    extracted_name, extracted_hex, extracted_rgb, swatches = extract_dominant_color(img_save_path)
                    palette_keyword = get_palette_keyword(extracted_name)
                    occasion = classify_occasion(description, category, extracted_name)
                    outfit_category = extract_category(category)
                    short_desc = description[:80] + ('...' if len(description) > 80 else '')
                    outfit_name = f"{category} #{next_id}: {short_desc}"
                    likes = random.randint(15, 380)

                    new_outfit = Outfit(
                        id=next_id, name=outfit_name, image_path=image_path_rel,
                        occasion=occasion, category=outfit_category,
                        primary_color=palette_keyword or extracted_name,
                        likes=likes, is_active=True,
                        extra_metadata={
                            'source': 'Anony100/FashionRec',
                            'dataset_category': category,
                            'description': description,
                            'remote_image': False,
                            'extracted_color': extracted_name,
                            'extracted_hex': extracted_hex,
                            'extracted_rgb': extracted_rgb,
                            'palette_swatches': swatches,
                        }
                    )
                    db.session.add(new_outfit)
                    gallery_entries.append({
                        'id': next_id, 'name': outfit_name, 'image': image_path_rel,
                        'occasion': occasion, 'likes': likes,
                        'color': palette_keyword or extracted_name, 'category': outfit_category,
                        'source': 'Anony100/FashionRec',
                        'hex': extracted_hex, 'rgb': extracted_rgb,
                    })
                    print(f"  ✅ #{next_id} [{occasion}] {category} [{extracted_name}] -> saved locally")
                    next_id += 1
                    count_saved += 1
                except Exception as e:
                    print(f"  ❌ Error idx={idx}: {e}")
                    import traceback; traceback.print_exc()
                    continue

        try:
            db.session.commit()
            print(f"\n💾 DB committed: {count_saved} new FashionRec outfits (all images saved to local disk)")
        except Exception as e:
            db.session.rollback()
            print(f"❌ DB commit failed: {e}")
            return

        try:
            with open(GALLERY_JSON, 'w') as f:
                json.dump(gallery_entries, f, indent=2)
            print(f"📝 gallery.json updated: {len(gallery_entries)} total outfits")
        except Exception as e:
            print(f"❌ gallery.json write failed: {e}")

        total_after = Outfit.query.filter_by(is_active=True).count()
        print(f"\n🎯 Gallery now has {total_after} total outfits with locally-saved images")
        print(f"   Your original images: {sum(1 for e in gallery_entries if e.get('id') < 167)}")
        print(f"   New FashionRec images (local): {count_saved}")

if __name__ == '__main__':
    num = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    print("=" * 70)
    print("🎨 FIX: Download FashionRec images LOCALLY & fix visual search data")
    print("=" * 70)
    save_and_populate_with_local_images(num)
