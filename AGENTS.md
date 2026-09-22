# FitAI AI-Agent Instructions

1. Read README.md, memory/PROJECT_MEMORY.md, roadmap/ROADMAP.md, docs/IMPLEMENTATION_STATUS.md and docs/licenses/MODEL_LICENSE_MATRIX.md.
2. Never convert a demo/mock value into a claimed AI inference.
3. Preserve provider abstraction and CPU fallback.
4. Optimize for 16 GB RAM / Quadro P1000 4 GB.
5. Do not add proprietary cloud services as core dependencies.
6. Verify code license and checkpoint license separately.
7. Keep unsupported features explicit via capability flags.
8. Update roadmap, memory and implementation status with every meaningful capability change.
9. Prefer small testable commits.
10. A clean clone must remain installable and runnable.

11. Until the camera-abstraction milestone is implemented, use the laptop/standard RGB webcam as the reference input.
12. Kinect v2 and future RGB-D support must be optional providers. Never leak vendor SDK types into core AI/domain APIs.
13. Any RGB-D provider must normalize data into FitAI RGB/depth/calibration capability contracts and preserve RGB-only fallback.
