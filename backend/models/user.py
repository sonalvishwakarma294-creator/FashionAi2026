from config.db import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    hashed_password = db.Column(db.String(255), nullable=False)
    gender = db.Column(db.Enum('male', 'female', 'other'), default='female')
    member_since = db.Column(db.String(50), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    role = db.Column(db.String(20), default='user') # 'admin' or 'user'
    
    # Location persistence
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_name = db.Column(db.String(200), nullable=True)
    
    # Password recovery
    reset_token = db.Column(db.String(255), nullable=True, unique=True)
    reset_token_expires_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'gender': self.gender,
            'member_since': self.member_since,
            'avatar_url': self.avatar_url,
            'is_admin': self.is_admin,
            'role': self.role
        }
