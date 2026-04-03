import pytest
from flask import json

def test_full_onboarding_to_recommendation(client):
    """
    Simulates a full user journey:
    1. Start -> 2. Select Gender -> 3. Select Body Type -> 4. Ask for Occasion Recommendation
    """
    
    # Context data that would normally be built in the frontend state
    user_context = {
        'gender': 'male',
        'body_type': 'Trapezoid',
        'style_preference': 'Formal',
        'skin_tone': 'Medium',
        'weather': 'hot'
    }

    # Step 1: User asks for a wedding outfit with full context
    response = client.post('/api/ai-chat', json={
        'message': 'Suggest a look for my brother\'s wedding',
        'history': [],
        **user_context
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    reply = data['reply']
    
    # 1. Check for Gender-Specific item (Sherwani/Suit for Male)
    assert any(keyword in reply.lower() for keyword in ["sherwani", "suit", "blazer", "formal"])
    
    # 2. Check for Body Type mention (Trapezoid)
    assert "Trapezoid" in reply
    
    # 3. Check for Occasion mention (Wedding)
    assert "Wedding" in reply
    
    # 4. Check for Structured Format (flexible)
    assert "Outfit Recommendation" in reply
    assert "Fit Advice" in reply
    assert "Best Colors" in reply
    assert "Fabric Suggestion" in reply

def test_interaction_with_history(client):
    """Verifies that the backend can handle conversation history (simulated)."""
    
    history = [
        {'type': 'user', 'text': 'Hello'},
        {'type': 'bot', 'text': 'Hi! How can I help you today?'}
    ]
    
    response = client.post('/api/ai-chat', json={
        'message': 'Suggest a casual look',
        'history': history,
        'gender': 'female',
        'body_type': 'Pear'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "Outfit Recommendation" in data['reply']
    assert "Pear" in data['reply']

def test_quick_replies_logic(client):
    """Ensures that quick replies are always present in the response."""
    response = client.post('/api/ai-chat', json={
        'message': 'party',
        'gender': 'female'
    })
    data = json.loads(response.data)
    assert 'quick_replies' in data
    assert len(data['quick_replies']) > 0
    assert "Outfit Ideas" in data['quick_replies'] or "Color Suggestions" in data['quick_replies']
