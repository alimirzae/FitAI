# FitAI Local AI Runtime

## Goal
FitAI must remain usable on a 16 GB RAM workstation with an NVIDIA Quadro P1000 (4 GB VRAM).

## Runtime policy
- CPU is the guaranteed baseline.
- NVIDIA CUDA is optional, never mandatory for startup.
- Heavy diffusion/VTON models are not loaded by default.
- Camera analysis uses frame skipping to maintain interactivity.
- APIs must report unsupported capabilities honestly rather than synthesizing fake results.

## Current real pipeline
- Image decode: OpenCV
- Person detection: OpenCV HOG/SVM baseline
- Face detection: OpenCV Haar cascade baseline
- Camera capture: OpenCV VideoCapture
- Local REST runtime: FastAPI/Uvicorn
- GPU/RAM telemetry: nvidia-smi + psutil

## Next providers
The API contract intentionally exposes capability flags. Future providers should implement:
- lightweight pose estimation
- human segmentation
- YuNet face detection
- SFace embeddings
- optional ONNX Runtime acceleration

Each provider must keep a CPU fallback and must pass license review before becoming a production dependency.
