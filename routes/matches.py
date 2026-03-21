from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import LostItem, FoundItem
from services.matching import get_match_score

matches_bp = Blueprint('matches', __name__)

@matches_bp.route('/suggest/<int:lost_item_id>', methods=['GET'])
@jwt_required()
def suggest_matches(lost_item_id):
    lost_item = LostItem.query.get_or_404(lost_item_id)
    
    # Get all active found items
    found_items = FoundItem.query.filter_by(status='Found').all()
    
    suggestions = []
    for found in found_items:
        # Only suggest if the found date is on or after the lost date
        if found.date_found >= lost_item.date_lost:
            match_data = get_match_score(lost_item, found)
            
            # Threshold for considering it a match (e.g., > 0.4)
            if match_data['score'] > 0.4:
                suggestions.append({
                    "found_item_id": found.id,
                    "found_item_name": found.name,
                    "location": found.location,
                    "date_found": found.date_found.strftime('%Y-%m-%d'),
                    "match_score": round(match_data['score'] * 100, 2),  # percentage
                    "text_score": round(match_data['text_score'] * 100, 2),
                    "image_score": round(match_data['image_score'] * 100, 2),
                    "image_path": found.image_path
                })
                
    # Sort suggestions by match score descending
    suggestions.sort(key=lambda x: x['match_score'], reverse=True)
    
    return jsonify({
        "lost_item_id": lost_item.id,
        "lost_item_name": lost_item.name,
        "matches": suggestions
    }), 200
