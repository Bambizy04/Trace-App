from app import create_app
from extensions import db
import models

app = create_app()

with app.app_context():
    # This will create all the tables defined in models.py
    # in whatever database is specified in config.py
    print("Creating database tables...")
    db.create_all()
    print("Database tables created successfully!")
