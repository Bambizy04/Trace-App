import os
import sys

# Add the root directory to the path so we can import app.py
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import app

# This is the entry point for Vercel's Serverless Functions
# The app object must be available here
