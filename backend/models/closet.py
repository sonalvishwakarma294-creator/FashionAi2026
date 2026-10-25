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
    secondary_color_name = db.Column(db.String(50), nullable=True)
    pattern = db.Column(db.String(50), nullable=True, default='solid') # 'solid', 'striped', 'checkered', 'floral', 'printed'
    style = db.Column(db.String(50), nullable=True, default='casual') # 'minimal', 'streetwear', 'formal', 'sporty', ...
    occasion = db.Column(db.String(50), default='casual') # 'casual', 'office', 'party', 'formal', 'all'
    season = db.Column(db.String(50), default='all-season') # 'summer', 'winter', 'spring', 'fall', 'all-season'
    is_available = db.Column(db.Boolean, nullable=False, default=True)
    image_url = db.Column(db.String(500), nullable=False)
    brand = db.Column(db.String(100), nullable=True)
    tags = db.Column(db.String(255), nullable=True) # comma-separated tags
    notes = db.Column(db.Text, nullable=True)

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
            'primary_color': self.color_name,
            'color_hex': self.color_hex,
            'secondary_color_name': self.secondary_color_name,
            'pattern': self.pattern,
            'style': self.style,
            'occasion': self.occasion,
            'season': self.season,
            'is_available': bool(self.is_available) if self.is_available is not None else True,
            'availability': bool(self.is_available) if self.is_available is not None else True,
            'image_url': self.image_url,
            'brand': self.brand,
            'tags': self.tags.split(',') if self.tags else [],
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'clothing_type': self.sub_category,
        }


def ensure_closet_schema():
    """Idempotent migration: add any missing closet_items columns to an
    existing database (SQLite or MySQL). Safe to call on every startup."""
    from sqlalchemy import text, inspect
    from config.db import db as _db

    try:
        inspector = inspect(_db.engine)
        if 'closet_items' not in inspector.get_table_names():
            return  # create_all already handles fresh installs
        existing = {c['name'] for c in inspector.get_columns('closet_items')}
        additions = [
            ('secondary_color_name', "VARCHAR(50) NULL"),
            ('pattern', "VARCHAR(50) NULL DEFAULT 'solid'"),
            ('style', "VARCHAR(50) NULL DEFAULT 'casual'"),
            ('is_available', "BOOLEAN NULL DEFAULT 1"),
            ('notes', "TEXT NULL"),
        ]
        added = []
        for col, col_type in additions:
            if col not in existing:
                _db.session.execute(text(f"ALTER TABLE closet_items ADD COLUMN {col} {col_type}"))
                added.append(col)
        if added:
            _db.session.commit()
            _db.session.execute(text("UPDATE closet_items SET is_available = 1 WHERE is_available IS NULL"))
            _db.session.execute(text("UPDATE closet_items SET pattern = 'solid' WHERE pattern IS NULL"))
            _db.session.execute(text("UPDATE closet_items SET style = 'casual' WHERE style IS NULL"))
            _db.session.commit()
            print(f"[DB] closet_items columns added: {', '.join(added)}")
    except Exception as exc:
        _db.session.rollback()
        print(f"[DB] closet_items schema migration warning: {exc}")
