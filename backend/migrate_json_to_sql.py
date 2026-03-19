import json
import os
import bcrypt
from datetime import datetime
from app import app
from config.db import db
from models.user import User
from models.outfit import Outfit
from models.like import Like
from models.recommendation import SavedRecommendation

def migrate():
    with app.app_context():
        # Get the directory where this script is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 1. Create tables
        db.drop_all()
        db.create_all()
        print("✅ Database tables created.")

        # 2. Migrate Users
        users_file = os.path.join(current_dir, 'users.json')
        if os.path.exists(users_file):
            with open(users_file, 'r') as f:
                users_data = json.load(f)
                for email, u in users_data.items():
                    if not User.query.filter_by(email=email).first():
                        # Handle plain text vs hashed passwords
                        pwd = u['password']
                        if not pwd.startswith('$2b$'):
                            pwd = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                        
                        new_user = User(
                            name=u['name'],
                            email=email,
                            hashed_password=pwd,
                            gender=u.get('gender', 'female'),
                            member_since=u.get('memberSince', datetime.now().strftime("%B %Y"))
                        )
                        db.session.add(new_user)
            print("✅ Users migrated.")

        # 3. Migrate Outfits (Gallery)
        gallery_file = os.path.join(current_dir, 'gallery.json')
        if os.path.exists(gallery_file):
            with open(gallery_file, 'r') as f:
                gallery_data = json.load(f)
                for item in gallery_data:
                    if not Outfit.query.filter_by(image_path=item['image']).first():
                        new_outfit = Outfit(
                            name=item['name'],
                            image_path=item['image'],
                            occasion=item['occasion'],
                            likes=item.get('likes', 0)
                        )
                        db.session.add(new_outfit)
            print("✅ Gallery migrated.")

        # 4. Migrate Likes
        likes_file = os.path.join(current_dir, 'likes.json')
        if os.path.exists(likes_file):
            with open(likes_file, 'r') as f:
                likes_data = json.load(f)
                for email, user_likes in likes_data.items():
                    user = User.query.filter_by(email=email).first()
                    if user:
                        for outfit_item in user_likes:
                            outfit = Outfit.query.filter_by(image_path=outfit_item['image']).first()
                            if outfit:
                                if not Like.query.filter_by(user_id=user.id, outfit_id=outfit.id).first():
                                    new_like = Like(user_id=user.id, outfit_id=outfit.id)
                                    db.session.add(new_like)
            print("✅ Likes migrated.")

        # 5. Migrate Saved Recommendations
        saved_file = os.path.join(current_dir, 'saved_recommendations.json')
        if os.path.exists(saved_file):
            with open(saved_file, 'r') as f:
                saved_data = json.load(f)
                for email, user_recs in saved_data.items():
                    user = User.query.filter_by(email=email).first()
                    if user:
                        for rec in user_recs:
                            new_rec = SavedRecommendation(
                                user_id=user.id,
                                rec_type=rec.get('type', 'general'),
                                rec_data=rec
                            )
                            db.session.add(new_rec)
            print("✅ Saved recommendations migrated.")

        db.session.commit()
        print("🚀 All data migrated successfully!")

if __name__ == '__main__':
    migrate()
