import io
import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from PIL import Image, UnidentifiedImageError

from .services.camera_service import mjpeg_stream
from .services.person_analyzer import PersonAnalyzer
from .services.render_provider import RenderProviderError, hair_provider
from .services.system_info import get_system_info
from ..vto.engine import EngineError, EngineUnavailable, engine_status, get_engine
from ..vto.pipeline import run_tryon
from ..vto.preprocess import CATEGORIES, PoseUnavailable

logger = logging.getLogger("fitai")
app = FastAPI(title="FitAI Local AI Runtime", version="0.6.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
logger.info("Initializing FitAI MediaPipe analyzer")
analyzer = PersonAnalyzer()


def _vto_available() -> bool:
    try:
        get_engine("auto")
        return True
    except EngineError:
        return False


@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "backend": "mediapipe-opencv-cpu",
        "version": "0.6.0",
        "capabilities": {
            "pose": True,
            "segmentation": True,
            "face_detection": True,
            "face_mesh": True,
            "hair_semantic_segmentation": False,
            "pose_aware_ar_garment": True,
            "live_hair_recolor": True,
            "hairstyle_synthesis": False,
            # Real generative try-on, reported from the engine registry rather
            # than hard-coded, so the UI can never claim a capability the
            # machine does not actually have.
            "photorealistic_vto": _vto_available(),
        },
    }


@app.get("/api/v1/system")
def system():
    return get_system_info()


@app.post("/api/v1/person/analyze")
async def analyze_person(file: UploadFile = File(...)):
    data = await file.read()
    try:
        result = analyzer.analyze_bytes(data)
        logger.info("analyze bytes=%d detected=%s landmarks=%d faces=%d latency_ms=%s",
                    len(data), result["detected"], len(result["landmarks"]),
                    len(result["faces"]), result["latency_ms"])
        return result
    except ValueError as exc:
        logger.warning("Invalid analysis image: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/v1/camera/stream")
def camera_stream(camera: int = 0):
    return StreamingResponse(mjpeg_stream(analyzer, camera),
                             media_type="multipart/x-mixed-replace; boundary=frame")


# --------------------------------------------------------------------------- #
# photorealistic rendering
# --------------------------------------------------------------------------- #

@app.get("/api/v1/render/providers")
def render_providers():
    return {"vto": engine_status(), "hair": hair_provider.status()}


def _read_image(upload: UploadFile, data: bytes, label: str) -> Image.Image:
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400,
                            detail=f"{label} is not a readable image: {exc}")


@app.post("/api/v1/render/vto")
async def render_vto(
    person: UploadFile = File(...),
    garment: UploadFile = File(...),
    category: str = Form("upper"),
    engine: str = Form("auto"),
    steps: int = Form(30),
    seed: int | None = Form(None),
):
    if category not in CATEGORIES:
        raise HTTPException(status_code=400,
                            detail=f"category must be one of {sorted(CATEGORIES)}")

    person_image = _read_image(person, await person.read(), "person")
    garment_image = _read_image(garment, await garment.read(), "garment")

    try:
        selected = get_engine(engine)
    except EngineUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    try:
        result = run_tryon(person_image, garment_image, category=category,
                           engine=selected, steps=steps, seed=seed)
    except PoseUnavailable as exc:
        # Not a server fault: the photo simply has no usable person in it.
        raise HTTPException(status_code=422, detail=str(exc))
    except EngineError as exc:
        logger.error("VTO generation failed: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))

    logger.info("vto engine=%s category=%s latency_ms=%.0f",
                result.engine, result.category, result.latency_ms)
    return Response(
        content=result.to_png(),
        media_type="image/png",
        headers={
            "X-FitAI-Latency-Ms": f"{result.latency_ms:.1f}",
            "X-FitAI-Renderer": result.engine,
            "X-FitAI-Category": result.category,
        },
    )


@app.post("/api/v1/render/hair")
async def render_hair(person: UploadFile = File(...),
                      hairstyle: UploadFile = File(...),
                      color: str = ""):
    try:
        image, latency = hair_provider.render(await person.read(), await hairstyle.read(), color)
        return Response(content=image, media_type="image/png",
                        headers={"X-FitAI-Latency-Ms": f"{latency:.1f}",
                                 "X-FitAI-Renderer": "real-hair"})
    except RenderProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
