from config.db import db
from datetime import datetime

class Like(db.Model):
    __tablename__ = 'liked_outfits'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    outfit_id = db.Column(db.Integer, db.ForeignKey('outfits.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'outfit_id', name='unique_like'),)
