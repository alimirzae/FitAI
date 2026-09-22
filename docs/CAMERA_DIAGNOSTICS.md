# Camera and AI Runtime Diagnostics

## Expected request path
Browser getUserMedia -> global HTMLVideoElement -> LiveCameraTryOn canvas -> JPEG frame -> POST /api/v1/person/analyze -> MediaPipe -> landmarks -> canvas overlay.

## What healthy logs look like
Browser console:
- CAMERA_STREAM_ACQUIRED
- VIDEO_READY or VIDEO_CAN_PLAY
- AI_FRAME_POST

Backend terminal:
- GET /api/v1/health 200
- repeated POST /api/v1/person/analyze 200

## Failure interpretation
- Camera LED on + no VIDEO_READY: browser/HTMLVideoElement attachment problem.
- VIDEO_READY + no AI_FRAME_POST: live component/inference timer problem.
- AI_FRAME_POST + no backend POST: API URL/CORS/network problem.
- backend POST 4xx/5xx: backend decoding/inference problem.
- backend POST 200 + AI OFFLINE: frontend response/render problem.

The UI live telemetry also displays video readiness and POST counter. This deliberately separates camera capture latency from MediaPipe inference latency.
