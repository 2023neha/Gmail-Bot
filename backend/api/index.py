import sys
import os

# Add the backend directory to the path so Vercel can find the 'app' package
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
