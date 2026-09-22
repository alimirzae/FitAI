# FitAI Project Memory

## Product
Standalone open-source-first intelligent virtual appearance platform. iMonitor/ERP is optional integration only.

## Hardware baseline — 2026-09-22
Development/edge target: Windows, 16 GB RAM, NVIDIA Quadro P1000 4 GB VRAM.

## Runtime decision
Always-on person understanding is CPU-first. Real local runtime uses FastAPI + OpenCV + MediaPipe. Pose has 33 landmarks; segmentation and face detection are real inference. GPU remains available for optional ONNX/generative providers. Never load multiple heavy pipelines concurrently on 4 GB VRAM.

## Truthfulness rule
The original frontend contained simulated AI outputs. Production code must not label simulations as inference. Roadmap distinguishes DONE, PROTOTYPE and TODO. Unsupported capabilities return false/null.

## Body measurements
Current body geometry is normalized image geometry only. Do not present shoulder/chest/waist values as centimeters until camera calibration/reference scaling is implemented.

## Face
Face detection is implemented. Face identity, returning-customer recognition, age/presentation and emotion inference are not production capabilities yet.

## VTON
Canvas garment overlay is a prototype, not generative virtual try-on. A production VTON provider must pass checkpoint/license review and a 4 GB VRAM benchmark or run as a separate worker.

## Agent workflow
Before changing AI: read README, memory, roadmap, architecture and model-license matrix; inspect current provider; preserve CPU fallback; update capability flags; add tests; update docs/memory/roadmap in the same change.

## Camera strategy — 2026-09-22
Current development must continue with the laptop/standard RGB webcam. The user also owns an Xbox One Kinect (Kinect v2), which is a planned Windows RGB-D provider using Microsoft Kinect for Windows SDK 2.0. Do not make Kinect SDK a required dependency yet.

Architecture must evolve toward an ICameraProvider / UnifiedFrame abstraction. Unified frames may contain RGB plus optional depth, calibration/intrinsics and hardware body data. AI/person/try-on modules must never depend directly on Kinect SDK classes. This allows future RGB-D cameras to be added as providers.

Planned Kinect/RGB-D uses include person distance, depth-assisted segmentation, calibration, improved body geometry/metric measurement research and optional skeleton fusion. RGB webcam mode must always remain supported.


## Appearance step 2 decision — 2026-09-22
Keep the immediate low-resource path deterministic: real MediaPipe pose drives articulated torso/sleeve AR. Never treat full-person catalog photography as a garment texture. Next implement an isolated transparent garment/mask contract and piecewise affine/TPS warping, then optional generative VTO.

Salon uses real Face Mesh geometry for a scalp-guided preview. This is not semantic hair segmentation; a reviewed hair-mask provider is required before claiming pixel-level hair detection. Generative hairstyle transfer remains a separate optional provider.


## Complete Look v1 — 2026-09-22
The first concrete appearance assets are Classic Shirt v1 and Classic Short Hair v1, both repository-owned SVG assets. Shirt rendering uses real pose anchors and articulated sleeves; hair rendering uses live face geometry. They are local deterministic AR, not generative AI. Keep labels truthful.

A critical rendering rule is now fixed: never force webcam frames into a 3:4/720x960 canvas. Canvas dimensions must follow the actual camera videoWidth/videoHeight and preserve natural aspect ratio. This fixed the visibly tall/stretched person in fitting-room mode.

Next appearance milestone is generalized isolated-garment preprocessing + mask contract, occlusion-aware/TPS warp, and semantic hair segmentation. Only after those baselines are stable should heavy generative VTO/hair providers be enabled.


## Reference-quality correction — 2026-09-22
User rejected the old dashboard-heavy UI and the polygon/cartoon appearance overlays. Fitting Room should follow the cleaner approved concept: large central mirror, restrained catalog panel, selected-look panel, less telemetry clutter.

Do not reintroduce flat torso polygons or painted hair as if they were realistic try-on. Garment baseline now uses the real person segmentation mask plus a transparent garment compositor. Hair transformation stays disabled until a real reviewed segmentation/synthesis provider is available. The quality target is photographic, not illustrative.

## Live runtime resilience — 2026-09-22
A frontend-only camera is not sufficient: startup must verify backend health. Do not make garment visibility depend on a single inference request. Keep live pose/face payloads small, serialize MediaPipe Solution access, and use graceful visual fallback. Hair color preview may preserve real camera texture, but it must not be described as hairstyle synthesis.

## Photorealistic try-on implemented — 2026-09-22
`backend/vto/` is now the real try-on path, replacing scaffolding that only
shelled out to an unset command. The pipeline is pose -> agnostic mask ->
letterbox -> engine -> restore -> composite.

Two rules are encoded in the design and must not be relaxed. First, the mask
decides the quality: it must cover everywhere a looser garment could fall, and
must never cover face, hair or hands. Second, unmasked pixels are restored
from the original photograph after generation, because diffusion decoders
shift colour globally and would otherwise alter the customer's face and skin
tone.

Engines: `diffusers-inpaint` (SD inpainting + IP-Adapter, permissive licences,
~6 GB VRAM, installable from `backend/requirements-vto.txt`) and `external`
(a separately installed CatVTON/IDM-VTON checkout via `FITAI_VTO_COMMAND`).
No model weights are vendored. When no engine is available the API returns 503
and the UI says so; artwork is never substituted.

Garment inputs must be isolated product photos. The Unsplash entries in
`src/data/catalog.ts` are full-person photography and are not usable as
garment assets; `public/assets/garments/manifest.json` is the try-on catalog.

Metric measurement now exists (`backend/vto/measure.py`) and honours the
earlier rule: no centimetre value is reported until a known-height calibration
is performed, and calibration is void if camera, zoom or standing mark change.

STILL UNVERIFIED: no real generated image has been produced. The geometry and
wiring are covered by 39 CPU-only tests using a stub engine, but the first run
against actual weights on real GPU hardware has not happened.

## Hardware correction — 2026-09-22
The development machine's GPU is an NVIDIA RTX 4060 Laptop with 8 GB VRAM, not
the Quadro P1000 4 GB recorded above. The 4 GB constraint that shaped earlier
decisions does not apply to this machine. Its Python is 3.10, while the
backend requires 3.11/3.12 for MediaPipe, so the backend has not been run
there yet.

## Photorealistic rendering decision — 2026-09-22
Canvas/SVG overlays are diagnostic only and must not be presented as VTO. Production uses real model providers via /api/v1/render/vto and /api/v1/render/hair. P1000 runs tracking/reprojection; neural synthesis is keyframe/worker based. Physically accurate cloth requires garment mesh/pattern plus material parameters. Do not bundle NC VTO checkpoints in commercial FitAI.
