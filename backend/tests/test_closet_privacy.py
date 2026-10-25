from io import BytesIO

import pytest
import app as backend_app
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from PIL import Image

from config.db import db
from models.user import User
from routes import closet as closet_routes
from routes.closet import closet_bp


@pytest.fixture
def closet_context(tmp_path, monkeypatch):
    upload_dir = tmp_path / 'closet'
    monkeypatch.setattr(closet_routes, 'CLOSET_UPLOAD_DIR', str(upload_dir))

    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{tmp_path / 'closet.sqlite'}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY='closet-test-secret-which-is-at-least-32-bytes',
    )
    db.init_app(app)
    JWTManager(app)
    app.register_blueprint(closet_bp)

    with app.app_context():
        db.create_all()
        owner = User(name='Owner', email='owner@example.com', hashed_password='x', member_since='October 2026')
        other = User(name='Other', email='other@example.com', hashed_password='x', member_since='October 2026')
        db.session.add_all([owner, other])
        db.session.commit()
        tokens = {
            'owner': create_access_token(identity=owner.email),
            'other': create_access_token(identity=other.email),
        }

    yield app.test_client(), tokens

    with app.app_context():
        db.drop_all()


def test_uploaded_closet_image_is_private_to_its_owner(closet_context):
    client, tokens = closet_context
    image_file = BytesIO()
    Image.new('RGB', (1, 1), color=(20, 80, 160)).save(image_file, format='PNG')
    image_file.seek(0)
    first_image_bytes = image_file.getvalue()

    response = client.post(
        '/api/closet/items',
        data={
            'name': 'Blue Shirt',
            'category': 'top',
            'image': (image_file, 'shirt.png'),
        },
        headers={'Authorization': f"Bearer {tokens['owner']}"},
    )

    assert response.status_code == 201
    item = response.json['item']
    assert item['image_url'] == f"/api/closet/items/{item['id']}/image"

    owner_items = client.get(
        '/api/closet/items',
        headers={'Authorization': f"Bearer {tokens['owner']}"},
    )
    other_items = client.get(
        '/api/closet/items',
        headers={'Authorization': f"Bearer {tokens['other']}"},
    )
    assert [saved['id'] for saved in owner_items.json['items']] == [item['id']]
    assert other_items.json['items'] == []

    image_url = item['image_url']
    assert client.get(image_url).status_code == 401
    assert client.get(
        image_url,
        headers={'Authorization': f"Bearer {tokens['other']}"},
    ).status_code == 404

    owner_image = client.get(
        image_url,
        headers={'Authorization': f"Bearer {tokens['owner']}"},
    )
    assert owner_image.status_code == 200
    assert owner_image.mimetype == 'image/png'
    assert owner_image.headers['Cache-Control'] == 'private, no-store'
    assert owner_image.data == first_image_bytes

    second_image_file = BytesIO()
    Image.new('RGB', (1, 1), color=(220, 40, 30)).save(second_image_file, format='PNG')
    second_image_file.seek(0)
    second_image_bytes = second_image_file.getvalue()
    second_response = client.post(
        '/api/closet/items',
        data={
            'name': 'Red Shirt',
            'category': 'top',
            'image': (second_image_file, 'shirt.png'),
        },
        headers={'Authorization': f"Bearer {tokens['owner']}"},
    )
    assert second_response.status_code == 201
    second_item = second_response.json['item']
    assert second_item['image_url'] != item['image_url']

    second_image = client.get(
        second_item['image_url'],
        headers={'Authorization': f"Bearer {tokens['owner']}"},
    )
    assert second_image.status_code == 200
    assert second_image.data == second_image_bytes
    assert second_image.data != owner_image.data


def test_closet_images_are_not_served_from_public_image_route(tmp_path, monkeypatch):
    closet_dir = tmp_path / 'closet'
    closet_dir.mkdir()
    (closet_dir / 'private.png').write_bytes(b'private image')
    monkeypatch.setattr(backend_app, 'IMAGES_DIR', str(tmp_path))

    response = backend_app.app.test_client().get('/images/closet/private.png')

    assert response.status_code == 404