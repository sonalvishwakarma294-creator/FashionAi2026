from config.db import db
from datetime import datetime

class Outfit(db.Model):
    __tablename__ = 'outfits'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    image_path = db.Column(db.String(500), nullable=False)
    occasion = db.Column(db.Enum('Casual', 'Office', 'Party', 'Traditional'), nullable=False)
    category = db.Column(db.String(100))
    primary_color = db.Column(db.String(50))
    likes = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    extra_metadata = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'image': self.image_path,
            'occasion': self.occasion,
            'category': self.category,
            'primary_color': self.primary_color,
            'likes': self.likes,
            'views': self.views,
            'is_active': self.is_active,
            'metadata': self.extra_metadata
        }
