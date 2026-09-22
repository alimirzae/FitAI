from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .services.person_analyzer import PersonAnalyzer
from .services.camera_service import mjpeg_stream
from .services.system_info import get_system_info

app = FastAPI(title="FitAI Local AI Runtime", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = PersonAnalyzer()

@app.get("/api/v1/health")
def health():
    return {"status": "ok", "backend": "opencv-cpu", "version": "0.2.0"}

@app.get("/api/v1/system")
def system():
    return get_system_info()

@app.post("/api/v1/person/analyze")
async def analyze_person(file: UploadFile = File(...)):
    data = await file.read()
    try:
        return analyzer.analyze_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@app.get("/api/v1/camera/stream")
def camera_stream(camera: int = 0):
    return StreamingResponse(
        mjpeg_stream(analyzer, camera),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
