"""Add password recovery columns (reset_token, reset_token_expires_at)
to existing users table if not present. Safe idempotent ALTER TABLEs.
"""
import os, sys
os.chdir(r'd:\fashion pro\backend')
sys.path.insert(0, r'd:\fashion pro\backend')

from app import app
from config.db import db

with app.app_context():
    print("🔧 Adding password recovery columns to users table...")
    from sqlalchemy import text
    cols = [r[0].lower() for r in db.session.execute(text("SHOW COLUMNS FROM users")).fetchall()]

    if 'reset_token' not in cols:
        db.session.execute(text(
            "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL"
        ))
        print("   ✅ Added reset_token column")
    else:
        print("   ⏭️  reset_token already exists")

    if 'reset_token_expires_at' not in cols:
        db.session.execute(text(
            "ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME NULL"
        ))
        print("   ✅ Added reset_token_expires_at column")
    else:
        print("   ⏭️  reset_token_expires_at already exists")

    try:
        db.session.execute(text(
            "ALTER TABLE users ADD CONSTRAINT uq_users_reset_token UNIQUE (reset_token)"
        ))
        print("   ✅ Added UNIQUE index on reset_token")
    except Exception as _:
        print("   ⏭️  UNIQUE index already present")

    db.session.commit()

    final_cols = [r[0].lower() for r in db.session.execute(text("SHOW COLUMNS FROM users")).fetchall()]
    print("\n✅ Final users schema:")
    for c in final_cols:
        print("   -", c)
    assert 'reset_token' in final_cols
    assert 'reset_token_expires_at' in final_cols
    print("\n🎉 Password recovery columns ready!")
