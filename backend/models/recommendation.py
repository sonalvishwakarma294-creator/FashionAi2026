from config.db import db
from datetime import datetime

class SavedRecommendation(db.Model):
    __tablename__ = 'user_recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    rec_type = db.Column(db.String(50))
    rec_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'rec_type': self.rec_type,
            'rec_data': self.rec_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
