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


def prepare_garment(garment: Image.Image, target: tuple[int, int]) -> Image.Image:
    """Put the garment photo on a clean neutral field.

    Product shots arrive with arbitrary aspect ratios and backgrounds. Padding
    (rather than stretching) keeps the garment's real proportions, which is
    what the conditioning model reads.
    """
    fitted, _ = fit_canvas(garment, target, fill=(255, 255, 255))
    return fitted


def run_tryon(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: str = "upper",
    engine: Optional[VtoEngine] = None,
    engine_name: str = "auto",
    steps: int = 30,
    guidance: float = 2.5,
    seed: Optional[int] = None,
    resolution: tuple[int, int] = DEFAULT_RESOLUTION,
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

    landmarks, silhouette = detect_pose(person)
    mask = build_agnostic_mask(person.size, landmarks, category, person_mask=silhouette)

    canvas, placement = fit_canvas(person, resolution)
    canvas_mask = fit_mask(mask, placement)

    engine = engine or get_engine(engine_name)
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
