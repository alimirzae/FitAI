# Local AI Runtime

Target: Windows + 16 GB RAM + Quadro P1000 4 GB.

## Real capabilities
FastAPI, OpenCV camera/image I/O, MediaPipe 33-point pose, person segmentation, face detection, normalized body geometry, RAM/GPU telemetry.

## Explicitly not implemented yet
Metric body measurements, face identity, age/presentation inference, emotion inference, production generative VTON and production hair synthesis.

## API
GET /api/v1/health
GET /api/v1/system
POST /api/v1/person/analyze
GET /api/v1/camera/stream?camera=0

## Performance profile
Use 720p capture but perform inference on resized frames when necessary. Do not reserve GPU memory for always-on pose. For live UI, infer approximately 8–15 times/second and render at browser refresh rate using the latest landmarks.

## Install
Windows: run scripts/run-local.ps1 after Python 3.11 and Node.js are installed. The script creates .venv, installs backend requirements, installs npm packages if necessary, starts backend and frontend.

## Capability contract
Every response includes capabilities. UI and agents must inspect these flags rather than assuming a feature exists.
