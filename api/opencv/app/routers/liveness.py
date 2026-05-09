from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.services.face_service import FaceService

router = APIRouter(prefix="/liveness", tags=["Liveness"])

@router.post("")
async def check_liveness(
    frames: List[UploadFile] = File(...)
):
    """
    Verify liveness by analyzing a sequence of frames for blinks or movements.
    """
    try:
        processed_frames = []
        for frame in frames:
            contents = await frame.read()
            rgb_img = FaceService.process_image(contents)
            if rgb_img is not None:
                processed_frames.append(rgb_img)

        if not processed_frames:
            raise HTTPException(status_code=400, detail="Invalid frame data")

        result = FaceService.verify_liveness(processed_frames)
        return result
    except Exception as e:
        return {"verified": False, "score": 0, "message": str(e)}
