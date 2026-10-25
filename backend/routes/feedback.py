from flask import Blueprint, request, jsonify
from config.db import db
from models.feedback import Feedback

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

@feedback_bp.route('', methods=['POST'])
def add_feedback():
    data = request.json
    if not data or not data.get('name') or not data.get('message'):
        return jsonify({'error': 'Name and message are required'}), 400
    
    try:
        new_feedback = Feedback(
            name=data['name'],
            email=data.get('email', 'anonymous'),
            message=data['message'],
            rating=data.get('rating')
        )
        db.session.add(new_feedback)
        db.session.commit()
        return jsonify({'message': 'Feedback submitted successfully', 'feedback': new_feedback.to_dict()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Could not submit feedback. Please try again later.'}), 500
