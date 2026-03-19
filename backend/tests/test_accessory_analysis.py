import pytest
import os
import io

def test_analyze_accessory_no_image(client):
    """Test that the endpoint returns 400 if no image is provided."""
    response = client.post('/api/accessory/analyze', data={})
    assert response.status_code == 400
    assert b"No image file" in response.data

def test_analyze_accessory_valid_image(client):
    """Test that the endpoint returns 200 and valid data for a real image."""
    # Path to the test image in the project root
    # backend/tests/../../test_accessory.jpg
    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../test_accessory.jpg'))
    
    # Ensure the file exists
    if not os.path.exists(image_path):
        pytest.skip(f"Test image not found at {image_path}")

    with open(image_path, 'rb') as img:
        img_bytes = io.BytesIO(img.read())
    
    data = {
        'image': (img_bytes, 'test_accessory.jpg'),
        'gender': 'female'
    }
    
    response = client.post('/api/accessory/analyze', data=data, content_type='multipart/form-data')
    
    assert response.status_code == 200
    json_data = response.get_json()
    
    assert 'detected_color' in json_data
    assert 'recommendations' in json_data
    assert len(json_data['recommendations']) > 0
    assert json_data['gender'] == 'female'
    
    # Verify we got a color back (it might be Navy Blue as default or something else)
    print(f"Detected Color: {json_data['detected_color']}")

def test_analyze_accessory_manual_color(client):
    """Test that the endpoint respects manually provided color."""
    # We can send a dummy image or reuse the real one, but we must send an image
    # because the endpoint checks `if 'image' not in request.files` first.
    
    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../test_accessory.jpg'))
    if not os.path.exists(image_path):
        pytest.skip("Test image not found")

    with open(image_path, 'rb') as img:
        img_bytes = io.BytesIO(img.read())

    data = {
        'image': (img_bytes, 'test_accessory.jpg'),
        'gender': 'male',
        'detected_color': 'Red'
    }
    
    response = client.post('/api/accessory/analyze', data=data, content_type='multipart/form-data')
    
    assert response.status_code == 200
    json_data = response.get_json()
    
    # It should use our manual color
    assert json_data['detected_color'] == 'Red'
    # And provide male recommendations
    assert json_data['gender'] == 'male'
