"""
Face Recognition API Routes
With authentication for sensitive endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from pydantic import BaseModel
from typing import List, Optional
import base64

from app.services.face_service import FaceRecognitionService
from app.core.auth import verify_api_key, require_admin
from app.core.limiter import limiter
from fastapi import Request

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
@limiter.limit("10/minute")
async def encode_face(
    request: Request,
    request_body: FaceEncodeRequest,
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
            image_base64=request_body.image_base64,
            user_id=request_body.user_id,
            tenant_id=request_body.tenant_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/encode-file", response_model=FaceEncodeResponse)
@limiter.limit("10/minute")
async def encode_face_file(
    request: Request,
    user_id: str = Form(...),
    tenant_id: str = Form(...),
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)  # Requires authentication
):
    """
    Encode a face from uploaded file
    """
    try:
        # Validate file size
        contents = await validate_file_size(file)
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        result = await face_service.encode_face(
            image_base64=image_base64,
            user_id=user_id,
            tenant_id=tenant_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match-file", response_model=FaceMatchResponse)
@limiter.limit("20/minute")
async def match_face_file(
    request: Request,
    tenant_id: str = Form(...),
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)  # Requires authentication
):
    """
    Match an uploaded face image against database
    """
    try:
        # Validate file size
        contents = await validate_file_size(file)
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        result = await face_service.match_face(
            image_base64=image_base64,
            tenant_id=tenant_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/user/{user_id}")
@limiter.limit("20/minute")
async def delete_user_encodings(
    request: Request,
    user_id: str,
    tenant_id: str,
    api_key: str = Depends(require_admin)
):
    """
    Delete all face encodings for a user
    """
    try:
        result = await face_service.delete_user_encodings(user_id, tenant_id)
        if not result:
             raise HTTPException(status_code=404, detail="User not found or access denied")
        return {"success": result, "message": f"Encodings deleted for user {user_id}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
@limiter.limit("60/minute")
async def list_enrolled_users(
    request: Request,
    tenant_id: str,
    api_key: str = Depends(verify_api_key)
):
    """
    List all users with face encodings for a specific tenant
    """
    try:
        users = await face_service.list_enrolled_users(tenant_id)
        return {"users": users, "count": len(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ Mobile-Optimized Endpoints ============

class MobileIdentifyRequest(BaseModel):
    """Mobile face identification request"""
    image: str  # Base64 encoded image
    threshold: float = 0.6  # Confidence threshold


class MobileIdentifyResponse(BaseModel):
    """Mobile face identification response"""
    match: bool
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    student_photo: Optional[str] = None
    confidence: float = 0.0
    message: str


@router.post("/face/identify", response_model=MobileIdentifyResponse)
@limiter.limit("30/minute")
async def mobile_identify_face(
    request: Request,
    body: MobileIdentifyRequest,
):
    """
    Mobile-optimized face identification for attendance.
    Uses x-tenant-id header for multi-tenancy.
    Returns student info if match found.
    
    🔐 Requires valid x-tenant-id header (validated tenant)
    """
    try:
        # SECURITY FIX: Validate tenant ID before processing
        tenant_id = getattr(request.state, 'tenant_id', None)
        
        if not tenant_id or tenant_id == 'default':
            return MobileIdentifyResponse(
                match=False,
                confidence=0.0,
                message="x-tenant-id header is required"
            )
        
        # Validate tenant_id format (alphanumeric with hyphens/underscores only)
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', tenant_id):
            return MobileIdentifyResponse(
                match=False,
                confidence=0.0,
                message="Invalid tenant ID format"
            )
        
        # Call face matching service
        result = await face_service.match_face(
            image_base64=body.image,
            tenant_id=tenant_id,
        )
        
        if not result.get('success') or not result.get('best_match'):
            return MobileIdentifyResponse(
                match=False,
                confidence=0.0,
                message="Yüz tanınamadı. Lütfen tekrar deneyin."
            )
        
        best = result['best_match']
        confidence = best.get('confidence', 0)
        
        if confidence < body.threshold:
            return MobileIdentifyResponse(
                match=False,
                confidence=confidence,
                message=f"Eşleşme güven skoru düşük: {confidence:.2f}"
            )
        
        # Parse user_id - format is typically "student_123"
        user_id_str = best.get('user_id', '')
        student_id = None
        if user_id_str.startswith('student_'):
            try:
                student_id = int(user_id_str.split('_')[1])
            except (ValueError, IndexError):
                pass
        elif user_id_str.isdigit():
            student_id = int(user_id_str)
        
        return MobileIdentifyResponse(
            match=True,
            student_id=student_id,
            student_name=best.get('display_name', user_id_str),
            student_photo=None,  # Could fetch from Strapi
            confidence=confidence,
            message="Başarılı"
        )
        
    except ValueError as e:
        return MobileIdentifyResponse(
            match=False,
            confidence=0.0,
            message=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/face/students")
@limiter.limit("30/minute")
async def get_students_for_mobile(request: Request):
    """
    Get list of students with face encodings for offline caching.
    Uses x-tenant-id header for multi-tenancy.
    """
    try:
        tenant_id = getattr(request.state, 'tenant_id', 'default')
        users = await face_service.list_enrolled_users(tenant_id)
        
        # Format for mobile
        students = []
        for user in users:
            user_id = user.get('user_id', '')
            student_id = None
            if user_id.startswith('student_'):
                try:
                    student_id = int(user_id.split('_')[1])
                except (ValueError, IndexError):
                    pass
            
            students.append({
                'id': student_id,
                'user_id': user_id,
                'name': user.get('display_name', user_id),
                'has_encoding': True,
            })
        
        return {
            'students': students,
            'count': len(students),
            'tenant': tenant_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

