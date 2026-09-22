"""Person preprocessing for diffusion virtual try-on.

A diffusion VTO model does not "paste" a garment. It repaints a masked region
of the person photo while conditioning on the garment image. The quality of the
result therefore depends almost entirely on the *agnostic mask*: the region that
is erased before repainting.

A good agnostic mask:
  * covers the whole area the new garment could occupy (including sleeves and
    a margin beyond the body silhouette, because a new garment may be looser
    than the one being worn),
  * never covers the face, hair or hands, which must survive untouched,
  * follows the real pose, so the model is not fighting a mask that disagrees
    with the body underneath.

This module is deliberately free of any model-specific code so that it can be
unit tested without torch, without a GPU and without a camera: every function
takes plain normalized landmarks, exactly the 33-point layout MediaPipe Pose
returns.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from typing import Iterable, Optional, Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# MediaPipe Pose landmark indices used here.
NOSE = 0
EAR_L, EAR_R = 7, 8
SHOULDER_L, SHOULDER_R = 11, 12
ELBOW_L, ELBOW_R = 13, 14
WRIST_L, WRIST_R = 15, 16
# Pose gives three points per hand (pinky, index, thumb) beyond the wrist.
# They are what marks out the fingers, which the mask has to spare.
HAND_L = (17, 19, 21)
HAND_R = (18, 20, 22)
HIP_L, HIP_R = 23, 24
KNEE_L, KNEE_R = 25, 26
ANKLE_L, ANKLE_R = 27, 28

CATEGORIES = ("upper", "lower", "overall")


@dataclass(frozen=True)
class Landmark:
    x: float          # normalized 0..1 across image width
    y: float          # normalized 0..1 across image height
    visibility: float = 1.0


def as_landmarks(raw: Iterable) -> list[Landmark]:
    """Accept MediaPipe landmarks, dicts or (x, y) tuples."""
    out: list[Landmark] = []
    for item in raw:
        if isinstance(item, Landmark):
            out.append(item)
        elif isinstance(item, dict):
            out.append(Landmark(float(item["x"]), float(item["y"]),
                                float(item.get("visibility", item.get("v", 1.0)))))
        elif hasattr(item, "x"):
            out.append(Landmark(float(item.x), float(item.y),
                                float(getattr(item, "visibility", 1.0))))
        else:
            x, y = item[0], item[1]
            out.append(Landmark(float(x), float(y)))
    if len(out) < 33:
        raise ValueError(f"expected 33 pose landmarks, got {len(out)}")
    return out


class PoseUnavailable(RuntimeError):
    """Raised when no usable person pose could be produced for an image."""


# --------------------------------------------------------------------------- #
# geometry helpers
# --------------------------------------------------------------------------- #

def _px(lm: Landmark, size: tuple[int, int]) -> tuple[float, float]:
    return lm.x * size[0], lm.y * size[1]


def _mid(a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
    return (a[0] + b[0]) / 2, (a[1] + b[1]) / 2


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(b[0] - a[0], b[1] - a[1])


def _lerp(a: tuple[float, float], b: tuple[float, float], t: float) -> tuple[float, float]:
    return a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t


def _extend(a: tuple[float, float], b: tuple[float, float], t: float) -> tuple[float, float]:
    """Point t beyond b along a->b."""
    return _lerp(a, b, 1.0 + t)


def _widen(a: tuple[float, float], b: tuple[float, float], k: float):
    """Push a and b apart from their midpoint by factor k."""
    m = _mid(a, b)
    return (
        (m[0] + (a[0] - m[0]) * k, m[1] + (a[1] - m[1]) * k),
        (m[0] + (b[0] - m[0]) * k, m[1] + (b[1] - m[1]) * k),
    )


# --------------------------------------------------------------------------- #
# agnostic mask
# --------------------------------------------------------------------------- #

def build_agnostic_mask(
    size: tuple[int, int],
    landmarks: Sequence[Landmark],
    category: str = "upper",
    person_mask: Optional[Image.Image] = None,
    feather: int = 9,
) -> Image.Image:
    """Return an 8-bit mask where white (255) is the region to repaint.

    ``size`` is (width, height) of the person image. ``person_mask`` is the
    optional MediaPipe segmentation mask; when supplied, the garment region is
    allowed to extend a little past the silhouette but not across the whole
    frame, which keeps the model from inventing background clutter.
    """
    if category not in CATEGORIES:
        raise ValueError(f"category must be one of {CATEGORIES}, got {category!r}")

    lm = as_landmarks(landmarks)
    w, h = size
    P = lambda i: _px(lm[i], size)  # noqa: E731

    shoulder_l, shoulder_r = P(SHOULDER_L), P(SHOULDER_R)
    hip_l, hip_r = P(HIP_L), P(HIP_R)
    shoulder_span = _dist(shoulder_l, shoulder_r)
    torso_len = _dist(_mid(shoulder_l, shoulder_r), _mid(hip_l, hip_r))

    if shoulder_span < 4 or torso_len < 4:
        raise PoseUnavailable("person is too small or pose is degenerate")

    # A loose garment can sit well outside the joint centres, so every band is
    # widened relative to the skeleton rather than tracing it exactly.
    arm_r = max(shoulder_span * 0.17, 6.0)
    leg_r = max(shoulder_span * 0.20, 6.0)

    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)

    def band(a, b, radius):
        """Thick capsule between two joints."""
        draw.line([a, b], fill=255, width=int(radius * 2), joint="curve")
        for point in (a, b):
            draw.ellipse([point[0] - radius, point[1] - radius,
                          point[0] + radius, point[1] + radius], fill=255)

    if category in ("upper", "overall"):
        # Torso: from above the shoulder line down past the hips.
        top_l, top_r = _widen(shoulder_l, shoulder_r, 1.34)
        bot_l, bot_r = _widen(hip_l, hip_r, 1.72)
        lift = torso_len * 0.16
        drop = torso_len * (0.34 if category == "upper" else 0.10)
        draw.polygon([
            (top_l[0], top_l[1] - lift), (top_r[0], top_r[1] - lift),
            (bot_r[0], bot_r[1] + drop), (bot_l[0], bot_l[1] + drop),
        ], fill=255)

        # Sleeves follow the real arms; a long sleeve may reach the wrist.
        for sh, el, wr in ((SHOULDER_L, ELBOW_L, WRIST_L), (SHOULDER_R, ELBOW_R, WRIST_R)):
            if lm[el].visibility < 0.3:
                continue
            band(P(sh), P(el), arm_r)
            if lm[wr].visibility >= 0.3:
                band(P(el), P(wr), arm_r * 0.86)

    if category in ("lower", "overall"):
        top_l, top_r = _widen(hip_l, hip_r, 1.78)
        rise = torso_len * (0.30 if category == "lower" else 0.0)
        draw.polygon([
            (top_l[0], top_l[1] - rise), (top_r[0], top_r[1] - rise),
            (hip_r[0], hip_r[1]), (hip_l[0], hip_l[1]),
        ], fill=255)
        for hp, kn, an in ((HIP_L, KNEE_L, ANKLE_L), (HIP_R, KNEE_R, ANKLE_R)):
            if lm[kn].visibility < 0.3:
                continue
            band(P(hp), P(kn), leg_r)
            if lm[an].visibility >= 0.3:
                band(P(kn), P(an), leg_r * 0.82)
                # a maxi skirt or wide trouser can fall past the ankle
                band(P(an), _extend(P(kn), P(an), 0.10), leg_r * 0.82)

    # The skeleton alone is not enough. A flared skirt, a wide coat or a
    # dropped hem extends far beyond the joints, and when the legs are hidden
    # under a skirt MediaPipe can only guess where they are - so bands drawn
    # along those guessed joints miss the garment that is actually being worn.
    #
    # The real silhouette knows the true extent. Pose is used only to decide
    # WHICH part of it belongs to this category, by splitting the frame along
    # the hip line (or the shoulder line) which stays correct even if the
    # person leans.
    if person_mask is not None:
        silhouette = person_mask.convert("L").resize((w, h), Image.BILINEAR)
        grow = max(3, int(shoulder_span * 0.16))
        silhouette = silhouette.filter(ImageFilter.MaxFilter(_odd(min(grow, 31))))
        body = np.asarray(silhouette) > 127

        # Each band needs BOTH edges. Bounding a top only from below lets the
        # silhouette carry the mask straight up over the head, which erases
        # the customer's face and hair - the one thing that must survive.
        neck = _below_line(size, shoulder_l, shoulder_r, -torso_len * 0.13, above=False)
        if category == "upper":
            region = neck & _below_line(size, hip_l, hip_r, torso_len * 0.34, above=True)
        elif category == "lower":
            region = _below_line(size, hip_l, hip_r, -torso_len * 0.30, above=False)
        else:
            region = neck

        combined = np.asarray(mask) > 127
        combined |= body & region
        mask = Image.fromarray((combined * 255).astype(np.uint8))

    # Protect what must never be regenerated: head and hands.
    keep = Image.new("L", (w, h), 0)
    keep_draw = ImageDraw.Draw(keep)
    head_r = max(_dist(P(EAR_L), P(EAR_R)) * 0.95, shoulder_span * 0.32)
    nose = P(NOSE)
    neck = _mid(shoulder_l, shoulder_r)
    chin_t = 0.34   # keep the face, but let a collar reach the neck
    head_c = _lerp(nose, neck, -0.10)
    keep_draw.ellipse([head_c[0] - head_r, head_c[1] - head_r * 1.25,
                       head_c[0] + head_r, head_c[1] + head_r * chin_t], fill=255)
    # A disc on the wrist alone is not enough: the hand extends past the wrist,
    # away from the elbow, so the fingers fall outside it. Diffusion models
    # reconstruct hands badly, and a hand resting on the hip sits exactly where
    # an upper-body mask lives, so the fingers must be covered explicitly.
    for wrist, elbow, finger_ids in ((WRIST_L, ELBOW_L, HAND_L), (WRIST_R, ELBOW_R, HAND_R)):
        if lm[wrist].visibility < 0.3:
            continue

        wrist_pt = P(wrist)
        centres = [wrist_pt]
        radius = arm_r * 1.1

        fingers = [P(i) for i in finger_ids if lm[i].visibility >= 0.2]
        if fingers:
            cx = sum(p[0] for p in fingers) / len(fingers)
            cy = sum(p[1] for p in fingers) / len(fingers)
            centres.append((cx, cy))
            spread = max(_dist((cx, cy), p) for p in fingers)
            radius = max(radius, spread * 1.6)

        # Continue past the wrist along the forearm, so a hand whose finger
        # landmarks are weak is still covered to roughly its full length.
        dx, dy = wrist_pt[0] - P(elbow)[0], wrist_pt[1] - P(elbow)[1]
        length = math.hypot(dx, dy)
        if length > 1:
            reach = arm_r * 1.25
            centres.append((wrist_pt[0] + dx / length * reach,
                            wrist_pt[1] + dy / length * reach))

        for cx, cy in centres:
            keep_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=255)

    mask_arr = np.asarray(mask, dtype=np.int16) - np.asarray(keep, dtype=np.int16)
    mask = Image.fromarray(np.clip(mask_arr, 0, 255).astype(np.uint8))

    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather / 3.0))
        mask = mask.point(lambda v: 255 if v > 110 else 0)

    return mask


def _odd(value: int) -> int:
    return value if value % 2 == 1 else value + 1


def _below_line(size: tuple[int, int], a: tuple[float, float], b: tuple[float, float],
                offset: float, above: bool) -> np.ndarray:
    """Boolean half-plane split by the line through ``a`` and ``b``.

    ``offset`` shifts the line along its own normal, in pixels, so a category
    can claim a little past the joint line - a shirt hangs below the hips, a
    waistband sits above them. Using the real hip/shoulder line rather than a
    horizontal cut keeps this correct when the customer leans or stands with
    weight on one leg.
    """
    w, h = size
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    if length < 1e-6:
        return np.ones((h, w), dtype=bool)

    # Unit normal pointing down the image (towards increasing y).
    nx, ny = -dy / length, dx / length
    if ny < 0:
        nx, ny = -nx, -ny

    ys, xs = np.mgrid[0:h, 0:w]
    signed = (xs - a[0]) * nx + (ys - a[1]) * ny - offset
    return signed <= 0 if above else signed >= 0


# --------------------------------------------------------------------------- #
# letterboxing to the model's fixed input size
# --------------------------------------------------------------------------- #

@dataclass(frozen=True)
class Placement:
    """How a person image was fitted into the model's canvas, so the generated
    result can be mapped back onto the original photograph."""
    scale: float
    offset_x: int
    offset_y: int
    target: tuple[int, int]
    source: tuple[int, int]

    def restore(self, generated: Image.Image) -> Image.Image:
        """Crop the padding away and scale back to the original resolution."""
        cropped = generated.crop((
            self.offset_x,
            self.offset_y,
            self.offset_x + int(round(self.source[0] * self.scale)),
            self.offset_y + int(round(self.source[1] * self.scale)),
        ))
        return cropped.resize(self.source, Image.LANCZOS)


def fit_canvas(image: Image.Image, target: tuple[int, int],
               fill: tuple[int, int, int] = (127, 127, 127)) -> tuple[Image.Image, Placement]:
    """Letterbox ``image`` into ``target`` without distorting the body.

    Aspect ratio matters here: stretching a person into a square input is one
    of the most common causes of unnatural try-on output.
    """
    tw, th = target
    sw, sh = image.size
    scale = min(tw / sw, th / sh)
    nw, nh = int(round(sw * scale)), int(round(sh * scale))
    canvas = Image.new("RGB", target, fill)
    ox, oy = (tw - nw) // 2, (th - nh) // 2
    canvas.paste(image.convert("RGB").resize((nw, nh), Image.LANCZOS), (ox, oy))
    return canvas, Placement(scale, ox, oy, target, (sw, sh))


def fit_mask(mask: Image.Image, placement: Placement) -> Image.Image:
    """Apply the same letterboxing to a mask (padding is never repainted)."""
    tw, th = placement.target
    nw = int(round(placement.source[0] * placement.scale))
    nh = int(round(placement.source[1] * placement.scale))
    canvas = Image.new("L", placement.target, 0)
    canvas.paste(mask.convert("L").resize((nw, nh), Image.LANCZOS),
                 (placement.offset_x, placement.offset_y))
    return canvas


def composite_result(original: Image.Image, generated: Image.Image,
                     mask: Image.Image, feather: int = 3) -> Image.Image:
    """Keep original pixels outside the mask.

    Diffusion decoders subtly shift colour across the whole frame. Restoring
    untouched pixels from the source photograph keeps skin tone, face and
    background identical to the real person.
    """
    soft = mask.convert("L").filter(ImageFilter.GaussianBlur(feather))
    return Image.composite(generated.convert("RGB").resize(original.size, Image.LANCZOS),
                           original.convert("RGB"),
                           soft.resize(original.size, Image.LANCZOS))


# --------------------------------------------------------------------------- #
# MediaPipe-backed pose extraction (optional import)
# --------------------------------------------------------------------------- #

# MediaPipe's heavy pose model (complexity 2) aborts with an access violation
# on some builds - reproduced on mediapipe 0.10.20 / Windows, where complexity
# 0 and 1 both run cleanly. A native crash cannot be caught in-process, so the
# default stays on the full model (1), which is accurate enough for garment
# masking. Opt into the heavy model only after testing it on the target
# machine.
POSE_MODEL_COMPLEXITY = int(os.getenv("FITAI_POSE_COMPLEXITY", "1"))


def detect_pose(image: Image.Image,
                model_complexity: Optional[int] = None
                ) -> tuple[list[Landmark], Optional[Image.Image]]:
    """Return pose landmarks and the segmentation mask for a person photo.

    Imported lazily so that the pure-geometry functions above stay usable (and
    testable) on a machine without MediaPipe installed.
    """
    try:
        import mediapipe as mp
    except ImportError as exc:  # pragma: no cover - environment dependent
        raise PoseUnavailable(
            "mediapipe is required for pose extraction; install backend/requirements.txt"
        ) from exc

    complexity = POSE_MODEL_COMPLEXITY if model_complexity is None else model_complexity
    rgb = np.asarray(image.convert("RGB"))
    with mp.solutions.pose.Pose(static_image_mode=True,
                                model_complexity=complexity,
                                enable_segmentation=True,
                                min_detection_confidence=0.5) as pose:
        result = pose.process(rgb)

    if not result.pose_landmarks:
        raise PoseUnavailable("no person detected in the photo")

    landmarks = as_landmarks(result.pose_landmarks.landmark)
    seg = None
    if result.segmentation_mask is not None:
        seg = Image.fromarray((np.clip(result.segmentation_mask, 0, 1) * 255).astype(np.uint8))
    return landmarks, seg
