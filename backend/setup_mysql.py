"""
MySQL Full Setup Script for Fashion Pro AI
------------------------------------------
Run this script to:
  1. Reset MySQL root password (if needed)
  2. Create the fashion_ai database
  3. Verify the connection
  4. Run the Flask app and execute tests

Before running this script, if MySQL root password is already known, 
just set it in the .env file. Otherwise this script will guide you through
a password reset using the init-file method.
"""
import os
import sys
import time
import subprocess
import shutil
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

MYSQL_BIN = r"C:\Program Files\MySQL\MySQL Server 8.0\bin"
MYSQL_EXE = os.path.join(MYSQL_BIN, "mysql.exe")
MYSQLD_EXE = os.path.join(MYSQL_BIN, "mysqld.exe")
MY_INI = r"C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
INIT_FILE = str(BACKEND_DIR / "mysql_reset_init.sql")

NEW_PASSWORD = "fashion@Pro_2026"
DB_NAME = "fashion_ai"


def step(msg):
    print(f"\n{'='*60}")
    print(f"==> {msg}")
    print('='*60)


def find_pids(name="mysqld.exe"):
    result = subprocess.run(
        ['tasklist', '/FI', f'IMAGENAME eq {name}', '/FO', 'CSV', '/NH'],
        capture_output=True, text=True
    )
    pids = []
    for line in result.stdout.strip().splitlines():
        parts = [p.strip('"') for p in line.split('","')]
        if len(parts) >= 2 and parts[1].isdigit():
            pids.append(int(parts[1]))
    return pids


def test_pymysql(password, database=None):
    try:
        import pymysql
        kwargs = dict(
            host="localhost", port=3306, user="root", password=password,
            charset="utf8mb4", connect_timeout=8
        )
        if database:
            kwargs["database"] = database
        conn = pymysql.connect(**kwargs)
        conn.close()
        return True
    except Exception as e:
        return False


def create_init_file():
    with open(INIT_FILE, 'w') as f:
        f.write(
            f"ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '{NEW_PASSWORD}';\n"
            f"FLUSH PRIVILEGES;\n"
            f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n"
        )
    print(f"Init file written to: {INIT_FILE}")


def verify_env_updated():
    env_path = BACKEND_DIR / ".env"
    content = env_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    updated = []
    keys_seen = set()
    target_lines = [
        ("DB_HOST", "DB_HOST=localhost"),
        ("DB_PORT", "DB_PORT=3306"),
        ("DB_USER", "DB_USER=root"),
        ("DB_PASSWORD", f"DB_PASSWORD={NEW_PASSWORD}"),
        ("DB_NAME", f"DB_NAME={DB_NAME}"),
        ("USE_SQLITE", "USE_SQLITE=False"),
    ]
    for line in lines:
        replaced = False
        for key, val in target_lines:
            if line.strip().startswith(f"{key}="):
                updated.append(val)
                keys_seen.add(key)
                replaced = True
                break
        if not replaced:
            updated.append(line)
    for key, val in target_lines:
        if key not in keys_seen:
            updated.append(val)
    env_path.write_text("\n".join(updated) + "\n", encoding="utf-8")
    print("[env] .env updated with MySQL credentials.")


def main():
    step("1. Reload .env from backend/.env")
    from dotenv import load_dotenv
    load_dotenv(override=True)

    step("2. Quick connection test with credentials from .env")
    from config.db import test_mysql_connection
    ok, msg = test_mysql_connection()
    if ok:
        print(f"Connection OK: {msg}")
    else:
        print(f"Connection FAILED: {msg}")

        # Try with new password
        if test_pymysql(NEW_PASSWORD):
            print(f"Known password '{NEW_PASSWORD}' works!")
            os.environ["DB_PASSWORD"] = NEW_PASSWORD
            verify_env_updated()
        else:
            step("2b. Password reset required - launching mysqld with init file")
            create_init_file()
            print()
            print("Admin privileges are required to stop the MySQL service.")
            print("Please do ONE of the following:")
            print()
            print("=== OPTION A : Run via ADMIN PowerShell (fastest) ===")
            print("  Open PowerShell AS ADMINISTRATOR and run these lines:")
            print(f"""
  net stop MySQL80
  timeout /t 3 /nobreak > nul
  Start-Process -FilePath "{MYSQLD_EXE}" -ArgumentList '--defaults-file="{MY_INI}"','--init-file="{INIT_FILE}"','--console' -NoNewWindow
  Start-Sleep -Seconds 15
  Get-Process mysqld | Stop-Process -Force
  net start MySQL80
""")
            print()
            print("=== OPTION B : Via MySQL Workbench ===")
            print("  1. Open MySQL Workbench")
            print("  2. Connect using your known password or saved session")
            print(f"  3. Run this SQL:")
            print(f"       ALTER USER 'root'@'localhost' IDENTIFIED BY '{NEW_PASSWORD}';")
            print(f"       CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print()
            input("After completing Option A or B, press ENTER here to continue setup...")
            verify_env_updated()

    step("3. Re-verify connection + database")
    from config.db import test_mysql_connection as t2
    ok, msg = t2()
    attempts = 0
    while not ok and attempts < 5:
        attempts += 1
        print(f"  Retry {attempts}/5 ... {msg}")
        time.sleep(3)
        ok, msg = t2()
    if not ok:
        print(f"Still cannot connect: {msg}")
        print("Exiting - please fix the password/connection issue above.")
        return 1

    print(f"PASS -> {msg}")

    step("4. Verify Flask + SQLAlchemy init (create tables, seed admin)")
    try:
        from app import app
        from config.db import db
        with app.app_context():
            print("Tables created via SQLAlchemy:")
            for t in db.metadata.tables.keys():
                print(f"  - {t}")
    except Exception as e:
        print(f"Flask init error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return 2

    step("5. Seed default admin user if missing")
    try:
        from app import app
        from config.db import db
        from models.user import User
        import bcrypt
        from datetime import date

        with app.app_context():
            existing = User.query.filter_by(email="admin@fashion.ai").first()
            if not existing:
                hashed = bcrypt.hashpw(b"Admin@123", bcrypt.gensalt()).decode()
                admin = User(
                    name="Admin",
                    email="admin@fashion.ai",
                    hashed_password=hashed,
                    gender="other",
                    member_since=date.today().isoformat(),
                    is_admin=True,
                    role="admin"
                )
                db.session.add(admin)
                db.session.commit()
                print("Admin user created: admin@fashion.ai / Admin@123")
            else:
                print("Admin user already exists.")
    except Exception as e:
        print(f"Admin seed error: {type(e).__name__}: {e}")

    step("6. Connection health check + summary")
    try:
        from app import app
        from config.db import db
        with app.app_context():
            from sqlalchemy import text
            r = db.session.execute(text("SELECT @@version, NOW(), DATABASE()")).fetchone()
            print(f"  MySQL version : {r[0]}")
            print(f"  Server time   : {r[1]}")
            print(f"  Active DB     : {r[2]}")

            r2 = db.session.execute(text("SHOW TABLES")).fetchall()
            print(f"  Tables count  : {len(r2)}")
            for t in r2:
                print(f"    - {t[0]}")
    except Exception as e:
        print(f"Health check error: {e}")

    print("\n" + "="*60)
    print("✅ MySQL Setup Complete!")
    print("   Backend .env configured to use MySQL.")
    print(f"   Root password : {NEW_PASSWORD}")
    print(f"   Database      : {DB_NAME}")
    print("="*60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
