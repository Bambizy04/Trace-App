import os
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import LostItem, FoundItem

items_bp = Blueprint('items', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_image_upload(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Create a unique filename using timestamp
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        return f"/static/uploads/{unique_filename}"
    return None

@items_bp.route('/lost', methods=['POST'])
@jwt_required()
def report_lost_item():
    user_id = get_jwt_identity()
    
    # Handle both multipart/form-data (with image) and application/json
    if request.content_type.startswith('multipart/form-data'):
        data = request.form
        file = request.files.get('image')
    else:
        data = request.get_json()
        file = None

    name = data.get('name')
    description = data.get('description')
    location = data.get('location')
    date_lost_str = data.get('date_lost')

    if not name or not description or not location or not date_lost_str:
        return jsonify({"msg": "Missing required fields"}), 400

    try:
        date_lost = datetime.strptime(date_lost_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"msg": "Invalid date format. Use YYYY-MM-DD"}), 400

    image_path = handle_image_upload(file) if file else None

    new_item = LostItem(
        user_id=user_id,
        name=name,
        description=description,
        location=location,
        date_lost=date_lost,
        image_path=image_path
    )
    
    db.session.add(new_item)
    db.session.commit()

    return jsonify({"msg": "Lost item reported successfully", "item_id": new_item.id}), 201

@items_bp.route('/lost', methods=['GET'])
def get_lost_items():
    items = LostItem.query.all()
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "location": item.location,
            "date_lost": item.date_lost.strftime('%Y-%m-%d'),
            "image_path": item.image_path,
            "status": item.status,
            "user": item.user.username
        })
    return jsonify(result), 200

@items_bp.route('/found', methods=['POST'])
@jwt_required()
def report_found_item():
    user_id = get_jwt_identity()
    
    if request.content_type.startswith('multipart/form-data'):
        data = request.form
        file = request.files.get('image')
    else:
        data = request.get_json()
        file = None

    name = data.get('name')
    description = data.get('description')
    location = data.get('location')
    date_found_str = data.get('date_found')

    if not name or not description or not location or not date_found_str:
        return jsonify({"msg": "Missing required fields"}), 400

    try:
        date_found = datetime.strptime(date_found_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"msg": "Invalid date format. Use YYYY-MM-DD"}), 400

    image_path = handle_image_upload(file) if file else None

    new_item = FoundItem(
        user_id=user_id,
        name=name,
        description=description,
        location=location,
        date_found=date_found,
        image_path=image_path
    )
    
    db.session.add(new_item)
    db.session.commit()

    return jsonify({"msg": "Found item reported successfully", "item_id": new_item.id}), 201

@items_bp.route('/found', methods=['GET'])
def get_found_items():
    items = FoundItem.query.all()
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "location": item.location,
            "date_found": item.date_found.strftime('%Y-%m-%d'),
            "image_path": item.image_path,
            "status": item.status,
            "user": item.user.username
        })
    return jsonify(result), 200
