import os
from app import app
from config.db import db
from models.user import User
from models.outfit import Outfit
from models.like import Like
print('✅ All imports OK')

with app.app_context():
    db.create_all()
    print('✅ Tables created')
    
    # Check if fashion.db exists
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
    print(f'DB path: {db_path}')
    print(f'DB exists: {os.path.exists(db_path)}')
    
    # Test user
    u = User.query.first()
    print(f'Users in DB: {User.query.count()}')
    
    # Test outfits
    print(f'Outfits in DB: {Outfit.query.count()}')
    
    print('🔧 Run: python backend/debug.py')

