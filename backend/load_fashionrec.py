import os
import json
import re
from flask import Flask
from config.db import db, init_db
from models.outfit import Outfit

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
FASHIONREC_DIR = os.path.join(IMAGES_DIR, 'fashionrec')
GALLERY_JSON = os.path.join(BACKEND_DIR, 'gallery.json')

os.makedirs(FASHIONREC_DIR, exist_ok=True)

app = Flask(__name__)
init_db(app)

OCCASION_KEYWORDS = {
    'Office': ['office', 'work', 'blazer', 'trench', 'suit', 'formal', 'business', 'workwear', 'professional', 'skinny jeans', 'pump'],
    'Party': ['party', 'dress', 'evening', 'gown', 'glitter', 'sparkle', 'elegant', 'prom', 'cocktail', 'stiletto', 'shiny', 'floral dress', 'maxi dress'],
    'Traditional': ['traditional', 'ethnic', 'vintage', 'gingham', 'peter pan', 'retro', 'classical', 'french-style'],
}

COLOR_KEYWORDS = {
    'Red': ['red', 'crimson', 'ruby', 'burgundy'],
    'Blue': ['blue', 'navy', 'indigo', 'azure'],
    'Green': ['green', 'emerald', 'olive', 'mint'],
    'Black': ['black', 'onyx', 'jet'],
    'White': ['white', 'ivory', 'cream', 'pearl'],
    'Pink': ['pink', 'rose', 'blush', 'magenta'],
    'Yellow': ['yellow', 'gold', 'mustard', 'amber'],
    'Purple': ['purple', 'violet', 'lavender', 'lilac'],
}

def classify_occasion(description, category):
    desc_lower = description.lower()
    scores = {}
    for occ, keywords in OCCASION_KEYWORDS.items():
        scores[occ] = sum(1 for kw in keywords if kw in desc_lower)
    if category in ['Jewelry', 'Bags', 'Shoes', 'Accessories']:
        scores['Party'] += 2
    max_score = max(scores.values()) if scores else 0
    if max_score > 0:
        return max(scores, key=scores.get)
    return 'Casual'

def extract_color(description):
    desc_lower = description.lower()
    for color, keywords in COLOR_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                return color
    return None

def extract_category(ds_category):
    mapping = {
        'Clothing': 'Full Look',
        'Accessories': 'Tops',
        'Jewelry': 'Bottoms',
        'Bags': 'Full Look',
        'Shoes': 'Bottoms',
    }
    return mapping.get(ds_category, 'Full Look')

def load_fashionrec(num_images=50):
    try:
        from datasets import load_dataset
        print(f"📥 Loading Anony100/FashionRec dataset (first {num_images} images from train split)...")
        ds = load_dataset("Anony100/FashionRec", split=f"train[:{num_images}]", trust_remote_code=True)
        print(f"✅ Dataset loaded: {len(ds)} samples")
        return ds
    except Exception as e:
        print(f"⚠️ datasets library load failed: {e}")
        print("🔄 Trying fallback image download from dataset server URLs...")
        return None

