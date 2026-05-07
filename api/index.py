import os
import sys

# Add root to path
basedir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(basedir)

try:
    from flask_sqlalchemy import SQLAlchemy
    print("Successfully imported flask_sqlalchemy")
except ImportError as e:
    print(f"Failed to import flask_sqlalchemy: {e}")
    # Fallback/Debug info
    import subprocess
    try:
        output = subprocess.check_output([sys.executable, "-m", "pip", "freeze"])
        print("Installed packages:")
        print(output.decode())
    except:
        pass

from app import app

# Vercel entry point
# The 'app' object is imported from the main app.py
