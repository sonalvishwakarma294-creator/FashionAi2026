import pytest
from flask import json

def test_chat_endpoint_exists(client):
    """Test that the chat endpoint is reachable."""
    response = client.post('/api/ai-chat', json={
        'message': 'Hello',
        'gender': 'female'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'reply' in data

def test_fallback_wedding_female(client):
    """Test wedding advice for females (fallback)."""
    response = client.post('/api/ai-chat', json={
        'message': 'I need a wedding outfit',
        'gender': 'female'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    
    # Check for key terms from the new fallback logic
    assert "lehenga" in reply or "saree" in reply
    assert "pastel" in reply or "jewel" in reply

def test_fallback_wedding_male(client):
    """Test wedding advice for males (fallback)."""
    response = client.post('/api/ai-chat', json={
        'message': 'I need a wedding outfit',
        'gender': 'male'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    
    # Check for key terms from the new fallback logic
    assert "sherwani" in reply or "tuxedo" in reply
    assert "cream" in reply or "navy" in reply

def test_fallback_office(client):
    """Test office advice (fallback)."""
    response = client.post('/api/ai-chat', json={
        'message': 'What should I wear to the office?',
        'gender': 'female'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    
    # Check for key terms
    assert "blazer" in reply
    assert "structured" in reply

def test_fallback_casual(client):
    """Test casual advice (fallback)."""
    response = client.post('/api/ai-chat', json={
        'message': 'Casual weekend outfit',
        'gender': 'male'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    
    # Check for key terms
    assert "denims" in reply
    assert "sneakers" in reply

def test_hinglish_wedding(client):
    """Test Hinglish query handling."""
    response = client.post('/api/ai-chat', json={
        'message': 'Bhai ki shadi hai',
        'gender': 'male'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    
    # Should trigger wedding logic
    assert "sherwani" in reply or "tuxedo" in reply

def test_general_fallback(client):
    """Test general query that doesn't match specific keywords."""
    response = client.post('/api/ai-chat', json={
        'message': 'Something random regarding space travel',
        'gender': 'female'
    })
    data = json.loads(response.data)
    reply = data['reply'].lower()
    
    # Should trigger general advice
    assert "fit is king" in reply
