"""Metric body measurement from a single RGB camera.

PROJECT_MEMORY records the rule this module exists to satisfy: body geometry is
normalized image geometry only, and must not be presented in centimetres until
reference scaling exists. A single RGB camera cannot recover absolute scale on
its own, so this module never guesses. It requires an explicit calibration
step and returns ``None`` for every metric value until that has happened.

Calibration: one person of known height stands on a marked spot, fully in
frame. That fixes centimetres-per-pixel for anyone standing on the same mark
at the same camera setting. Move the camera, change the zoom or change the
standing mark, and the calibration is void.

The systematic error in the head-top estimate below largely cancels out,
because the same estimator is used during calibration and during measurement.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional, Sequence

from .preprocess import (
    ANKLE_L,
    ANKLE_R,
    EAR_L,
    EAR_R,
    HIP_L,
    HIP_R,
    NOSE,
    SHOULDER_L,
    SHOULDER_R,
    Landmark,
    as_landmarks,
)

HEEL_L, HEEL_R = 29, 30
FOOT_L, FOOT_R = 31, 32

SIZE_TABLE_PATH = Path(__file__).with_name("sizes.json")

# Fraction of the nose-to-shoulder distance added above the nose to reach the
# top of the head. MediaPipe has no crown landmark.
HEAD_TOP_FACTOR = 0.8

MIN_HEIGHT_CM, MAX_HEIGHT_CM = 80.0, 230.0


class NotCalibrated(RuntimeError):
    """A metric value was requested before calibration was performed."""


@dataclass(frozen=True)
class Calibration:
    cm_per_px: float
    reference_height_cm: float
    frame: tuple[int, int]

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Calibration":
        return cls(float(data["cm_per_px"]), float(data["reference_height_cm"]),
                   tuple(data["frame"]))  # type: ignore[arg-type]


@dataclass(frozen=True)
class Measurement:
    """Pixel measurements always; centimetres only when calibrated."""
    height_px: float
    shoulder_px: float
    hip_px: float
    full_body_visible: bool
    height_cm: Optional[float] = None
    shoulder_cm: Optional[float] = None
    hip_cm: Optional[float] = None

    @property
    def calibrated(self) -> bool:
        return self.height_cm is not None


def _px(lm: Landmark, frame: tuple[int, int]) -> tuple[float, float]:
    return lm.x * frame[0], lm.y * frame[1]


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(b[0] - a[0], b[1] - a[1])


def _head_top_y(lm: Sequence[Landmark], frame: tuple[int, int]) -> float:
    nose = _px(lm[NOSE], frame)
    shoulder_mid = (
        (_px(lm[SHOULDER_L], frame)[0] + _px(lm[SHOULDER_R], frame)[0]) / 2,
        (_px(lm[SHOULDER_L], frame)[1] + _px(lm[SHOULDER_R], frame)[1]) / 2,
    )
    return nose[1] - HEAD_TOP_FACTOR * _dist(nose, shoulder_mid)


def _foot_bottom_y(lm: Sequence[Landmark], frame: tuple[int, int]) -> Optional[float]:
    candidates = [
        _px(lm[i], frame)[1]
        for i in (HEEL_L, HEEL_R, FOOT_L, FOOT_R, ANKLE_L, ANKLE_R)
        if lm[i].visibility >= 0.4
    ]
    return max(candidates) if candidates else None


def measure(landmarks: Sequence[Landmark], frame: tuple[int, int],
            calibration: Optional[Calibration] = None) -> Measurement:
    """Measure a person. Centimetre fields stay ``None`` without calibration."""
    lm = as_landmarks(landmarks)

    head_y = _head_top_y(lm, frame)
    foot_y = _foot_bottom_y(lm, frame)
    shoulder_px = _dist(_px(lm[SHOULDER_L], frame), _px(lm[SHOULDER_R], frame))
    hip_px = _dist(_px(lm[HIP_L], frame), _px(lm[HIP_R], frame))

    visible = (
        foot_y is not None
        and all(lm[i].visibility > 0.5 for i in (ANKLE_L, ANKLE_R))
        and lm[NOSE].visibility > 0.5
    )
    height_px = (foot_y - head_y) if foot_y is not None else 0.0

    to_cm = None
    if calibration is not None and calibration.cm_per_px > 0:
        to_cm = calibration.cm_per_px

    return Measurement(
        height_px=height_px,
        shoulder_px=shoulder_px,
        hip_px=hip_px,
        full_body_visible=visible,
        # Height is only meaningful when the whole body is actually in frame.
        height_cm=(height_px * to_cm) if (to_cm and visible and height_px > 0) else None,
        shoulder_cm=(shoulder_px * to_cm) if to_cm else None,
        hip_cm=(hip_px * to_cm) if to_cm else None,
    )


def calibrate(landmarks: Sequence[Landmark], frame: tuple[int, int],
              real_height_cm: float) -> Calibration:
    """Derive centimetres-per-pixel from a person of known height."""
    if not (MIN_HEIGHT_CM < real_height_cm < MAX_HEIGHT_CM):
        raise ValueError(f"reference height must be between {MIN_HEIGHT_CM:.0f} "
                         f"and {MAX_HEIGHT_CM:.0f} cm, got {real_height_cm}")

    snapshot = measure(landmarks, frame)
    if not snapshot.full_body_visible:
        raise ValueError("the reference person must be fully in frame, head to feet")
    if snapshot.height_px < 50:
        raise ValueError("the reference person occupies too few pixels to calibrate")

    return Calibration(real_height_cm / snapshot.height_px, real_height_cm, tuple(frame))


# --------------------------------------------------------------------------- #
# size recommendation
# --------------------------------------------------------------------------- #

def load_size_table(path: Path = SIZE_TABLE_PATH) -> dict:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def suggest_size(category: str, measurement: Measurement,
                 table: Optional[dict] = None) -> Optional[str]:
    """Suggest a size, or ``None`` when there is no calibrated basis for one.

    The thresholds are distances between MediaPipe *joint* landmarks, not
    tailoring measurements: shoulder-joint span and hip-joint span. They are
    starting estimates and must be retuned against real customers whose sizes
    are known - see backend/vto/sizes.json.
    """
    if not measurement.calibrated and measurement.shoulder_cm is None:
        return None

    config = table or load_size_table()
    which = config.get("categoryUses", {}).get(category, "shoulder")
    value = measurement.hip_cm if which == "hip" else measurement.shoulder_cm
    if value is None:
        return None

    for name, low, high in config.get("tables", {}).get(which, []):
        if low <= value < high:
            return name
    return None
