import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

# Global database object
db = SQLAlchemy()

def init_db(app):
    """Initializes the database connection with SQLAlchemy (SQLite fallback)."""
    db_user = os.getenv('DB_USER', 'root')
    db_pass = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_name = os.getenv('DB_NAME', 'fashion_ai')
    
    # Check if we should use MySQL or SQLite
    # Default to SQLite if MySQL fails or is not configured for local dev
    try:
        # We'll set a short timeout for the initial connection check if possible, 
        # but SQLAlchemy doesn't easily do that here. 
        # Instead, we'll provide a clear way to force SQLite via ENV
        use_sqlite = os.getenv('USE_SQLITE', 'True').lower() == 'true'
        
        if use_sqlite:
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
            print(f"[DB] Using local SQLite database at: {db_path}")
        else:
            app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}'
            print(f"[DB] Attempting MySQL connection to {db_host}")
            
    except Exception as e:
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
        print(f"[DB] Database config error, falling back to SQLite: {e}")
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        try:
            db.create_all()
            print("[DB] Database tables initialized.")
        except Exception as e:
            print(f"[DB] Could not create tables: {e}")
