from fastapi import APIRouter, HTTPException, Depends
from app.schemas.iep import IEPGenerationRequest, IEPGenerationResponse
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/generate", response_model=IEPGenerationResponse)
async def generate_iep(request: IEPGenerationRequest):
    """
    Generate a draft BEP (IEP) based on RAM report.
    Requires OPENAI_API_KEY to be set on server.
    """
    try:
        if not llm_service.client:
            raise HTTPException(status_code=503, detail="AI Service not configured (Missing API Key)")
            
        result = llm_service.generate_iep(request)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
