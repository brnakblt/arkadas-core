from fastapi import FastAPI, UploadFile, File, HTTPException
import face_recognition
import cv2
import numpy as np
import io

app = FastAPI(title="Arkadas BSDK Service", version="1.0.0")

@app.get("/")
def read_root():
    return {"status": "online", "service": "opencv-face-recognition"}

@app.post("/verify")
async def verify_face(
    image: UploadFile = File(...),
    reference_image: UploadFile = File(None)
):
    """
    Receives an image file and attempts to detect a face.
    If 'reference_image' is provided, it verifies the identity.
    """
    try:
        # 1. Process Probe Image
        contents = await image.read()
        nparr = np.fromstring(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

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
            ref_nparr = np.fromstring(ref_contents, np.uint8)
            ref_img = cv2.imdecode(ref_nparr, cv2.IMREAD_COLOR)
            
            if ref_img is not None:
                ref_rgb = cv2.cvtColor(ref_img, cv2.COLOR_BGR2RGB)
                ref_encodings = face_recognition.face_encodings(ref_rgb)
                
                if len(ref_encodings) > 0:
                    ref_encoding = ref_encodings[0]
                    # Compare
                    matches = face_recognition.compare_faces([ref_encoding], probe_encoding)
                    face_distances = face_recognition.face_distance([ref_encoding], probe_encoding)
                    
                    match_result = bool(matches[0])
                    distance = float(face_distances[0])

        return {
            "status": "success",
            "faces_detected": len(face_locations),
            "verified": match_result,
            "distance": distance,
            "message": "Verification successful" if match_result else "Verification failed"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
