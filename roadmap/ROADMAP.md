# FitAI Engineering Roadmap

Status legend: DONE = real runnable implementation; PROTOTYPE = UI/demo logic; TODO = not implemented.

## Phase 0 — Repository truthfulness
- DONE React/Vite Persian/English UI
- DONE local FastAPI runtime
- DONE still-image upload API
- DONE USB webcam MJPEG capture
- DONE system RAM/NVIDIA telemetry
- DONE real 33-point pose inference
- DONE real person segmentation
- DONE real face detection
- DONE normalized shoulder/hip/body geometry
- DONE CPU fallback suitable for 16 GB RAM / Quadro P1000 4 GB
- PROTOTYPE Canvas garment overlay
- PROTOTYPE body slim/fit visualization
- PROTOTYPE salon/hair UI
- TODO metric anthropometry in centimeters
- TODO face identity/returning-customer recognition
- TODO production virtual try-on model
- TODO production hair synthesis
- TODO demographic/expression models

## Phase 1 — Local vision runtime
- DONE MediaPipe pose + segmentation provider
- DONE frame analysis client for browser camera
- TODO wire real landmarks into every live try-on view
- TODO temporal landmark smoothing and adaptive inference interval
- TODO foreground mask endpoint (PNG/WebP alpha)
- TODO camera device enumeration and configurable camera index
- TODO benchmark command with FPS/latency/RAM report
- TODO automated tests for image, camera and API contracts

## Phase 2 — P1000 optimization
- TODO optional ONNX Runtime provider
- TODO CUDA provider detection with safe CPU fallback
- TODO model registry with VRAM estimates
- TODO one-heavy-model-at-a-time scheduler
- TODO 512/640 inference profiles for 4 GB VRAM
- TODO memory-pressure guard and automatic unload

## Phase 3 — Virtual try-on
- TODO evaluate commercially usable checkpoints independently from source-code licenses
- TODO garment segmentation/preprocessing
- TODO asynchronous try-on job API
- TODO identity/texture/logo preservation benchmarks
- TODO P1000-compatible low-memory path; otherwise allow remote GPU worker without changing API

## Phase 4 — Product and store integration
- TODO Generic REST product provider
- TODO CSV provider
- TODO iMonitor adapter
- TODO product/variant/color/size normalization
- TODO local offline cache

## Phase 5 — Production
- TODO SQLite/PostgreSQL persistence
- TODO sessions/events
- TODO admin runtime/model health
- TODO installer packaging
- TODO Docker CPU profile
- TODO GPU worker profile
- TODO CI tests and release artifacts

## Definition of DONE
A feature is DONE only when a real implementation exists, can be executed from a clean clone, and has no fabricated inference values in its production path.
