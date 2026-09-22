# FitAI Project Memory

## 2026-09-22 — Local runtime audit
The repository previously contained a polished React prototype whose AI-facing services returned simulated landmarks, expressions, confidence values and generated try-on results.

Decision:
- introduce a real local FastAPI/OpenCV runtime;
- make CPU execution the guaranteed baseline;
- treat NVIDIA GPU acceleration as optional;
- target the user's 16 GB RAM / Quadro P1000 4 GB workstation;
- never fabricate age, gender/presentation, emotion, pose or segmentation outputs when a real provider is unavailable;
- expose capability flags so the frontend can distinguish implemented inference from mock/demo behavior.

Heavy diffusion/VTON inference remains a separate future provider because 4 GB VRAM is a hard constraint.
