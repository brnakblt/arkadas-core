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
async def verify_face(file: UploadFile = File(...)):
    """
    Receives an image file and attempts to detect a face.
    In a real scenario, this would compare against a known encoding.
    For this demo, it returns the number of faces found and their locations.
    """
    try:
        contents = await file.read()
        nparr = np.fromstring(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Convert to RGB (face_recognition uses RGB)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect face locations
        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

        return {
            "status": "success",
            "faces_detected": len(face_locations),
            "locations": face_locations,
            # In production, you would return a match result, not the encoding itself usually
            "encoding_generated": len(face_encodings) > 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
