# ✅ FIXED: backend/config.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # MongoDB Atlas Configuration - FIXED connection string
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb+srv://xpranjal91:N1Hyz9qLk18ztFlV@cluster0.xnmik2d.mongodb.net/news_analyzer?retryWrites=true&w=majority&ssl=true")
    DATABASE_NAME: str = "news_analyzer"
    
    # JWT Authentication - FIXED secret key
    SECRET_KEY: str = os.getenv("SECRET_KEY", "news-analyzer-super-secret-jwt-key-2024-production-ready-32-chars-minimum")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Google API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AIzaSyDxuTGB0DJiYl83zLOZt9nwaiSxYtEeZnQ")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "AIzaSyAZXYXWvmfz9QTVVjQMab3SbfAwJLVRepU")
    GOOGLE_CSE_ID: str = os.getenv("GOOGLE_CSE_ID", "658ac532df3b84951")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS Settings - FIXED to allow all origins in development
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"  # Allow all origins in development
    ]

settings = Settings()
