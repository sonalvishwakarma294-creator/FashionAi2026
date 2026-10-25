"""Quick Database Check - Fashion AI"""
import os, sys
BACKEND = r'd:\fashion pro\backend'
os.chdir(BACKEND)
sys.path.insert(0, BACKEND)

from dotenv import load_dotenv
load_dotenv(override=True)

print("=" * 62)
print("          🔍 FASHION AI DATABASE LIVE CHECK REPORT")
print("=" * 62)

# Step 1: Raw MySQL ping
import pymysql
try:
    conn = pymysql.connect(
        host=os.getenv('DB_HOST','localhost'),
        port=int(os.getenv('DB_PORT','3306')),
        user=os.getenv('DB_USER','root'),
        password=os.getenv('DB_PASSWORD',''),
        charset='utf8mb4', connect_timeout=8
    )
    version = conn.server_version
    print("\n✅ MySQL Server            CONNECTED (v%s)" % '.'.join(map(str, version)))
    print("   Host/Port              : %s:%s" % (os.getenv('DB_HOST','localhost'), os.getenv('DB_PORT','3306')))
    print("   User                   : %s" % os.getenv('DB_USER','root'))
    print("   Database               : %s" % os.getenv('DB_NAME','fashion_ai'))
    conn.close()
except Exception as e:
    print("\n❌ MySQL Connection FAILED:", e)
    sys.exit(1)

# Step 2: Flask + SQLAlchemy layer
print()
print("-" * 62)
print("   🐍 Flask + SQLAlchemy Check")
print("-" * 62)
from app import app
from config.db import db
with app.app_context():
    from sqlalchemy import text
    info = db.session.execute(text("""
        SELECT @@version, NOW(), DATABASE(), USER(), @@port,
               @@character_set_server, @@collation_server
    """)).fetchone()
    print("   Engine Version         :", info[0])
    print("   Server Timestamp       :", info[1])
    print("   Active Schema          :", info[2])
    print("   Current Connection As  :", info[3])
    print("   Port                   :", info[4])
    print("   Charset / Collation    :", info[5], "/", info[6])

    # Tables + Row counts
    print()
    print("-" * 62)
    print("   📊 Table Row Counts")
    print("-" * 62)
    rows = db.session.execute(text("""
        SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME, TABLE_COLLATION
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
    """)).fetchall()

    print("   %-26s %10s  %-19s  %s" % ("TABLE", "ROWS", "CREATED", "COLLATION"))
    print("   " + "-"*58)
    total_rows = 0
    for r in rows:
        tname = r[0]
        # Exact count for accuracy
        cnt = db.session.execute(text("SELECT COUNT(*) FROM `%s`" % tname)).fetchone()[0]
        total_rows += cnt
        print("   %-26s %10s  %-19s  %s" % (
            tname, f"{cnt:,}", (str(r[2])[:19] if r[2] else '-'), r[3] or ''
        ))
    print("   " + "-"*58)
    print("   %-26s %10s" % ("TOTAL ROWS:", f"{total_rows:,}"))

    # Outfit summary
    print()
    print("-" * 62)
    print("   👗 Outfits by Occasion")
    print("-" * 62)
    occ = db.session.execute(text("""
        SELECT occasion, COUNT(*), SUM(likes), ROUND(AVG(likes),0)
        FROM outfits GROUP BY occasion ORDER BY COUNT(*) DESC
    """)).fetchall()
    print("   %-14s %10s %14s %10s" % ("OCCASION", "COUNT", "TOTAL_LIKES", "AVG_LIKES"))
    print("   " + "-"*52)
    for o in occ:
        print("   %-14s %10s %14s %10s" % (
            o[0], f"{o[1]:,}", f"{o[2] or 0:,}", f"{o[3] or 0:,}"
        ))

    # Users sample
    print()
    print("-" * 62)
    print("   👥 Users (up to 5)")
    print("-" * 62)
    from models.user import User
    users = User.query.limit(5).all()
    if users:
        print("   %-3s  %-20s  %-28s  %-8s  %s" % ("ID","NAME","EMAIL","ADMIN","ROLE"))
        print("   " + "-"*72)
        for u in users:
            print("   %-3s  %-20s  %-28s  %-8s  %s" % (
                u.id, (u.name or '')[:20], (u.email or '')[:28],
                'YES' if u.is_admin else 'no', u.role
            ))
    else:
        print("   (no users yet)")

print()
print("=" * 62)
print("   ✅ DATABASE CHECK COMPLETE — Everything looks healthy!")
print("=" * 62)
