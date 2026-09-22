# Implementation Status

## Runnable now
Frontend, local API, image analysis, webcam stream, pose landmarks, person segmentation, face detection, normalized body geometry, hardware telemetry.

## Prototype only
Canvas clothing overlay, fabric visual effects, body transformation UI, salon previews, preference/demo flows.

## Not implemented
Metric anthropometry, biometric identity, production VTON, production hair synthesis, demographics/emotion inference, persistence, queue/worker, iMonitor catalog adapter.

## Acceptance rule
Do not move an item to runnable/completed until it has real code, clean-clone installation instructions and a reproducible test.

## Cameras
- RUNNABLE: laptop/standard USB RGB webcam
- PLANNED: camera-provider abstraction and device selection
- PLANNED: Xbox One Kinect / Kinect v2 RGB-D provider via Microsoft Kinect for Windows SDK 2.0
- PLANNED: generic RGB-D provider contract for additional cameras
- RULE: Kinect/RGB-D dependencies must remain optional and must not break RGB-only installation.

## Runtime diagnostics — 2026-09-22
- Header latency is now measured from the real backend health request instead of a hard-coded value.
- A persistent API/CAM diagnostic badge is shown in the UI.
- Browser console logs camera start/failure and backend health.
- Live try-on shows real inference latency/errors.
- Windows launcher starts Uvicorn with debug + access logs.
- SalonMode remains a prototype using catalog images; it is not yet wired to the live camera. Do not interpret camera activation while on SalonMode as a salon camera pipeline.

## Visible CV baseline — 2026-09-22
- Live fitting room now renders real MediaPipe pose landmarks/skeleton over the camera.
- A vector AR garment follows real shoulders/hips so tracking can be tested without pretending catalog photos are VTO-ready assets.
- Existing Unsplash catalog photos are reference/product photos, not transparent garment masks; their texture overlay is intentionally low-opacity.
- Salon now supports the shared live camera and real face detection. Current hair color overlay is a geometric preview only, not HairFast-GAN/generative hair synthesis.
- Production garment VTO requires garment preprocessing/masks or a reviewed VTON provider. Production hairstyle transfer requires a reviewed hair synthesis provider.


## Appearance step 2 — 2026-09-22
- Live garment baseline now articulates torso and sleeves from real shoulder/hip/elbow/wrist landmarks.
- Full-person catalog photos are not painted onto the body; transparent garment assets/masks are the next asset requirement.
- Salon uses real MediaPipe Face Mesh. Hair color preview follows upper-face/scalp geometry instead of the old forehead ellipse.
- Hair preview is NOT semantic hair segmentation and NOT generative hairstyle synthesis.
- CatVTON/face identity registry entries are no longer shown as active runtime capabilities without implementation/verification.


## Complete Look v1 — 2026-09-22
- Added repository-owned transparent `Classic Shirt v1` asset and a live renderer anchored to real shoulders/hips with articulated sleeves following elbows/wrists.
- Added repository-owned transparent `Classic Short Hair v1` asset. Salon fits it above the detected face and applies the selected hair color locally.
- Fixed camera geometry in live fitting room and Salon: render surfaces now use the camera's real videoWidth/videoHeight and 16:9/object-contain presentation instead of forcing 720x960 portrait stretching.
- Live fitting room includes garment opacity, snapshot and fullscreen controls. Existing product/color/size/catalog controls remain integrated.
- Salon keeps before/after comparison, hairstyle selection and color controls. The first actually rendered hairstyle is explicitly marked LOCAL AR.
- Removed the visible HairFast-GAN / fabricated 96.2% edge-preservation claim from the live Salon status.
- LIMIT: Classic Shirt v1 and Classic Short Hair v1 are deterministic local AR assets, not diffusion/generative synthesis. General catalog garments still require preprocessing/masks and generalized warp.


## Reference UI + compositor correction — 2026-09-22
- Rebuilt Fitting Room as a calmer three-column reference workspace: catalog, large live mirror, selected-look details. Removed the old fake customer-identification/centimeter-size UI from this production view.
- Backend now returns the real MediaPipe person segmentation mask as PNG/base64 with analysis results.
- Live garment rendering uses a transparent garment asset, pose-derived placement, luminance-preserving dye/shading and segmentation-mask occlusion instead of the previous flat torso polygon.
- The previous painted/cartoon hairstyle overlay has been removed. Salon does not fabricate transformed hair while a real hair segmentation/synthesis provider is absent.
- Remaining gap to photorealistic reference quality: generalized garment preprocessing + TPS/piecewise deformation and a reviewed generative VTO provider; for Salon, semantic hair segmentation + reviewed hairstyle synthesis.

