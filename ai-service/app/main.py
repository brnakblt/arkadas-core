"""
AI Face Recognition Service
FastAPI application for face encoding and matching
"""

import os
import warnings
# Silence deprecation warning from face_recognition_models
warnings.filterwarnings("ignore", category=UserWarning, module="face_recognition_models")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import face_routes, health_routes, iep_routes
from app.core.config import settings
from app.routers import storage
from app.core.limiter import limiter

# Rate Limiting
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


# =============================================================================
# CORS Configuration - SECURITY FIX #3
# =============================================================================

def get_allowed_origins() -> list:
    """
    Get allowed origins from environment or use secure defaults.
    Never use '*' with credentials in production.
    """
    # Get from environment variable (comma-separated list)
    env_origins = settings.CORS_ALLOWED_ORIGINS
    
    if env_origins:
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    
    # Default allowed origins for development
    if settings.DEBUG:
        return [
            "http://localhost:3000",     # Next.js dev
            "http://127.0.0.1:3000",
            "http://localhost:1337",     # Strapi
            "http://127.0.0.1:1337",
            "http://localhost:8000",     # AI service
            "http://127.0.0.1:8000",
            "tauri://localhost",         # Tauri desktop app
            "https://tauri.localhost",
        ]
    
    # Production: Require explicit configuration
    # If no origins configured, only allow same-origin requests
    return []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Create directories
    os.makedirs(settings.FACE_ENCODINGS_PATH, exist_ok=True)
    os.makedirs(settings.TEMP_UPLOAD_PATH, exist_ok=True)
    
    allowed_origins = get_allowed_origins()
    if not allowed_origins:
        print("Warning: No CORS origins configured. Set CORS_ALLOWED_ORIGINS env var.")
    else:
        print(f"CORS configured for {len(allowed_origins)} origins")
    
    print(f"AI Face Recognition Service started on port {settings.PORT}")
    yield
    # Shutdown
    print("AI Face Recognition Service shutting down")


app = FastAPI(
    title="AI Face Recognition Service",
    description="Yüz tanıma ile yoklama takip sistemi",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Rate Limiting Configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =============================================================================
# CORS Middleware - Secure Configuration
# =============================================================================

allowed_origins = get_allowed_origins()

if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],  # Only methods we need
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
        max_age=600,  # Cache preflight for 10 minutes
    )
else:
    # No external CORS allowed - only same-origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    )

# Include routers
app.include_router(health_routes.router, prefix="/api", tags=["Health"])
app.include_router(face_routes.router, prefix="/api", tags=["Face Recognition"])
app.include_router(storage.router, prefix="/api", tags=["Storage"])
app.include_router(iep_routes.router, prefix="/api/iep", tags=["IEP Generation"])


@app.get("/")
async def root():
    return {
        "service": "AI Face Recognition Service",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
