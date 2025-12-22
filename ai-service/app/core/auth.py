"""
Authentication Middleware for AI Service
API key based authentication for sensitive endpoints
"""

import os
from functools import wraps
from typing import Optional

from fastapi import HTTPException, Security, Depends, Header
from fastapi.security import APIKeyHeader

from app.core.config import settings

# Environment variable for API key
API_KEY_NAME = "X-API-Key"
API_KEY = settings.AI_SERVICE_API_KEY

# API Key header security scheme
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Verify the API key from the request header.
    
    Raises HTTPException 401 if key is missing or invalid.
    Returns the validated API key.
    """
    if not API_KEY:
        # If no API key is configured, allow all requests (dev mode warning)
        print("⚠️  Warning: AI_SERVICE_API_KEY not set. Authentication disabled.")
        return "dev-mode"
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Unauthorized",
                "message": "API key is required. Provide X-API-Key header.",
            },
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    if api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Unauthorized",
                "message": "Invalid API key.",
            },
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return api_key


async def optional_api_key(api_key: Optional[str] = Security(api_key_header)) -> Optional[str]:
    """
    Optional API key verification.
    Returns the API key if valid, None if not provided.
    Raises HTTPException only if key is provided but invalid.
    """
    if not api_key:
        return None
    
    if API_KEY and api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Unauthorized",
                "message": "Invalid API key.",
            },
        )
    
    return api_key


def require_admin(api_key: str = Depends(verify_api_key)):
    """
    Dependency that requires valid API key for admin-level operations.
    Use this for sensitive endpoints like delete, train, etc.
    """
    return api_key
