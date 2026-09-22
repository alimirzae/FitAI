# FitAI - Project Memory & Architectural Decisions

## Decision Log

### Decision 001: Execute-First Web Platform Architecture
- **Date**: 2026-09-22
- **Context**: Repository was imported as an architectural specification blueprint with only `README.md`.
- **Decision**: Implemented high-performance React 18 + Vite + Tailwind CSS single-page application with modular provider abstractions (`IVirtualTryOnProvider`, `IPoseProvider`, `IHairProvider`, `IBodyAnalysisProvider`) matching Section 6.

### Decision 002: Fabric Material Drape Conditioning
- **Date**: 2026-09-22
- **Context**: User asked if garment fabric material affects try-on rendering or if a single formula is used.
- **Decision**: Fabric material physics (drape weight, sheen, elasticity, opacity) decisively affects real-time rendering. Added explicit fabric property tracking (`silk`, `wool`, `leather`, `denim`, `velvet`, `linen`, `technical`) with adaptive drape simulation.

### Decision 003: Bilingual Localization (EN / FA) & Dynamic Role Booting
- **Date**: 2026-09-22
- **Context**: Requirement for full English (LTR) and Persian (RTL) support plus configurable default startup modes for clothing stores vs. beauty salons vs. storefront displays.
- **Decision**: Built complete translation dictionary with dynamic `dir="rtl"` / `dir="ltr"` toggling and persistent `localStorage` role configuration.

### Decision 004: CPU-Based Real-Time Face Biometrics & Profile Recall
- **Date**: 2026-09-22
- **Context**: User requested automatic facial recognition of returning boutique customers with recall of previous preferences, sizing, and style history, running on CPU without requiring GPU.
- **Decision**: Implemented `FaceRecognitionService` executing geometric facial landmark embedding and vector distance similarity locally on CPU, with customer profile persistence and instant favorite item recall.

### Decision 005: Real-Time Live Camera Try-On & Smart Size Recommendation
- **Date**: 2026-09-22
- **Context**: User required live real-time camera try-on on the incoming webcam stream (not only static photo try-on), customer color variation selection, store owner fabric definition, and automated body dimension sizing.
- **Decision**: Built `LiveCameraTryOn` component running at 30-60 FPS on CPU via Canvas 2D frame processor with torso tracking and cloth physics shaders. Integrated `SizeRecommendationService` to output exact XS-XXL sizing, shoulder width, chest, and waist in centimeters. Created Store Owner Inventory Manager for boutique fabric and pricing control.
