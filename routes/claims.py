from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Claim, FoundItem, LostItem, User

claims_bp = Blueprint('claims', __name__)

@claims_bp.route('/', methods=['POST'])
@jwt_required()
def submit_claim():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    found_item_id = data.get('found_item_id')
    proof_description = data.get('proof_description')
    
    if not found_item_id or not proof_description:
        return jsonify({"msg": "Missing found_item_id or proof_description"}), 400
        
    found_item = FoundItem.query.get(found_item_id)
    if not found_item:
        return jsonify({"msg": "Found item not found"}), 404
        
    if found_item.status != 'Found':
        return jsonify({"msg": "Item is already claimed or not available"}), 400

    new_claim = Claim(
        user_id=user_id,
        found_item_id=found_item_id,
        proof_description=proof_description
    )
    
    db.session.add(new_claim)
    db.session.commit()
    
    return jsonify({"msg": "Claim submitted successfully", "claim_id": new_claim.id}), 201

@claims_bp.route('/my_claims', methods=['GET'])
@jwt_required()
def get_my_claims():
    user_id = int(get_jwt_identity())
    claims = Claim.query.filter_by(user_id=user_id).all()
    
    result = []
    for claim in claims:
        result.append({
            "id": claim.id,
            "found_item_id": claim.found_item_id,
            "found_item_name": claim.found_item.name,
            "proof_description": claim.proof_description,
            "status": claim.status,
            "admin_feedback": claim.admin_feedback,
            "created_at": claim.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
        
    return jsonify(result), 200
