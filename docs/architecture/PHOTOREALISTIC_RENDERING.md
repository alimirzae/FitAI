# Photorealistic Rendering

The old Canvas/SVG overlay is a diagnostic AR fallback, not Virtual Try-On.

## Two-rate pipeline
1. Tracking 8–15 Hz: pose, face mesh, segmentation.
2. Display 30–60 FPS: camera + smoothed geometry.
3. Photorealistic keyframes: a real VTO/hair-transfer model synthesizes frames; results are held/reprojected between keyframes.

Diffusion VTO is not a 30–60 FPS workload on Quadro P1000 4 GB.

## Professional garment contract
Each SKU should provide an isolated front image, optional back image, category, material metadata and optional 2D garment landmarks. For physically correct draping, add a 3D garment mesh/pattern and material parameters (stretch, bend, density, damping). A JPEG alone cannot determine real cloth mechanics.

## Implementation
`backend/vto/` implements the path end to end:

    photo -> pose -> agnostic mask -> letterbox -> engine -> restore -> composite

Two steps carry most of the quality. The **agnostic mask** decides what the
model repaints: it must cover everywhere a looser garment could fall, extend a
little past the silhouette, and never cover face, hair or hands. The final
**composite** restores every unmasked pixel from the original photograph,
because diffusion decoders shift colour globally and would otherwise change the
customer's face and skin tone.

Aspect ratio is preserved by letterboxing rather than stretching. Squeezing a
standing person into a square model input is one of the most common causes of
unnatural output.

## Engines
`diffusers-inpaint` — Stable Diffusion inpainting with IP-Adapter garment
conditioning. Permissive/OpenRAIL licences, installs from
`backend/requirements-vto.txt`, ~6 GB VRAM. This is the baseline a clean clone
can run.

`external` — a separately installed CatVTON/IDM-VTON/StableVITON checkout
driven by `FITAI_VTO_COMMAND`. Reproduces fine garment detail (prints, logos)
more faithfully, but those checkpoints are CC BY-NC-SA 4.0 and are not
licensed for commercial use. FitAI vendors neither the code nor the weights.

## API
POST /api/v1/render/vto: person + garment + category -> synthesized PNG
POST /api/v1/render/hair: person + hairstyle reference -> synthesized PNG
GET /api/v1/render/providers: engine availability

Availability is reported from the engine registry, and the `photorealistic_vto`
health capability follows it, so the UI can never claim a capability the
machine lacks. FitAI must never silently substitute artwork when a real
provider is unavailable: a failed render surfaces as 503 or 422.

## Garment assets
The garment input must be an isolated product photo — flat lay or ghost
mannequin. A photo of a model wearing the item is not a garment asset; the
generator will try to carry the model's body across with the clothing.

## Deployment
Diffusion VTO is not a 30–60 FPS workload on any single consumer GPU, so the
UI is capture-then-render rather than live. The baseline engine needs about
6 GB of VRAM at 768x1024; below that it falls back to sequential CPU offload,
which works but is slow. CPU-only generation takes minutes per image.
