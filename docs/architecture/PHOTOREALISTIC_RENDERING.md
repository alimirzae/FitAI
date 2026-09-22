# Photorealistic Rendering

The old Canvas/SVG overlay is a diagnostic AR fallback, not Virtual Try-On.

## Two-rate pipeline
1. Tracking 8–15 Hz: pose, face mesh, segmentation.
2. Display 30–60 FPS: camera + smoothed geometry.
3. Photorealistic keyframes: a real VTO/hair-transfer model synthesizes frames; results are held/reprojected between keyframes.

Diffusion VTO is not a 30–60 FPS workload on Quadro P1000 4 GB.

## Professional garment contract
Each SKU should provide an isolated front image, optional back image, category, material metadata and optional 2D garment landmarks. For physically correct draping, add a 3D garment mesh/pattern and material parameters (stretch, bend, density, damping). A JPEG alone cannot determine real cloth mechanics.

## API
POST /api/v1/render/vto: person + garment -> synthesized PNG
POST /api/v1/render/hair: person + hairstyle reference -> synthesized PNG
GET /api/v1/render/providers: availability

Models connect through FITAI_VTO_COMMAND and FITAI_HAIR_COMMAND. FitAI must never silently substitute artwork when a real provider is unavailable.

## Deployment
P1000 4 GB handles tracking/reprojection. Photorealistic refinement is a low-rate worker on this GPU. A stronger local GPU or inference server is required for high-rate neural synthesis.
