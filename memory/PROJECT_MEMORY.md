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
