"""
seed_gallery.py - Seed the Outfit table from local image folders.
Run once: python seed_gallery.py
Safe to re-run: skips already-seeded paths.
"""
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, "images")

from dotenv import load_dotenv
load_dotenv()
from app import app
from config.db import db
from models.outfit import Outfit

FOLDER_META = {
    "casual": {
        "occasion": "Casual", "category": "Casual Outfit",
        "colors": ["Navy Blue", "White", "Grey", "Beige", "Olive", "Denim Blue", "Coral", "Mint Green", "Light Pink", "Terracotta", "Slate"],
    },
    "party": {
        "occasion": "Party", "category": "Party Outfit",
        "colors": ["Black", "Gold", "Burgundy", "Emerald", "Royal Blue", "Hot Pink", "Silver", "Deep Plum", "Champagne", "Ruby Red"],
    },
    "office": {
        "occasion": "Office", "category": "Office Outfit",
        "colors": ["Charcoal", "Navy", "White", "Light Grey", "Taupe", "Powder Blue", "Blush Pink", "Camel", "Slate Blue", "Sage"],
    },
    "fashionrec": {
        "occasion": "Casual", "category": "Fashion Pick",
        "colors": ["Multicolor", "Warm Neutral", "Cool Neutral", "Pastel", "Earth Tone", "Vibrant", "Monochrome"],
    },
}

ROOT_IMAGES = {
    "g.jpg":             ("Traditional", "Traditional Outfit", "Ivory"),
    "g1.jpg":            ("Traditional", "Traditional Outfit", "Gold and Red"),
    "g2.jpg":            ("Traditional", "Traditional Outfit", "Maroon"),
    "g3.png":            ("Traditional", "Traditional Outfit", "Teal and Gold"),
    "img.jpg":           ("Casual",      "Casual Outfit",      "White"),
    "img2.jpg":          ("Office",      "Office Outfit",      "Navy"),
    "img3.jpg":          ("Party",       "Party Outfit",       "Black"),
    "img4.jpg":          ("Casual",      "Casual Outfit",      "Denim Blue"),
    "img6.jpg":          ("Office",      "Office Outfit",      "Charcoal"),
    "img7.jpg":          ("Party",       "Party Outfit",       "Emerald"),
    "m.png":             ("Casual",      "Mens Casual",        "Grey"),
    "m2.png":            ("Office",      "Mens Office",        "Navy"),
    "m3.png":            ("Party",       "Mens Party",         "Black"),
    "classic_denim.jpg": ("Casual",      "Casual Outfit",      "Indigo"),
    "black shirt.jpg":   ("Casual",      "Casual Outfit",      "Black"),
    "pink t-shirt.jpg":  ("Casual",      "Casual Outfit",      "Pink"),
    "dress.jpg":         ("Party",       "Party Outfit",       "Red"),
    "summer_dress.jpg":  ("Casual",      "Casual Outfit",      "Floral"),
}

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MIN_SIZE = 2000

def nice_name(folder, filename):
    stem = os.path.splitext(filename)[0]
    return "{} {}".format(folder.capitalize(), stem.upper())

def seed():
    seeded = skipped = 0

    for folder, meta in FOLDER_META.items():
        folder_path = os.path.join(IMAGES_DIR, folder)
        if not os.path.isdir(folder_path):
            print("  [skip] folder not found: {}".format(folder_path))
            continue
        colors = meta["colors"]
        for idx, fname in enumerate(sorted(os.listdir(folder_path))):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ALLOWED_EXT:
                continue
            full = os.path.join(folder_path, fname)
            if os.path.getsize(full) < MIN_SIZE:
                print("  [skip] tiny: {}".format(fname))
                continue
            rel_path = "/images/{}/{}".format(folder, fname)
            if Outfit.query.filter_by(image_path=rel_path).first():
                skipped += 1
                continue
            color = colors[idx % len(colors)]
            o = Outfit(
                name=nice_name(folder, fname),
                image_path=rel_path,
                occasion=meta["occasion"],
                category=meta["category"],
                primary_color=color,
                likes=0, views=0, is_active=True,
            )
            db.session.add(o)
            seeded += 1

    trad_path = os.path.join(IMAGES_DIR, "office", "traditional")
    if os.path.isdir(trad_path):
        trad_colors = ["Ivory", "Gold and Red", "Maroon", "Teal", "Vermilion", "Peacock Blue", "Saffron", "Deep Rose", "Jade Green"]
        for idx, fname in enumerate(sorted(os.listdir(trad_path))):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ALLOWED_EXT:
                continue
            full = os.path.join(trad_path, fname)
            if os.path.getsize(full) < MIN_SIZE:
                continue
            rel_path = "/images/office/traditional/{}".format(fname)
            if Outfit.query.filter_by(image_path=rel_path).first():
                skipped += 1
                continue
            o = Outfit(
                name=nice_name("traditional", fname),
                image_path=rel_path,
                occasion="Traditional",
                category="Traditional Outfit",
                primary_color=trad_colors[idx % len(trad_colors)],
                likes=0, views=0, is_active=True,
            )
            db.session.add(o)
            seeded += 1

    for fname, (occasion, category, color) in ROOT_IMAGES.items():
        rel_path = "/images/{}".format(fname)
        full = os.path.join(IMAGES_DIR, fname)
        if not os.path.isfile(full) or os.path.getsize(full) < MIN_SIZE:
            continue
        if Outfit.query.filter_by(image_path=rel_path).first():
            skipped += 1
            continue
        o = Outfit(
            name=os.path.splitext(fname)[0].replace("_", " ").replace("-", " ").title(),
            image_path=rel_path,
            occasion=occasion,
            category=category,
            primary_color=color,
            likes=0, views=0, is_active=True,
        )
        db.session.add(o)
        seeded += 1

    db.session.commit()
    print("\nSeeding complete - added {} outfits, skipped {} already-present.".format(seeded, skipped))

if __name__ == "__main__":
    with app.app_context():
        seed()
