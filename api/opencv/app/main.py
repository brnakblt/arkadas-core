from fastapi import FastAPI
from app.routers import verify, liveness, generate

app = FastAPI(
    title="Arkadas BSDK Service",
    description="OpenCV and AI service for Arkadas ERP",
    version="1.3.0"
)

app.include_router(verify.router)
app.include_router(liveness.router)
app.include_router(generate.router)

@app.get("/")
def read_root():
    return {"status": "online", "service": "opencv-face-recognition", "version": "1.2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
