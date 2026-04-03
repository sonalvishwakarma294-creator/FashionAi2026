import os
import json
from flask import Flask
from config.db import db, init_db
from models.outfit import Outfit

# Setup Flask app for DB
app = Flask(__name__)
init_db(app)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
GALLERY_JSON = os.path.join(BACKEND_DIR, 'gallery.json')

def populate_gallery():
    with app.app_context():
        if os.path.exists(GALLERY_JSON):
            with open(GALLERY_JSON, 'r') as f:
                data = json.load(f)
            
            valid_occasions = ['Casual', 'Office', 'Party', 'Traditional']
            count_added = 0
            count_updated = 0
            
            for item in data:
                outfit_id = item['id']
                occ = item.get('occasion', 'Casual')
                if occ not in valid_occasions:
                    occ = 'Casual'
                
                existing = Outfit.query.get(outfit_id)
                if existing:
                    # Update
                    existing.name = item['name']
                    existing.image_path = item['image']
                    existing.occasion = occ
                    existing.likes = item.get('likes', 0)
                    existing.is_active = True
                    count_updated += 1
                else:
                    # Create new
                    new_outfit = Outfit(
                        id=outfit_id,
                        name=item['name'],
                        image_path=item['image'],
                        occasion=occ,
                        likes=item.get('likes', 0),
                        is_active=True
                    )
                    db.session.add(new_outfit)
                    count_added += 1
            
            db.session.commit()
            print(f"✅ Populated DB: {count_added} added, {count_updated} updated")
        else:
            print("❌ gallery.json not found")

if __name__ == '__main__':
    populate_gallery()
