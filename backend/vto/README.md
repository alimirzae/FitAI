# Photorealistic virtual try-on

This package is the real try-on path. It does not draw garments; it repaints a
masked region of the customer's photograph with a generative model.

```
photo -> pose -> agnostic mask -> letterbox -> engine -> restore -> composite
```

| Module | Responsibility |
|---|---|
| `preprocess.py` | pose landmarks, the agnostic mask, letterboxing, final compositing |
| `engine.py` | generation engines and their availability |
| `pipeline.py` | the end-to-end flow |
| `runner.py` | command-line entry point |
| `measure.py` | calibrated metric measurement and size suggestion |

## Why the mask decides the quality

A diffusion try-on model repaints what you erase. The mask therefore must
cover everywhere the *new* garment could fall — including a margin past the
body, because a new garment may be looser than the one being worn — while
never covering the face, hair or hands. `build_agnostic_mask` builds it from
real pose landmarks and clips it against the MediaPipe segmentation mask so
the model repaints the person rather than the room.

After generation, `composite_result` restores every pixel outside the mask
from the original photograph. Diffusion decoders shift colour across the whole
frame; without this step the customer's face and skin tone come back subtly
wrong.

## Weights

    python scripts/fetch_vto_weights.py --check      # what is already cached
    python scripts/fetch_vto_weights.py --diagnose   # which network hop works
    python scripts/fetch_vto_weights.py              # download what is missing

The Hugging Face API and the file CDN are different hosts and fail
independently. On a restricted network the symptom is confusing: metadata
loads, then the download dies with an SSL error partway through building the
pipeline. `--diagnose` separates the two hops so the answer is unambiguous.

If the CDN is blocked where the store is, fetch the weights on any other
machine and copy the cache directory that `--check` prints. The engine loads
entirely offline once they are present.

## Engines

    python -m backend.vto.runner --status

**`diffusers-inpaint`** — Stable Diffusion inpainting with IP-Adapter garment
conditioning. Installs entirely from PyPI and Hugging Face, fits in roughly
6 GB of VRAM, and is what a clean clone can actually run:

    .venv\Scripts\python -m pip install -r backend/requirements-vto.txt

**`external`** — delegates to a separately installed research checkout
(CatVTON, IDM-VTON, StableVITON). Those reproduce fine garment detail such as
prints and logos more faithfully, but their checkpoints are CC BY-NC-SA 4.0
and are **not licensed for commercial use** — see
`docs/licenses/MODEL_LICENSE_MATRIX.md`. FitAI vendors neither that code nor
those weights. Point at your own install:

    set FITAI_VTO_COMMAND=python C:/models/CatVTON/infer.py --person {person}
      --cloth {garment} --mask {mask} --output {output} --cloth_type {category}

Template placeholders: `{person}` `{mask}` `{garment}` `{output}`
`{category}` `{steps}` `{seed}`.

`auto` prefers a configured external engine, then falls back to the diffusers
baseline. When neither is available the API returns 503 and the UI says the
renderer is unavailable. **FitAI never substitutes artwork for a failed
render.**

## Garment assets

The garment input must be an **isolated product photo** — a flat lay or
ghost-mannequin shot of the garment alone. A photo of a model wearing the item
is not a garment asset: the generator will try to carry the model's body
across with the clothing. The Unsplash URLs in `src/data/catalog.ts` are
full-person reference photography and are deliberately excluded from
`public/assets/garments/manifest.json`.

## Measurement

`measure.py` refuses to report centimetres until the camera is calibrated,
which satisfies the rule recorded in `memory/PROJECT_MEMORY.md`. Calibration
is one person of known height standing fully in frame on a marked spot; it is
void if the camera, zoom or standing mark changes.

Size thresholds in `sizes.json` are distances between MediaPipe *joint*
landmarks, not tailoring measurements, and must be retuned against real
customers before a store relies on them.

## Tests

    python -m pytest backend/tests -q

They run on numpy + Pillow alone — no GPU, no weights, no camera — using the
in-repo reference pose in `backend/tests/fixtures.py`. The generator is
replaced by a recording stub, so what is verified is the geometry, the
round-trip back onto the original photo, and the guarantee that failures
surface as failures.
