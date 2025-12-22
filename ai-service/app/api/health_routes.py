"""
Health check routes
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Service health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-face-recognition",
    }


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    # Add database/dependency checks here
    return {"status": "ready"}
