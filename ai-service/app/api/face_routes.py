"""
Face Recognition API Routes
With authentication for sensitive endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import base64

from app.services.face_service import FaceRecognitionService
from app.core.auth import verify_api_key, require_admin

router = APIRouter()
face_service = FaceRecognitionService()

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


# ============ Request/Response Models ============

class FaceEncodeRequest(BaseModel):
    """Request to encode a face from base64 image"""
    image_base64: str
    user_id: str
    tenant_id: str


class FaceEncodeResponse(BaseModel):
    """Response with face encoding"""
    success: bool
    user_id: str
    encoding_id: Optional[str] = None
    face_count: int = 0
    message: str


class FaceMatchRequest(BaseModel):
    """Request to match a face against database"""
    image_base64: str
    tenant_id: str


class FaceMatchResult(BaseModel):
    """Single match result"""
    user_id: str
    confidence: float
    display_name: Optional[str] = None


class FaceMatchResponse(BaseModel):
    """Response with matching results"""
    success: bool
    matches: List[FaceMatchResult]
    best_match: Optional[FaceMatchResult] = None
    message: str


class TrainRequest(BaseModel):
    """Request to train model with images"""
    user_id: str
    images_base64: List[str]
    tenant_id: str


class TrainResponse(BaseModel):
    """Training response"""
    success: bool
    user_id: str
    images_processed: int
    message: str


# ============ Helper Functions ============

async def validate_file_size(file: UploadFile) -> bytes:
    """Read file with size validation to prevent DoS"""
    contents = b""
    total_size = 0
    
    # Read in chunks to prevent memory exhaustion
    chunk_size = 1024 * 1024  # 1MB chunks
    
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        
        if total_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        contents += chunk
    
    return contents


# ============ API Endpoints ============

@router.post("/encode", response_model=FaceEncodeResponse)
async def encode_face(
    request: FaceEncodeRequest,
    api_key: str = Depends(verify_api_key)  # Requires authentication
):
    """
    Encode a face from base64 image and store encoding
    
    - **image_base64**: Base64 encoded image (JPEG/PNG)
    - **user_id**: Strapi user ID to associate with face
    
    🔐 Requires API key authentication
    """
    try:
        result = await face_service.encode_face(
            image_base64=request.image_base64,
            user_id=request.user_id,
            tenant_id=request.tenant_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/encode-file", response_model=FaceEncodeResponse)
async def encode_face_file(
    user_id: str,
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)  # Requires authentication
):
    """
    Encode a face from uploaded file
    
    - **user_id**: Strapi user ID to associate with face
    - **file**: Image file (JPEG/PNG, max 10MB)
    
    🔐 Requires API key authentication
    """
    try:
        # Validate file size to prevent DoS
        contents = await validate_file_size(file)
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        result = await face_service.encode_face(
            image_base64=image_base64,
            user_id=user_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match", response_model=FaceMatchResponse)
async def match_face(request: FaceMatchRequest):
    """
    Match a face against all stored encodings
    
    - **image_base64**: Base64 encoded image to match
    
    Returns list of matching users sorted by confidence
    
    ℹ️ No authentication required for matching
    """
    try:
        result = await face_service.match_face(
            image_base64=request.image_base64,
            tenant_id=request.tenant_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match-file", response_model=FaceMatchResponse)
async def match_face_file(file: UploadFile = File(...)):
    """
    Match an uploaded face image against database
    
    ℹ️ No authentication required for matching
    """
    try:
        # Validate file size
        contents = await validate_file_size(file)
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        result = await face_service.match_face(
            image_base64=image_base64,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train", response_model=TrainResponse)
async def train_user(
    request: TrainRequest,
    api_key: str = Depends(require_admin)  # Requires admin authentication
):
    """
    Train face recognition model with multiple images for a user
    
    - **user_id**: User to train
    - **images_base64**: List of base64 encoded training images
    
    🔐 Requires admin API key authentication
    """
    try:
        result = await face_service.train_user(
            user_id=request.user_id,
            images_base64=request.images_base64,
            tenant_id=request.tenant_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/user/{user_id}")
async def delete_user_encodings(
    user_id: str,
    api_key: str = Depends(require_admin)  # Requires admin authentication
):
    """
    Delete all face encodings for a user
    
    🔐 Requires admin API key authentication
    """
    try:
        result = await face_service.delete_user_encodings(user_id)
        return {"success": result, "message": f"Encodings deleted for user {user_id}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def list_enrolled_users(
    api_key: str = Depends(verify_api_key)  # Requires authentication
):
    """
    List all users with face encodings
    
    🔐 Requires API key authentication
    """
    try:
        users = await face_service.list_enrolled_users()
        return {"users": users, "count": len(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
