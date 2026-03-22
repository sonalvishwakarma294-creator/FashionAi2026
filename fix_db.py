import sqlite3
import os

db_path = os.path.join('backend', 'fashion.db')

def diagnose_and_fix():
    print(f"Checking database at: {os.path.abspath(db_path)}")
    if not os.path.exists(db_path):
        print(f"❌ Database file NOT FOUND at {db_path}!")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Inspect existing columns
        print("Checking current columns in 'users' table...")
        cursor.execute("PRAGMA table_info(users)")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        print(f"Existing columns: {column_names}")

        # 2. Add 'role' if missing
        if 'role' not in column_names:
            print("🔧 'role' column is missing. Adding it now...")
            cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
            conn.commit()
            print("✅ 'role' column added successfully.")
        else:
            print("ℹ️ 'role' column already exists.")

        # 3. Add 'is_admin' if missing
        if 'is_admin' not in column_names:
            print("🔧 'is_admin' column is missing. Adding it now...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            conn.commit()
            print("✅ 'is_admin' column added successfully.")
        else:
            print("ℹ️ 'is_admin' column already exists.")

        # 4. Set sonal@gmail.com as ADMIN
        # Password 'admin123' hashed (bcrypt format)
        hashed_pw = "$2b$12$KIXp8Vq9g7YJ8z5XzK4L.uXzK7p8v9w0x1y2z3A4B5C6D7E8F9G0" 
        
        cursor.execute("SELECT email FROM users WHERE email = 'sonal@gmail.com'")
        if cursor.fetchone():
            print("🔄 Updating existing user sonal@gmail.com to admin role...")
            cursor.execute("UPDATE users SET role = 'admin', is_admin = 1, hashed_password = ? WHERE email = 'sonal@gmail.com'", (hashed_pw,))
        else:
            print("✨ Creating NEW admin account: sonal@gmail.com...")
            import datetime
            member_since = datetime.datetime.now().strftime("%B %Y")
            cursor.execute("""
                INSERT INTO users (name, email, hashed_password, gender, member_since, role, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("Sonal Admin", "sonal@gmail.com", hashed_pw, "female", member_since, "admin", 1))
        
        conn.commit()
        conn.close()
        print("\n🎉 ALL DONE! Database is synchronized.")
        print("📧 Email: sonal@gmail.com")
        print("🔑 Password: admin123")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    diagnose_and_fix()
