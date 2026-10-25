import os
import sys
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

db = SQLAlchemy()

def build_mysql_uri():
    """Build properly escaped MySQL connection URI."""
    db_user = os.getenv('DB_USER', 'root')
    db_pass = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '3306')
    db_name = os.getenv('DB_NAME', 'fashion_ai')

    from urllib.parse import quote_plus
    user = quote_plus(db_user)
    pwd = quote_plus(db_pass)
    host = quote_plus(db_host)

    return f'mysql+pymysql://{user}:{pwd}@{host}:{db_port}/{db_name}?charset=utf8mb4'


def test_mysql_connection():
    """Quick standalone test of MySQL connection WITHOUT SQLAlchemy/flask.
    Returns (ok: bool, message: str).
    """
    try:
        import pymysql
    except ImportError:
        return False, "PyMySQL not installed. Run: pip install PyMySQL"

    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '3306')),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'fashion_ai'),
            charset='utf8mb4',
            connect_timeout=10,
            read_timeout=10,
            write_timeout=10,
        )
        version = conn.server_version
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        conn.close()
        return True, f"MySQL {'.'.join(map(str, version))} connected OK."
    except pymysql.err.OperationalError as e:
        code = e.args[0] if e.args else -1
        if code == 1049:  # unknown database
            return False, f"Database '{os.getenv('DB_NAME','fashion_ai')}' does not exist yet. Will be created automatically."
        if code == 1045:
            return False, "Access denied. Wrong DB_USER/DB_PASSWORD in .env"
        if code in (2003, 2002):
            return False, "Cannot connect to MySQL server. Is it running on DB_HOST:DB_PORT?"
        return False, f"Operational error {code}: {e}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def init_db(app):
    """Initializes database with robust MySQL-first logic."""
    use_sqlite = os.getenv('USE_SQLITE', 'False').strip().lower() in ('1', 'true', 'yes', 'on')

    if use_sqlite:
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
        print(f"[DB] Using SQLite at: {db_path}")
    else:
        db_url = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')
        if db_url:
            if db_url.startswith('mysql://'):
                db_url = db_url.replace('mysql://', 'mysql+pymysql://', 1)
            elif db_url.startswith('postgres://'):
                db_url = db_url.replace('postgres://', 'postgresql://', 1)
            app.config['SQLALCHEMY_DATABASE_URI'] = db_url
            print(f"[DB] Using DATABASE_URL / MYSQL_URL connection string.")
        else:
            uri = build_mysql_uri()
            print(f"[DB] Configuring MySQL -> host={os.getenv('DB_HOST')} db={os.getenv('DB_NAME')}")

        ok, msg = test_mysql_connection()
        if ok:
            print(f"[DB] {msg}")
            app.config['SQLALCHEMY_DATABASE_URI'] = uri
        else:
            # Database missing is OK - we can create it below
            if "does not exist yet" in msg:
                print(f"[DB] Notice: {msg}")
                # Try connecting without database so we can CREATE DATABASE
                try:
                    import pymysql
                    conn = pymysql.connect(
                        host=os.getenv('DB_HOST', 'localhost'),
                        port=int(os.getenv('DB_PORT', '3306')),
                        user=os.getenv('DB_USER', 'root'),
                        password=os.getenv('DB_PASSWORD', ''),
                        charset='utf8mb4',
                        connect_timeout=10,
                    )
                    with conn.cursor() as cur:
                        db_name = os.getenv('DB_NAME', 'fashion_ai')
                        cur.execute(
                            f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                        )
                        print(f"[DB] Created database '{db_name}'.")
                    conn.close()
                    app.config['SQLALCHEMY_DATABASE_URI'] = uri
                except Exception as ce:
                    print(f"[DB] Cannot auto-create DB: {ce}. Falling back to SQLite.")
                    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
                    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
                    print(f"[DB] Fallback SQLite: {db_path}")
            else:
                print(f"[DB] MySQL unavailable: {msg}")
                print(f"[DB] Falling back to local SQLite for now.")
                db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fashion.db')
                app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
                print(f"[DB] Fallback SQLite: {db_path}")

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_size': 10,
        'max_overflow': 20,
        'connect_args': {'connect_timeout': 15} if 'sqlite' not in app.config['SQLALCHEMY_DATABASE_URI'] else {},
    }
    db.init_app(app)

    with app.app_context():
        try:
            db.create_all()
            print("[DB] Tables initialized / verified.")
            try:
                from models.closet import ensure_closet_schema
                ensure_closet_schema()
            except Exception as e:
                print(f"[DB] Closet schema check warning: {e}")
        except Exception as e:
            print(f"[DB] create_all failed: {type(e).__name__}: {e}")
            print("[DB] Check credentials, permissions and MySQL server status.")

