import os
import sys
import time
from flask import Flask
from config.db import db, init_db
from models.outfit import Outfit
from utils.color_utils import extract_full_palette, FASHION_PALETTE

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')

app = Flask(__name__)
init_db(app)


def find_image_path(image_path):
    candidates = []
    if os.path.isabs(image_path):
        candidates.append(image_path)
    else:
        candidates.append(os.path.join(PROJECT_ROOT, image_path))
        candidates.append(os.path.join(IMAGES_DIR, image_path))
        candidates.append(os.path.join(IMAGES_DIR, os.path.basename(image_path)))
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def palette_keyword(color_name):
    import re
    color_name_l = color_name.lower()
    tokens = set(re.findall(r"[a-z]+", color_name_l))
    normalized_hyphen = color_name_l.replace('-', ' ')
    hyphen_tokens = set(re.findall(r"[a-z]+", normalized_hyphen))
    all_tokens = tokens | hyphen_tokens

    mapping = [
        ('White', ['white', 'cream', 'off white', 'ivory']),
        ('Black', ['black', 'charcoal', 'grey', 'heather', 'gray']),
        ('Blue', ['blue', 'navy', 'midnight', 'denim', 'sky', 'teal', 'turquoise', 'indigo', 'cobalt']),
        ('Green', ['green', 'emerald', 'olive', 'sage', 'mint', 'forest', 'lime', 'khaki']),
        ('Red', ['red', 'ruby', 'crimson', 'burgundy', 'maroon', 'wine', 'coral', 'peach', 'scarlet']),
        ('Pink', ['pink', 'blush', 'fuchsia', 'rose', 'magenta']),
        ('Yellow', ['yellow', 'mustard', 'gold', 'camel', 'beige', 'tan', 'cognac', 'nude',
                    'chocolate', 'brown', 'burnt orange', 'rust', 'orange',
                    'pastel yellow', 'amber', 'caramel']),
        ('Purple', ['purple', 'lavender', 'lilac', 'plum', 'violet', 'eggplant']),
    ]
    for simple, kws in mapping:
        for kw in kws:
            if ' ' in kw:
                if kw in color_name_l or kw in normalized_hyphen:
                    return simple
            else:
                if kw in all_tokens:
                    return simple
    return None


def index_all(commit_every=20, skip_existing=True):
    with app.app_context():
        outfits = Outfit.query.filter_by(is_active=True).all()
        total = len(outfits)
        already = 0
        processed = 0
        failed = 0
        missing_images = 0
        errors = []
        batch_start = time.time()

        print(f"🚀 Indexing palettes for {total} outfits...")
        print(f"   Skip existing: {skip_existing}  |  Commit every: {commit_every}")
        print("-" * 60)

        for idx, outfit in enumerate(outfits, start=1):
            meta = outfit.extra_metadata or {}
            if skip_existing:
                cached = meta.get('palette_swatches')
                if cached and isinstance(cached, list) and len(cached) >= 1:
                    valid = all(
                        isinstance(s, dict) and isinstance(s.get('rgb'), (list, tuple)) and len(s['rgb']) == 3
                        for s in cached
                    )
                    if valid:
                        already += 1
                        continue

            img_path = find_image_path(outfit.image_path or '')
            if not img_path:
                missing_images += 1
                failed += 1
                errors.append(f"OUTFIT {outfit.id}: missing image {outfit.image_path}")
                continue

            try:
                p_name, p_hex, p_rgb, swatches = extract_full_palette(img_path, k=6)
                if not swatches or not p_rgb:
                    raise RuntimeError("Empty palette returned")

                meta['palette_swatches'] = swatches
                meta['extracted_rgb'] = p_rgb
                meta['extracted_color'] = p_name
                meta['extracted_hex'] = p_hex
                if not outfit.primary_color:
                    outfit.primary_color = p_name
                outfit.extra_metadata = meta
                db.session.add(outfit)
                processed += 1

                simple = palette_keyword(p_name) or '—'
                top_colors = ', '.join(f"{s.get('name','?')}({s.get('percentage','?')}%)" for s in swatches[:3])
                print(f"  [{idx:>3}/{total}] ✓ Outfit {outfit.id:>3} | {simple:<7} | {p_name[:18]:<18} | Top: {top_colors}")

                if idx % commit_every == 0:
                    db.session.commit()
                    print(f"      ... committed batch, elapsed {time.time() - batch_start:.1f}s")
            except Exception as e:
                failed += 1
                errors.append(f"OUTFIT {outfit.id} | {outfit.image_path}: {e}")
                print(f"  [{idx:>3}/{total}] ✗ Outfit {outfit.id:>3}: {e}")

        try:
            db.session.commit()
        except Exception as e:
            print(f"⚠️  Final commit error: {e}")
            db.session.rollback()

        elapsed = time.time() - batch_start
        print("=" * 60)
        print(f"✅ Done in {elapsed:.1f}s  ({elapsed / max(1, total):.2f}s / outfit)")
        print(f"   Total outfits:       {total}")
        print(f"   Already indexed:     {already}")
        print(f"   Newly indexed:       {processed}")
        print(f"   Failed:              {failed}")
        print(f"   Missing images:      {missing_images}")

        if errors:
            print("\n❌ Errors encountered:")
            for line in errors[:25]:
                print("   -", line)
            if len(errors) > 25:
                print(f"   (+ {len(errors) - 25} more suppressed)")

        return {
            'total': total,
            'already_indexed': already,
            'newly_indexed': processed,
            'failed': failed,
            'missing_images': missing_images,
        }


if __name__ == '__main__':
    skip = '--no-skip' not in sys.argv
    stats = index_all(skip_existing=skip)
    sys.exit(0 if stats['failed'] == 0 else 1)
