from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Claim, FoundItem, LostItem

admin_bp = Blueprint('admin', __name__)

def is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'Admin'

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Admin access required"}), 403
        
    users = User.query.all()
    result = [{"id": u.id, "username": u.username, "email": u.email, "role": u.role} for u in users]
    return jsonify(result), 200

@admin_bp.route('/claims', methods=['GET'])
@jwt_required()
def get_all_claims():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Admin access required"}), 403
        
    claims = Claim.query.all()
    result = []
    for claim in claims:
        result.append({
            "id": claim.id,
            "user": claim.user.username,
            "found_item": claim.found_item.name,
            "proof": claim.proof_description,
            "status": claim.status,
            "created_at": claim.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify(result), 200

@admin_bp.route('/claims/<int:claim_id>/review', methods=['POST'])
@jwt_required()
def review_claim(claim_id):
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Admin access required"}), 403
        
    data = request.get_json()
    action = data.get('action') # 'Approve' or 'Reject'
    feedback = data.get('feedback', '')
    
    claim = Claim.query.get_or_404(claim_id)
    
    if action not in ['Approve', 'Reject']:
        return jsonify({"msg": "Invalid action. Use 'Approve' or 'Reject'"}), 400
        
    claim.status = 'Approved' if action == 'Approve' else 'Rejected'
    claim.admin_feedback = feedback
    
    if action == 'Approve':
        # Update item status
        found_item = FoundItem.query.get(claim.found_item_id)
        found_item.status = 'Claimed'
        # Logically we might also want to mark the related lost item as found, 
        # but that requires knowing which lost item it matched. For simplicity, just update found item.
        
    db.session.commit()
    
    # In a full system, we would trigger a notification here
    # notify_user(claim.user_id, f"Your claim was {claim.status}", feedback)
    
    return jsonify({"msg": f"Claim {action.lower()}d successfully"}), 200

@admin_bp.route('/items', methods=['GET'])
@jwt_required()
def get_all_items():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Admin access required"}), 403
        
    lost = LostItem.query.all()
    found = FoundItem.query.all()
    
    return jsonify({
        "lost_items": len(lost),
        "found_items": len(found),
        "pending_claims": Claim.query.filter_by(status='Pending').count()
    }), 200
