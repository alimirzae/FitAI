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
- DONE pose-aware articulated AR garment baseline (real shoulder/hip/elbow/wrist tracking)
- DONE first isolated transparent garment asset: Classic Shirt v1
- TODO generalized garment asset contract + alpha masks for catalog import
- DONE live garment compositor uses transparent garment asset + real pose fit + real MediaPipe person mask for occlusion
- TODO generalized TPS/piecewise garment deformation with catalog preprocessing
- TODO generalized piecewise affine/TPS garment warp
- PROTOTYPE body slim/fit visualization
- DONE live Salon camera + face detection + Face Mesh geometry
- DONE removed cartoon hairstyle overlay from production UI
- TODO install reviewed semantic hair segmentation + hairstyle synthesis provider before rendering transformed hair
- TODO semantic pixel-level hair segmentation for precise occlusion/boundaries
- TODO production hairstyle synthesis
- TODO metric anthropometry in centimeters
- TODO face identity/returning-customer recognition
- TODO production virtual try-on model
- TODO production hair synthesis
- TODO demographic/expression models

## Phase 1 — Local vision runtime
- DONE MediaPipe pose + segmentation provider
- DONE frame analysis client for browser camera
- DONE wire real landmarks into live fitting-room and Salon views
- TODO temporal landmark smoothing and adaptive inference interval
- TODO foreground mask endpoint (PNG/WebP alpha)
- TODO camera device enumeration and configurable camera index
- TODO benchmark command with FPS/latency/RAM report
- TODO automated tests for image, camera and API contracts

## Phase 2 — Camera abstraction and RGB-D expansion
- CURRENT reference input: laptop/USB RGB webcam through OpenCV/browser camera
- TODO define ICameraProvider / unified frame contract
- TODO OpenCVCameraProvider for explicit device enumeration/configuration
- TODO KinectV2CameraProvider for Xbox One Kinect using Microsoft Kinect for Windows SDK 2.0 on Windows
- TODO expose Kinect RGB + depth + calibration/body-space mapping without coupling AI modules to Kinect SDK types
- TODO optional Kinect body/skeleton data adapter for comparison/fusion with FitAI pose
- TODO depth-assisted foreground segmentation and person distance
- TODO depth-assisted metric anthropometry/calibration experiments
- TODO synchronized RGB/depth frame timestamps
- TODO generic RGBDFrame contract for future RGB-D devices
- TODO future providers for other RGB-D cameras behind the same abstraction
- TODO camera capability flags: rgb, depth, calibration, hardware_body_tracking, fps, resolution
- TODO preserve RGB-only operation: no RGB-D SDK may become a mandatory core dependency

## Phase 3 — P1000 optimization
- TODO optional ONNX Runtime provider
- TODO CUDA provider detection with safe CPU fallback
- TODO model registry with VRAM estimates
- TODO one-heavy-model-at-a-time scheduler
- TODO 512/640 inference profiles for 4 GB VRAM
- TODO memory-pressure guard and automatic unload

## Phase 4 — Virtual try-on
- DONE articulated 2D pose-aware AR baseline
- DONE local isolated Classic Shirt v1 asset and live renderer
- TODO generalized garment asset contract: isolated transparent garment + mask
- PROTOTYPE pose-anchored shirt fit with articulated sleeves
- TODO generalized piecewise affine/TPS warp before heavy generative VTO
- TODO evaluate commercially usable checkpoints independently from source-code licenses
- TODO garment segmentation/preprocessing
- TODO asynchronous try-on job API
- TODO identity/texture/logo preservation benchmarks
- TODO P1000-compatible low-memory path; otherwise allow remote GPU worker without changing API

## Phase 5 — Product and store integration
- TODO Generic REST product provider
- TODO CSV provider
- TODO iMonitor adapter
- TODO product/variant/color/size normalization
- TODO local offline cache

## Phase 6 — Production
- TODO SQLite/PostgreSQL persistence
- TODO sessions/events
- TODO admin runtime/model health
- TODO installer packaging
- TODO Docker CPU profile
- TODO GPU worker profile
- TODO CI tests and release artifacts

## Definition of DONE
A feature is DONE only when a real implementation exists, can be executed from a clean clone, and has no fabricated inference values in its production path.

- DONE resilient garment fallback: local garment remains visible if an inference request temporarily fails; real pose takes over automatically when API recovers
- DONE MediaPipe inference serialization for concurrent live/salon access
- DONE live hair-color preview preserving camera texture; photorealistic hairstyle synthesis remains TODO
