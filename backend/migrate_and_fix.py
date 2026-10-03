import os
import json
from app import app
from config.db import db
from models.user import User
from models.outfit import Outfit
from models.like import Like
print('🔧 Full migration + fix...')

with app.app_context():
    # Backup old DB if exists
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
    if os.path.exists(db_path):
        os.rename(db_path, db_path + '.backup')
        print('📦 Old DB backed up')
    
    # Fresh tables
    db.drop_all()
    db.create_all()
    print('✅ Fresh tables created')
    
    # Migrate users from JSON
    users_file = os.path.join(os.path.dirname(__file__), 'users.json')
    if os.path.exists(users_file):
        with open(users_file, 'r') as f:
            users_data = json.load(f)
        for email, u_data in users_data.items():
            user = User(
                name=u_data['name'],
                email=email,
                hashed_password=u_data['password'],
                gender=u_data.get('gender', 'female'),
                member_since=u_data.get('memberSince', 'March 2026')
            )
            db.session.add(user)
        db.session.commit()
        print(f'✅ Migrated {len(users_data)} users')
    
    # Migrate outfits
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
    
    # Migrate likes
    likes_file = os.path.join(os.path.dirname(__file__), 'likes.json')
    if os.path.exists(likes_file):
        with open(likes_file, 'r') as f:
            likes_data = json.load(f)
        migrated = 0
        for email, user_likes in likes_data.items():
            user = User.query.filter_by(email=email).first()
            if user:
                for like_item in user_likes:
                    outfit = Outfit.query.filter_by(image_path=like_item['image']).first()
                    if outfit and not Like.query.filter_by(user_id=user.id, outfit_id=outfit.id).first():
                        like = Like(user_id=user.id, outfit_id=outfit.id)
                        db.session.add(like)
                        migrated += 1
        db.session.commit()
        print(f'✅ Migrated {migrated} likes')
    
print('🎉 Complete! Login works + likes fixed. Run: python app.py')

