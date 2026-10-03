import os
from app import app
from config.db import db
from models.user import User
from models.outfit import Outfit
from models.like import Like
from models.recommendation import SavedRecommendation
from models.feedback import Feedback
print('🔧 Fixing DB schema...')

with app.app_context():
    # Drop problematic tables and recreate
    db.drop_all()
    print('❌ Dropped old tables')
    
    db.create_all()
    print('✅ Created fresh tables')
    
    # Populate outfits from gallery.json
    import json
    gallery_file = os.path.join(os.path.dirname(__file__), 'gallery.json')
    with open(gallery_file, 'r') as f:
        gallery_data = json.load(f)
    
    for item in gallery_data:
        outfit = Outfit(
            name=item['name'],
            image_path=item['image'],
            occasion=item['occasion'],
            likes=item.get('likes', 0)
        )
        db.session.add(outfit)
    
    db.session.commit()
    print(f'✅ Populated {Outfit.query.count()} outfits')
    
print('🎉 DB fixed! Run: python app.py to restart server')

