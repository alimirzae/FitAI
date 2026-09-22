# FitAI - Architecture & Technical Blueprint

## Overview
FitAI is a modular, AI-first platform for virtual try-on, smart mirrors, salon styling, and interactive storefront installations.

```
Camera / Live Feed / Image
          ↓
  Person Understanding (BlazePose 33-pt + BiSeNet-V2 Segmentation)
          ↓
  Appearance & Demographic Inference (InsightFace ONNX)
          ↓
  Virtual Transformation Engine
  ┌─────────────────┬───────────────────┬────────────────────┐
  │ CatVTON Engine  │ Body Warp Mesh    │ HairFast-GAN Tint  │
  │ (Fabric-Aware)  │ (0-10% Slim/Fit)  │ & Style Synthesis  │
  └─────────────────┴───────────────────┴────────────────────┘
          ↓
  Recommendation & Campaign Engine (Contextual Re-ranking)
          ↓
  Section 12 Preference Confidence Engine
  (Explicit Feedback 40% + Dwell Time 20% + Revisit 15% + Interaction 15% + Expression 10%)
          ↓
  Anonymous Telemetry & Real-Time Analytics
```

## Fabric Physics in Virtual Try-On
Fabric material properties are critical for realistic virtual draping:
1. **Bending Rigidity & Drape Factor**: Heavy wool and denim exhibit structured, angular folds. Silk, chiffon, and satin flow fluidly along body curvature.
2. **Surface Reflectance & BRDF**: Leather and latex require specular highlights, velvet exhibits retro-reflective sheen, while cotton and linen disperse diffuse light.
3. **Tensile Elasticity**: Athleisure and stretch-fabrics compress to muscular contours, whereas tailored coats maintain independent boxy silhouettes.

FitAI encodes fabric profiles (`silk`, `wool`, `leather`, `denim`, `velvet`, `linen`, `synthetic`) directly into the inference conditioning layer.
