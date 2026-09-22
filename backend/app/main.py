import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .services.person_analyzer import PersonAnalyzer
from .services.camera_service import mjpeg_stream
from .services.system_info import get_system_info

logger=logging.getLogger("fitai")
app=FastAPI(title="FitAI Local AI Runtime",version="0.5.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
logger.info("Initializing FitAI MediaPipe analyzer")
analyzer=PersonAnalyzer()

@app.get("/api/v1/health")
def health():
    return {"status":"ok","backend":"mediapipe-opencv-cpu","version":"0.5.0","capabilities":{"pose":True,"segmentation":True,"face_detection":True,"face_mesh":True,"hair_semantic_segmentation":False,"pose_aware_ar_garment":True,"person_mask_png":True,"hairstyle_synthesis":False}}

@app.get("/api/v1/system")
def system(): return get_system_info()

@app.post("/api/v1/person/analyze")
async def analyze_person(file:UploadFile=File(...)):
    data=await file.read()
    try:
        result=analyzer.analyze_bytes(data)
        logger.info("analyze bytes=%d detected=%s landmarks=%d faces=%d latency_ms=%s",len(data),result["detected"],len(result["landmarks"]),len(result["faces"]),result["latency_ms"])
        return result
    except ValueError as exc:
        logger.warning("Invalid analysis image: %s",exc); raise HTTPException(status_code=400,detail=str(exc))

@app.get("/api/v1/camera/stream")
def camera_stream(camera:int=0):
    return StreamingResponse(mjpeg_stream(analyzer,camera),media_type="multipart/x-mixed-replace; boundary=frame")