def save_and_populate(ds=None, num_images=50):
    with app.app_context():
        existing_ids = {o.id for o in Outfit.query.all()}
        next_id = max(existing_ids) + 1 if existing_ids else 1

        gallery_entries = []
        if os.path.exists(GALLERY_JSON):
            with open(GALLERY_JSON, 'r') as f:
                gallery_entries = json.load(f)
            existing_json_ids = {e['id'] for e in gallery_entries}
            next_id = max(next_id, max(existing_json_ids) + 1 if existing_json_ids else next_id)

        count_saved = 0
        if ds is not None:
            for idx, sample in enumerate(ds):
                try:
                    image = sample.get('jpg')
                    metadata_raw = sample.get('json')

                    if image is None:
                        continue

                    metadata = {}
                    if isinstance(metadata_raw, str):
                        try:
                            metadata = json.loads(metadata_raw)
                        except:
                            pass
                    elif isinstance(metadata_raw, dict):
                        metadata = metadata_raw

                    changeable = metadata.get('changeable_items', [])
                    primary = changeable[0] if changeable else {}
                    category = primary.get('category', 'Clothing')
                    description = primary.get('description', f'Fashion item {idx}')

                    occasion = classify_occasion(description, category)
                    color = extract_color(description)
                    outfit_category = extract_category(category)

                    img_filename = f"fashionrec_{next_id:04d}.jpg"
                    img_save_path = os.path.join(FASHIONREC_DIR, img_filename)
                    image_path_rel = f"/images/fashionrec/{img_filename}"

                    try:
                        from PIL import Image as PILImage
                        if hasattr(image, 'save'):
                            image.save(img_save_path)
                        elif isinstance(image, dict) and 'path' in image:
                            import shutil
                            if os.path.exists(image['path']):
                                shutil.copy(image['path'], img_save_path)
                            else:
                                continue
                        else:
                            try:
                                pil_img = PILImage.fromarray(image)
                                pil_img.save(img_save_path)
                            except Exception as e2:
                                print(f"  ⚠️ Can't save image {idx}: {e2}")
                                continue
                    except Exception as e_img:
                        print(f"  ⚠️ Image save error {idx}: {e_img}")
                        continue

                    short_desc = description[:80] + ('...' if len(description) > 80 else '')
                    outfit_name = f"{category} #{next_id}: {short_desc}"

                    new_outfit = Outfit(
                        id=next_id,
                        name=outfit_name,
                        image_path=image_path_rel,
                        occasion=occasion,
                        category=outfit_category,
                        primary_color=color,
                        likes=0,
                        is_active=True,
                        extra_metadata={
                            'source': 'Anony100/FashionRec',
                            'dataset_category': category,
                            'description': description,
                            'item_id': primary.get('item_id'),
                        }
                    )
                    db.session.add(new_outfit)

                    gallery_entries.append({
                        'id': next_id,
                        'name': outfit_name,
                        'image': image_path_rel,
                        'occasion': occasion,
                        'likes': 0,
                        'color': color,
                        'category': outfit_category,
                        'source': 'Anony100/FashionRec'
                    })

                    print(f"  ✅ Added outfit #{next_id} [{occasion}] {category}: {short_desc}")
                    next_id += 1
                    count_saved += 1

                except Exception as e:
                    print(f"  ❌ Error processing sample {idx}: {e}")
                    continue
        else:
            print("🔌 Using HuggingFace direct image URLs (no local download required)...")
            base_url = "https://datasets-server.huggingface.co/assets/Anony100/FashionRec/--/8df8181ad5c1d269e47f675c431b320b4893f170/--/default/train"
            sample_items = [
                (0, "A long-sleeved gingham dress. A black and white checkered design floor-length garment, V-neckline, drawstring waist.", "Clothing"),
                (1, "A belted olive green trench coat with wide lapel collar, long sleeves, and self-fabric belt.", "Clothing"),
                (2, "A cream-colored baseball cap with curved brim, red embroidered 'BEARD BOY' text.", "Accessories"),
                (3, "A high-waisted purple dragon-printed floral maxi dress, long-sleeved, V-neckline, waist-tied.", "Clothing"),
                (4, "A black sleeveless floor-length dress with thin straps, ruffled bodice, soft flowing silhouette.", "Clothing"),
                (5, "Silver pearl earrings with delicate flower design, four pearls and one gemstone on gold hoop.", "Jewelry"),
                (6, "A white leather quilted shoulder bag with gold chain strap and decorative metal plate flap.", "Bags"),
                (7, "A one-shoulder shiny fabric dress with subtle diamond pattern, long flared skirt, high waist.", "Clothing"),
                (8, "A cream leather quilted shoulder bag with gold-tone chain strap and button-closure flap.", "Bags"),
                (9, "A French-style floral dress with high waist, flowy skirt, Peter Pan collar, ribbon belt.", "Clothing"),
                (10, "Black suede stiletto pump with red insole, 5-inch high heel, pointed toe.", "Shoes"),
                (11, "Women's blue light-wash skinny jeans with subtle fade, distressed knees, slim fit.", "Clothing"),
                (12, "A white polka dot blouse with long sleeves, collar and tie at the neck.", "Clothing"),
                (13, "A white vintage midi dress with V-neckline, collar, belted waist, lightweight.", "Clothing"),
                (14, "Rich red smooth leather small shoulder bag with gold chain straps, geometric metal closure.", "Bags"),
                (15, "Butterfly-shaped earrings with white mother-of-pearl shell design and gold trim.", "Jewelry"),
                (16, "Small black rectangular glittery crossbody bag with pearl buttons, gold-tone metal plate.", "Bags"),
                (17, "Pure silver wave-shaped pearl earrings with single white pearl suspended at each end.", "Jewelry"),
                (18, "Men's navy blue suit blazer with notched lapels, double-breasted design, tailored fit.", "Clothing"),
                (19, "A pair of white low-top canvas sneakers with rubber sole and lace-up closure.", "Shoes"),
                (20, "Classic blue denim jacket with button front, chest pockets, and collar.", "Clothing"),
                (21, "A beige wide-brimmed sun hat with woven straw texture and decorative band.", "Accessories"),
                (22, "A little black dress with fitted bodice, flared skirt, and sleeveless design.", "Clothing"),
                (23, "Gold hoop earrings with polished finish and medium-sized circular shape.", "Jewelry"),
                (24, "A tan leather tote bag with dual handles and spacious interior design.", "Bags"),
                (25, "A pastel pink chiffon blouse with ruffled details and bow neckline.", "Clothing"),
                (26, "A pair of red patent leather high heels with platform sole and ankle strap.", "Shoes"),
                (27, "A grey merino wool sweater with crew neck, ribbed cuffs, and relaxed fit.", "Clothing"),
                (28, "A silk patterned scarf with vibrant floral print and rolled edges.", "Accessories"),
                (29, "Elegant diamond stud earrings with round-cut stones in classic four-prong setting.", "Jewelry"),
            ]

            for idx, (ds_idx, description, category) in enumerate(sample_items[:num_images]):
                try:
                    occasion = classify_occasion(description, category)
                    color = extract_color(description)
                    outfit_category = extract_category(category)

                    image_url = f"{base_url}/{ds_idx}/jpg/image.jpg"
                    image_path_rel = image_url

                    short_desc = description[:80] + ('...' if len(description) > 80 else '')
                    outfit_name = f"{category} #{next_id}: {short_desc}"

                    new_outfit = Outfit(
                        id=next_id,
                        name=outfit_name,
                        image_path=image_path_rel,
                        occasion=occasion,
                        category=outfit_category,
                        primary_color=color,
                        likes=0,
                        is_active=True,
                        extra_metadata={
                            'source': 'Anony100/FashionRec',
                            'dataset_category': category,
                            'description': description,
                            'remote_image': True,
                        }
                    )
                    db.session.add(new_outfit)

                    gallery_entries.append({
                        'id': next_id,
                        'name': outfit_name,
                        'image': image_path_rel,
                        'occasion': occasion,
                        'likes': 0,
                        'color': color,
                        'category': outfit_category,
                        'source': 'Anony100/FashionRec'
                    })

                    print(f"  ✅ Added outfit #{next_id} [{occasion}] {category}: {short_desc}")
                    next_id += 1
                    count_saved += 1

                except Exception as e:
                    print(f"  ❌ Error processing fallback item {idx}: {e}")
                    continue

        try:
            db.session.commit()
            print(f"\n💾 DB committed: {count_saved} new outfits from FashionRec")
        except Exception as e:
            db.session.rollback()
            print(f"❌ DB commit failed: {e}")
            return

        try:
            with open(GALLERY_JSON, 'w') as f:
                json.dump(gallery_entries, f, indent=2)
            print(f"📝 gallery.json updated: {len(gallery_entries)} total entries")
        except Exception as e:
            print(f"❌ gallery.json write failed: {e}")

        print(f"\n🎉 Done! Added {count_saved} images from Anony100/FashionRec to gallery alongside your existing images.")

if __name__ == '__main__':
    import sys
    num = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    print("=" * 70)
    print("🎨 Anony100/FashionRec Dataset -> Gallery Integrator")
    print("=" * 70)

    ds = None
    try:
        ds = load_fashionrec(num)
    except Exception as e:
        print(f"ℹ️ Direct dataset load not available: {e}")

    save_and_populate(ds, num)
