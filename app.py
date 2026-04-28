import os
from flask import Flask, jsonify, render_template
from flask_cors import CORS

from config import Config
from extensions import db, bcrypt, jwt
import models # ensure models are registered with SQLAlchemy

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for potential cross-origin requests
    CORS(app)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Ensure the upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "healthy"}), 200

    # Register blueprints (to be done soon)
    from routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # from routes.items import items_bp
    from routes.items import items_bp
    app.register_blueprint(items_bp, url_prefix='/api/items')

    from routes.claims import claims_bp
    app.register_blueprint(claims_bp, url_prefix='/api/claims')

    from routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    from routes.matches import matches_bp
    app.register_blueprint(matches_bp, url_prefix='/api/matches')

    return app

# Expose the app instance globally so Vercel can find it
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=8000)
