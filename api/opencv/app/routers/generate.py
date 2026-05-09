from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services.ai_service import ai_service
import json

router = APIRouter(
    prefix="/api/v1/generate",
    tags=["generate"]
)

class TemplateRequest(BaseModel):
    goal: str
    theme: str
    difficulty: str = "easy"

@router.post("/template")
async def generate_template(request: TemplateRequest):
    try:
        svg = await ai_service.generate_svg_template(
            request.goal, 
            request.theme, 
            request.difficulty
        )
        return {"success": True, "svg": svg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ram-report")
async def parse_ram_report(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        result = await ai_service.parse_ram_report(content)
        
        if isinstance(result, str):
            try:
                data = json.loads(result)
                return {"success": True, "data": data}
            except:
                return {"success": False, "error": "Invalid JSON from AI", "raw": result}
        
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
