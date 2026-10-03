from app import app
from config.db import db
from models.user import User
with app.app_context():
    admin = User.query.filter_by(email='admin@fashion.ai').first()
    if admin:
        admin.is_admin = True
        admin.role = 'admin'
        db.session.commit()
        print('✅ Admin set: is_admin=True, role=admin')
    else:
        print('❌ Admin user not found')
print('Run: cd "d:/fashion pro/backend" && python set_admin.py')

