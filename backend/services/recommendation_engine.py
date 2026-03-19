from config.db import db
from utils.color_utils import extract_dominant_color, color_similarity
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import cv2

class RecommendationEngine:
    def __init__(self):
        self.db = db

    def get_user_likes(self, user_id):
        conn = self.db.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT outfit_id FROM liked_outfits WHERE user_id = %s", (user_id,))
        likes = [row['outfit_id'] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return likes

    def personalized_recs(self, user_id, limit=20):
        likes = self.get_user_likes(user_id)
        if not likes:
            return self.popular_outfits(limit)
        
        # Simple: outfits liked by similar users + same category/colors
        conn = self.db.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT o.*, COUNT(lo.user_id) as score
            FROM outfits o
            LEFT JOIN liked_outfits lo ON o.id = lo.outfit_id
            WHERE o.occasion IN (SELECT occasion FROM outfits WHERE id IN %s)
            GROUP BY o.id
            ORDER BY score DESC, o.likes DESC
            LIMIT %s
        """, (likes, limit))
        recs = cursor.fetchall()
        cursor.close()
        conn.close()
        return recs

    def popular_outfits(self, limit=20):
        conn = self.db.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM outfit_recs LIMIT %s", (limit,))
        recs = cursor.fetchall()
        cursor.close()
        conn.close()
        return recs

    def color_match_recs(self, color, occasion=None, limit=20):
        conn = self.db.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM outfits WHERE primary_color = %s"
        params = [color]
        if occasion:
            query += " AND occasion = %s"
            params.append(occasion)
        query += " ORDER BY likes DESC LIMIT %s"
        params.append(limit)
        cursor.execute(query, params)
        recs = cursor.fetchall()
        cursor.close()
        conn.close()
        return recs

engine = RecommendationEngine()

