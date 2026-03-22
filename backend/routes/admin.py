from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.feedback import Feedback
from config.db import db
from functools import wraps

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        if not user or (user.role != 'admin' and not user.is_admin):
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    user_count = User.query.count()
    feedback_count = Feedback.query.count()
    return jsonify({
        'total_users': user_count,
        'total_feedback': feedback_count
    })

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])

@admin_bp.route('/feedback', methods=['GET'])
@admin_required
def get_feedback():
    feedbacks = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify([f.to_dict() for f in feedbacks])
