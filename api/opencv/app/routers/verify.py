from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.face_service import FaceService

router = APIRouter(prefix="/verify", tags=["Verification"])

@router.post("")
async def verify_face(
    image: UploadFile = File(...),
    reference_image: UploadFile = File(None)
):
    try:
        # 1. Process Probe Image
        contents = await image.read()
        rgb_img = FaceService.process_image(contents)

        if rgb_img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        face_encodings = FaceService.get_face_encodings(rgb_img)

        if len(face_encodings) == 0:
            return {
                "status": "success",
                "faces_detected": 0,
                "verified": False,
                "message": "No face detected in probe image"
            }

        probe_encoding = face_encodings[0]
        match_result = False
        distance = None

        # 2. Process Reference Image (if provided)
        if reference_image:
            ref_contents = await reference_image.read()
            ref_rgb = FaceService.process_image(ref_contents)
            
            if ref_rgb is not None:
                ref_encodings = FaceService.get_face_encodings(ref_rgb)
                
                if len(ref_encodings) > 0:
                    ref_encoding = ref_encodings[0]
                    match_result, distance = FaceService.compare_faces(probe_encoding, ref_encoding)

        return {
            "status": "success",
            "faces_detected": len(face_encodings),
            "verified": match_result,
            "distance": distance,
            "message": "Verification successful" if match_result else "Verification failed"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
