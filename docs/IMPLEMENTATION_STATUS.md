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
