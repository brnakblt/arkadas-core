"""
Application configuration settings
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Strapi Integration
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: Optional[str] = None
    
    # Face Recognition Settings
    FACE_RECOGNITION_TOLERANCE: float = 0.6  # Lower = stricter matching
    MIN_CONFIDENCE_SCORE: float = 0.7
    MAX_FACES_PER_IMAGE: int = 10
    
    # Storage Paths
    FACE_ENCODINGS_PATH: str = "./data/encodings"
    TEMP_UPLOAD_PATH: str = "./data/temp"

    # Security
    AI_SERVICE_API_KEY: Optional[str] = None
    CORS_ALLOWED_ORIGINS: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
