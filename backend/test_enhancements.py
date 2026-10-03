import json
from app import app
from config.db import db
from models.user import User
from models.closet import ClosetItem

def test_api():
    with app.test_client() as client:
        print("🔍 Testing /api/closet/items (GET)...")
        res = client.get('/api/closet/items')
        print("Status:", res.status_code)
        print("Response:", res.get_json())
        assert res.status_code == 200

        print("\n🔍 Testing /api/closet/items (POST)...")
        post_res = client.post('/api/closet/items', json={
            'name': 'Test Linen Shirt',
            'category': 'top',
            'occasion': 'casual',
            'season': 'summer',
            'color_name': 'Sky Blue',
            'color_hex': '#78B4F0',
            'image_url': '/images/classic_denim.jpg'
        })
        print("Status:", post_res.status_code)
        item_id = post_res.get_json()['item']['id']
        print("Created item id:", item_id)
        assert post_res.status_code == 201

        print("\n🔍 Testing /api/closet/capsule-generate (POST)...")
        cap_res = client.post('/api/closet/capsule-generate', json={'occasion': 'all'})
        print("Status:", cap_res.status_code)
        print("Combinations generated:", cap_res.get_json().get('total_combinations', 0))
        assert cap_res.status_code == 200

        print("\n🔍 Testing /api/search/semantic (GET)...")
        search_res = client.get('/api/search/semantic?q=casual')
        print("Status:", search_res.status_code)
        print("Search results count:", len(search_res.get_json().get('results', [])))
        assert search_res.status_code == 200

        # Clean up test item
        del_res = client.delete(f'/api/closet/items/{item_id}')
        print("Deleted test item status:", del_res.status_code)

        print("\n✅ All enhancement API endpoints passed tests successfully!")

if __name__ == '__main__':
    test_api()
