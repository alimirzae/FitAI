"""End-to-end virtual try-on pipeline.

    photo -> pose -> agnostic mask -> letterbox -> engine -> restore -> composite

Every stage is separated so it can be inspected or replaced. The final
composite step matters more than it looks: diffusion decoders shift colour
across the whole frame, so unmasked pixels are restored from the customer's
real photograph. The face, skin tone and background therefore stay exactly as
the camera saw them, and only the garment region is synthesized.
"""

from __future__ import annotations

import io
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np
from PIL import Image

from .engine import GenerationRequest, VtoEngine, get_engine
from .preprocess import (
    CATEGORIES,
    PoseUnavailable,
    build_agnostic_mask,
    composite_result,
    detect_pose,
    fit_canvas,
    fit_mask,
)

# Multiples of 8 are required by the VAE; portrait suits a standing customer.
DEFAULT_RESOLUTION = (768, 1024)


@dataclass
class TryOnResult:
    image: Image.Image
    mask: Image.Image
    engine: str
    latency_ms: float
    category: str

    def to_png(self) -> bytes:
        buffer = io.BytesIO()
        self.image.save(buffer, format="PNG")
        return buffer.getvalue()


def trim_garment_border(garment: Image.Image, margin: float = 0.03) -> Image.Image:
    """Crop away the uniform background around a product shot.

    Both engines read the whole garment frame, so background is not free: a
    garment occupying a third of its photo spends two thirds of the
    conditioning signal describing the backdrop. Product shots are usually
    mostly backdrop.

    The background colour is taken from the border rather than assumed white,
    so this works on a dark studio sweep as well as a white one. If the result
    would be implausible - almost the whole frame, or almost none of it - the
    original is returned untouched rather than guessing.
    """
    arr = np.asarray(garment.convert("RGB")).astype(np.int16)
    h, w = arr.shape[:2]

    border = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    background = np.median(border, axis=0)
    distance = np.abs(arr - background).sum(axis=2)

    # Scale the threshold to the image's own contrast so a low-contrast garment
    # on a near-matching backdrop is not thrown away.
    threshold = max(40.0, float(np.percentile(distance, 92)) * 0.25)
    subject = distance > threshold

    covered = subject.mean()
    if not 0.01 < covered < 0.97:
        return garment

    ys, xs = np.nonzero(subject)
    pad_x, pad_y = int(w * margin), int(h * margin)
    box = (max(0, int(xs.min()) - pad_x), max(0, int(ys.min()) - pad_y),
           min(w, int(xs.max()) + pad_x + 1), min(h, int(ys.max()) + pad_y + 1))

    if (box[2] - box[0]) < w * 0.15 or (box[3] - box[1]) < h * 0.15:
        return garment
    return garment.crop(box)


def prepare_garment(garment: Image.Image, target: tuple[int, int]) -> Image.Image:
    """Put the garment photo on a clean neutral field.

    Product shots arrive with arbitrary aspect ratios and backgrounds. The
    border is trimmed so the garment fills the frame, then padded (rather than
    stretched) so its real proportions survive - which is what the
    conditioning model reads.
    """
    fitted, _ = fit_canvas(trim_garment_border(garment), target, fill=(255, 255, 255))
    return fitted


def run_tryon(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: str = "upper",
    engine: Optional[VtoEngine] = None,
    engine_name: str = "auto",
    steps: int = 30,
    guidance: float = 6.0,
    seed: Optional[int] = None,
    resolution: Optional[tuple[int, int]] = None,
    mask_profile: Optional[str] = None,
) -> TryOnResult:
    """Dress ``person_image`` in ``garment_image``.

    Raises ``PoseUnavailable`` when no usable person is visible and
    ``EngineError`` when the generator itself fails. It never falls back to
    drawing artwork: a failed try-on must surface as a failure.
    """
    if category not in CATEGORIES:
        raise ValueError(f"category must be one of {CATEGORIES}, got {category!r}")

    started = time.perf_counter()
    person = person_image.convert("RGB")

    engine = engine or get_engine(engine_name)

    # The engine decides both of these. A warping engine needs a mask that
    # stops where the garment really ends, and working below the resolution a
    # model was trained at is the difference between fabric that reads as worn
    # and fabric that reads as painted on.
    resolution = resolution or engine.native_resolution
    mask_profile = mask_profile or engine.mask_profile

    landmarks, silhouette = detect_pose(person)
    mask = build_agnostic_mask(person.size, landmarks, category,
                               person_mask=silhouette, profile=mask_profile)

    canvas, placement = fit_canvas(person, resolution)
    canvas_mask = fit_mask(mask, placement)
    generated = engine.generate(GenerationRequest(
        person=canvas,
        mask=canvas_mask,
        garment=prepare_garment(garment_image, resolution),
        category=category,
        steps=steps,
        guidance=guidance,
        seed=seed,
        resolution=resolution,
    ))

    restored = placement.restore(generated.resize(resolution, Image.LANCZOS))
    final = composite_result(person, restored, mask)

    return TryOnResult(
        image=final,
        mask=mask,
        engine=engine.name,
        latency_ms=(time.perf_counter() - started) * 1000,
        category=category,
    )


__all__ = ["TryOnResult", "run_tryon", "prepare_garment", "PoseUnavailable", "DEFAULT_RESOLUTION"]
