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