## Photorealistic try-on pipeline — 2026-09-22
- `backend/vto/` implements the real try-on path end to end: pose -> agnostic
  mask -> letterbox -> generative engine -> restore -> composite.
- Two real engines behind one contract. `diffusers-inpaint` (SD inpainting +
  IP-Adapter garment conditioning) installs from `backend/requirements-vto.txt`
  and runs in roughly 6 GB VRAM. `external` delegates to a separately installed
  CatVTON/IDM-VTON checkout via `FITAI_VTO_COMMAND`. No weights are vendored.
- `/api/v1/render/vto` now runs the pipeline and takes a garment category.
  `/api/v1/render/providers` and the `photorealistic_vto` health capability are
  reported from the engine registry, so the UI cannot claim a capability the
  machine does not have. A failed render returns 503/422; it is never replaced
  with drawn artwork.
- New `simple_tryon` screen is the default mode: photo -> garment -> result.
- `backend/vto/measure.py` adds calibrated metric measurement and size
  suggestion. Centimetres stay `None` until a known-height calibration is done,
  per the PROJECT_MEMORY truthfulness rule.
- 39 tests run in CI on numpy + Pillow only: no GPU, no weights, no camera.
- CORRECTION: the development machine's GPU is an RTX 4060 Laptop (8 GB), not
  the Quadro P1000 4 GB recorded earlier. 8 GB changes what is feasible locally.

## Try-on verified against a real photograph — 2026-09-22
Run on Python 3.10 + mediapipe 0.10.20 + torch 2.5.1+cu121, RTX 4060 8 GB.

RUNNABLE, verified on an actual person photo:
- MediaPipe pose on a real photo: 33 landmarks, 28 clearly visible.
- Agnostic mask for all three categories: torso/sleeves for `upper` stopping at
  the neck line, the full flared skirt for `lower`, neck-down for `overall`.
  Face and hair untouched in every category.
- Metric measurement correctly WITHHELD height because the subject's feet were
  outside the frame, which is the intended behaviour.
- 41 CPU-only tests green.

Two real bugs were found by that run and fixed; neither was visible against
the synthetic reference pose:
- MediaPipe `model_complexity=2` aborts with an access violation (0xC0000005)
  on mediapipe 0.10.20 / Windows. Default is now complexity 1, overridable via
  `FITAI_POSE_COMPLEXITY`. This also means the launcher's Python 3.11/3.12
  requirement should NOT be relaxed on the basis that pose works on 3.10.
- The mask was built from the skeleton alone and missed a flared skirt's real
  hem, so the old garment would have survived the repaint. The segmentation
  silhouette is now unioned in, with pose deciding only which part of it the
  category owns.

STILL NOT VERIFIED: image generation. The weights could not be downloaded on
this network. `huggingface.co` is reachable, but every LFS download redirects
to `us.aws.cdn.hf.co`, which refuses the TLS connection - direct, through the
configured proxy at 127.0.0.1:10808, and under both OpenSSL (Python) and
schannel (curl). `hf-mirror.com` serves metadata but not LFS either. This is a
network reachability problem, not a code problem; `scripts/fetch_vto_weights.py
--diagnose` reports which hop fails, and `--check` prints the cache directory
so weights can be fetched elsewhere and copied in.

## Runtime resilience hotfix — 2026-09-22
- Removed per-frame base64 segmentation PNG from the 8 Hz analysis response; pose/face live transport is lightweight again.
- Serialized access to stateful MediaPipe graphs to prevent concurrent fitting-room/salon inference instability.
- Garment compositor now has a visible fallback placement and no longer disappears just because one AI request fails. Real pose tracking replaces fallback automatically when available.
- Salon now renders a live hair-color preview over the real camera texture. This is hair recoloring, not hairstyle synthesis; hairstyle generation remains pending a reviewed model/provider.
- Windows launcher now refuses to start the frontend until /api/v1/health confirms the backend is actually online.
