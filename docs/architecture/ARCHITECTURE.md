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

## Camera provider architecture
The current reference implementation is RGB-only and uses the laptop/USB webcam. Camera acquisition will be abstracted before RGB-D implementation.

```text
ICameraProvider
  |-- LaptopWebcam / OpenCV RGB
  |-- Kinect v2 / Xbox One (future)
  |-- Other RGB-D providers (future)
        |
        v
UnifiedFrame
  rgb: required
  depth: optional
  calibration: optional
  hardware_body: optional
  timestamp: required
        |
        v
Person Understanding / VTON / Body / Salon
```

Kinect v2 integration is planned for Windows through Microsoft Kinect for Windows SDK 2.0. SDK-specific objects must be converted at the provider boundary. Core services consume only FitAI DTOs. Future RGB-D devices must reuse the same contracts.

RGB-D is an enhancement, not a prerequisite: clean installation and normal operation must remain possible with a standard webcam only.


## Appearance rendering layers — 2026-09-22
1. CPU MediaPipe pose / face / Face Mesh.
2. Deterministic pose-aware AR for immediate live feedback.
3. Planned isolated transparent garment/hair assets with geometric warping.
4. Optional heavy generative VTO/hair workers only after license and target-hardware review.

The UI must distinguish these layers. Deterministic AR is not generative VTO. Face-Mesh-guided scalp geometry is not semantic hair segmentation.


## Complete Look v1 renderer
The first runnable appearance assets are stored locally under `public/assets/garments` and `public/assets/hair`. Classic Shirt v1 is a transparent garment torso asset combined with articulated sleeve geometry from shoulder/elbow/wrist landmarks. Classic Short Hair v1 is a transparent hairstyle asset positioned from live face geometry and color-tinted in Canvas.

Camera pixels are never stretched to a fixed portrait canvas. Canvas backing dimensions are synchronized to the real camera `videoWidth/videoHeight`; CSS uses natural aspect presentation. Future garment and hair providers must preserve this coordinate contract.

UI capabilities implemented around this renderer include product/color selection, fit opacity, live AI telemetry, before/after Salon view, hairstyle/color selection, snapshot and fullscreen. These deterministic AR renderers are a fast local layer beneath future TPS and optional generative providers.


## Realistic compositing contract — 2026-09-22
Person analysis now exposes a binary segmentation PNG mask in addition to pose/face geometry. The browser compositor uses this mask for foreground occlusion and uses a transparent garment source with pose-derived placement. This replaces the flat polygon prototype in the main fitting-room path.

Photorealistic output is a separate provider tier. The UI must never substitute a cartoon/vector hairstyle for an unavailable hairstyle synthesis model. When no reviewed hair provider is installed, Salon shows the live source and provider-unavailable state while retaining real face/Face Mesh analysis.
