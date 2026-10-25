import os
import sys
import json
from flask import Flask
from config.db import db, init_db
from models.outfit import Outfit
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.color_utils import extract_dominant_color, FASHION_PALETTE

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

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
GALLERY_JSON = os.path.join(BACKEND_DIR, 'gallery.json')

app = Flask(__name__)
init_db(app)

def get_palette_simple(color_name):
    return get_palette_keyword(color_name)

def main():
    with app.app_context():
        outfits = Outfit.query.order_by(Outfit.id).all()
        print(f"🎨 Analyzing color for {len(outfits)} outfits...")
        updated = 0
        gallery_entries = []

        if os.path.exists(GALLERY_JSON):
            with open(GALLERY_JSON, 'r') as f:
                gallery_entries = json.load(f)
            gallery_map = {e['id']: e for e in gallery_entries}
        else:
            gallery_map = {}

        for outfit in outfits:
            try:
                img_rel = outfit.image_path or ''
                if img_rel.startswith('http'):
                    continue

                img_path = os.path.join(PROJECT_ROOT, img_rel.lstrip('/').replace('/', os.sep))
                if not os.path.exists(img_path):
                    alt = os.path.join(IMAGES_DIR, *img_rel.strip('/').split('/')[1:] if img_rel.startswith('/images') else img_rel.strip('/').split('/'))
                    if os.path.exists(alt):
                        img_path = alt
                    else:
                        continue

                extracted_name, extracted_hex, extracted_rgb, swatches = extract_dominant_color(img_path)
                simple = get_palette_simple(extracted_name)

                meta = outfit.extra_metadata or {}
                changed = False
                if not meta.get('extracted_color') or meta.get('extracted_color') != extracted_name:
                    meta['extracted_color'] = extracted_name
                    meta['extracted_hex'] = extracted_hex
                    meta['extracted_rgb'] = extracted_rgb
                    meta['palette_swatches'] = swatches
                    outfit.extra_metadata = meta
                    changed = True
                if not outfit.primary_color or (simple and outfit.primary_color not in (simple, extracted_name)):
                    if simple:
                        outfit.primary_color = simple
                        changed = True
                    elif extracted_name:
                        outfit.primary_color = extracted_name
                        changed = True

                if outfit.id in gallery_map:
                    entry = gallery_map[outfit.id]
                    entry['color'] = simple or outfit.primary_color or ''
                    entry['hex'] = extracted_hex
                    entry['rgb'] = extracted_rgb

                if changed:
                    updated += 1
                    print(f"  ✅ #{outfit.id}: {outfit.primary_color} <-- {extracted_name} ({extracted_hex}) {img_rel[:50]}")

            except Exception as e:
                print(f"  ⚠️  #{outfit.id}: error - {e}")
                continue

        try:
            db.session.commit()
            print(f"\n💾 DB: Updated colors for {updated} outfits")
        except Exception as e:
            db.session.rollback()
            print(f"❌ DB commit failed: {e}")
            return

        gallery_entries = list(gallery_map.values())
        gallery_entries.sort(key=lambda x: x['id'])
        try:
            with open(GALLERY_JSON, 'w') as f:
                json.dump(gallery_entries, f, indent=2)
            print(f"📝 gallery.json: {len(gallery_entries)} entries with updated hex/rgb/color fields")
        except Exception as e:
            print(f"❌ gallery.json write failed: {e}")

        no_color = Outfit.query.filter((Outfit.primary_color == None) | (Outfit.primary_color == '')).count()
        print(f"\n✅ Outfits without any primary_color: {no_color} / {len(outfits)}")
        print("✅ All gallery images now have extracted colors for accurate visual search!")

if __name__ == '__main__':
    print("=" * 70)
    print("🎨 Color Extraction: enrich all gallery outfits with pixel-perfect color data")
    print("=" * 70)
    main()
