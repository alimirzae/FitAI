# FitAI Architecture

## Runtime topology
Browser UI -> Local FastAPI -> Provider layer -> OpenCV / MediaPipe / optional ONNX providers.

The application is standalone. ERP/iMonitor integration is an adapter, never a dependency of AI services.

## Current real pipeline
Camera or image -> decode -> MediaPipe Pose (33 landmarks) -> MediaPipe person segmentation -> face detection -> normalized body geometry -> API DTO -> frontend.

No production path may invent confidence, pose, demographic, identity or emotion values.

## Target hardware profile
Windows workstation, 16 GB RAM, NVIDIA Quadro P1000 4 GB VRAM. The always-on vision path is CPU-first. GPU is reserved for optional models that demonstrably fit in memory. Heavy models must be loaded one at a time.

## Provider boundaries
IPoseProvider; IHumanSegmentationProvider; IFaceDetectionProvider; IFaceIdentityProvider; IBodyAnalysisProvider; IVirtualTryOnProvider; IHairProvider; IProductProvider.

Unsupported providers must return unavailable/capability=false rather than fake output.

## Performance strategy
Analyze camera at a lower inference rate than display FPS; reuse/smooth landmarks between inference frames; resize inference input; avoid concurrent diffusion pipelines; expose latency and capability telemetry.

## Privacy
Raw camera frames are ephemeral by default. Identity recognition is optional and must never be required for fitting-room operation.
