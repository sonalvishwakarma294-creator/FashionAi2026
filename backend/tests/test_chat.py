import pytest
from flask import json

def test_chat_endpoint_exists(client):
    """Test that the chat endpoint is reachable."""
    response = client.post('/api/ai-chat', json={
        'message': 'Hello',
        'gender': 'female',
        'style_preference': 'Minimalist',
        'body_type': 'Pear'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'reply' in data

def test_body_type_fit_advice(client):
    """Verify that specific body types receive appropriate fit advice."""
    # Test Pear shape
    response = client.post('/api/ai-chat', json={
        'message': 'What should I wear?',
        'gender': 'female',
        'body_type': 'Pear'
    })
    data = json.loads(response.data)
    assert "Pear" in data['reply']
    # Check for keywords from fit advice logic
    assert "volume" in data['reply'].lower() or "hips" in data['reply'].lower()

    # Test Apple shape
    response = client.post('/api/ai-chat', json={
        'message': 'Style tips for me',
        'gender': 'female',
        'body_type': 'Apple'
    })
    data = json.loads(response.data)
    assert "Apple" in data['reply']
    assert "v-neck" in data['reply'].lower() or "torso" in data['reply'].lower()

def test_occasion_party_detailed(client):
    """Verify party recommendations are accurate and structured."""
    response = client.post('/api/ai-chat', json={
        'message': 'Suggest a party look',
        'gender': 'male',
        'occasion': 'party',
        'body_type': 'Trapezoid'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    assert "party" in reply
    assert "black slim fit shirt" in reply or "chelsea boots" in reply
    assert "fit advice" in reply

def test_comprehensive_color_guide(client):
    """Test comprehensive color recommendations."""
    response = client.post('/api/ai-chat', json={
        'message': 'which colors suit me?',
        'gender': 'female',
        'skin_tone': 'Fair'
    })
    data = json.loads(response.data)
    assert "Best Colors" in data['reply'] or "Color Guide" in data['reply']
    assert "Fair" in data['reply']

def test_weather_and_fabric(client):
    """Test weather-based fabric suggestions."""
    # Cold weather
    response = client.post('/api/ai-chat', json={
        'message': 'Casual look',
        'weather': 'cold'
    })
    data = json.loads(response.data)
    assert "Wool" in data['reply'] or "Fleece" in data['reply']

def test_error_handling_empty_message(client):
    """Test how the system handles empty input."""
    response = client.post('/api/ai-chat', json={'message': ''})
    data = json.loads(response.data)
    assert "help" in data['reply'].lower() or "today" in data['reply'].lower()

def test_fallback_mechanism(client):
    """Ensure the fallback system triggers when needed."""
    from routes.chat import professional_fallback_chat
    with client.application.test_request_context():
        response = professional_fallback_chat("hello", "male", body_type="Rectangle")
        data = response.get_json()
        # Actual format has stars for bolding: ✨ **Outfit Recommendation**
        assert "Outfit Recommendation" in data['reply']
        assert "engine" in data
        assert data['engine'] == "fallback"
