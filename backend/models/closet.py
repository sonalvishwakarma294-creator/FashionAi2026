from config.db import db
from datetime import datetime

class ClosetItem(db.Model):
    __tablename__ = 'closet_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False) # 'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'
    sub_category = db.Column(db.String(50), nullable=True) # e.g., 't-shirt', 'jeans', 'blazer', 'sneakers'
    color_name = db.Column(db.String(50), nullable=True) # e.g., 'Navy Blue'
    color_hex = db.Column(db.String(10), nullable=True) # e.g., '#000080'
    occasion = db.Column(db.String(50), default='casual') # 'casual', 'office', 'party', 'formal', 'all'
    season = db.Column(db.String(50), default='all-season') # 'summer', 'winter', 'spring', 'fall', 'all-season'
    image_url = db.Column(db.String(500), nullable=False)
    brand = db.Column(db.String(100), nullable=True)
    tags = db.Column(db.String(255), nullable=True) # comma-separated tags
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('closet_items', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'category': self.category,
            'sub_category': self.sub_category,
            'color_name': self.color_name,
            'color_hex': self.color_hex,
            'occasion': self.occasion,
            'season': self.season,
            'image_url': self.image_url,
            'brand': self.brand,
            'tags': self.tags.split(',') if self.tags else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
