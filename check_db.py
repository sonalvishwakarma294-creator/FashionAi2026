
import sqlite3
import os

db_path = 'backend/fashion.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Tables:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cursor.fetchall())
    
    print("\nOutfits (first 5):")
    cursor.execute("SELECT id, name, likes FROM outfits LIMIT 5;")
    print(cursor.fetchall())
    
    print("\nUsers (first 5):")
    cursor.execute("SELECT id, name, email FROM users LIMIT 5;")
    print(cursor.fetchall())
    
    print("\nLikes (all):")
    cursor.execute("SELECT * FROM liked_outfits;")
    print(cursor.fetchall())
    
    conn.close()
