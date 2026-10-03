import os
import sqlite3
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_PATH = os.path.join('backend', 'fashion.db')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD')

if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    raise ValueError('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the .env file')


def seed_admin():
    print(f"🔧 Seeding admin user {ADMIN_EMAIL} into {DB_PATH}")
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database file not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure required columns exist (role, is_admin)
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'role' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
    if 'is_admin' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
    conn.commit()

    # Generate bcrypt hash for the password
    hashed_pw = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Upsert admin user
    cursor.execute("SELECT id FROM users WHERE email = ?", (ADMIN_EMAIL,))
    if cursor.fetchone():
        cursor.execute(
            "UPDATE users SET role = 'admin', is_admin = 1, hashed_password = ? WHERE email = ?",
            (hashed_pw, ADMIN_EMAIL)
        )
        print('✅ Updated existing admin user')
    else:
        cursor.execute(
            "INSERT INTO users (name, email, hashed_password, gender, member_since, role, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ('Admin', ADMIN_EMAIL, hashed_pw, 'unspecified', 'N/A', 'admin', 1)
        )
        print('✅ Created new admin user')
    conn.commit()
    conn.close()
    print('🎉 Admin seeding complete')

if __name__ == '__main__':
    seed_admin()
