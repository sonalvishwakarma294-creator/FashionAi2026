from app import app
from config.db import db
from models.user import User
print('Current DB users:')
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"Email: {u.email}, Name: {u.name}, Password preview: {u.hashed_password[:20]}...")
        print(f"  ID: {u.id}, is_admin: {u.is_admin}")

