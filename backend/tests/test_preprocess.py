"""Tests for the agnostic-mask geometry.

These run on numpy + Pillow only: no torch, no GPU, no MediaPipe, no camera.
The properties checked here are the ones that actually decide whether a
diffusion try-on looks natural or broken.
"""

from __future__ import annotations

import numpy as np
import pytest
from PIL import Image

from backend.tests.fixtures import FRAME, partial_pose, standing_pose
from backend.vto.preprocess import (
    ANKLE_L,
    ELBOW_L,
    HIP_L,
    HIP_R,
    KNEE_L,
    NOSE,
    PoseUnavailable,
    SHOULDER_L,
    SHOULDER_R,
    WRIST_L,
    Landmark,
    build_agnostic_mask,
    composite_result,
    fit_canvas,
    fit_mask,
)

W, H = FRAME


def covered(mask: Image.Image, lm: Landmark) -> bool:
    arr = np.asarray(mask)
    x = min(int(lm.x * W), W - 1)
    y = min(int(lm.y * H), H - 1)
    return bool(arr[y, x] > 127)


def coverage(mask: Image.Image) -> float:
    return float(np.count_nonzero(np.asarray(mask) > 127)) / (W * H)


# --------------------------------------------------------------------------- #
# what the mask must cover
# --------------------------------------------------------------------------- #

def test_upper_mask_covers_torso_and_arms():
    pose = standing_pose()
    mask = build_agnostic_mask(FRAME, pose, "upper")
    for idx in (SHOULDER_L, SHOULDER_R, ELBOW_L):
        assert covered(mask, pose[idx]), f"landmark {idx} should be repaintable"
    assert covered(mask, pose[HIP_L])


def test_upper_mask_leaves_the_legs_alone():
    pose = standing_pose()
    mask = build_agnostic_mask(FRAME, pose, "upper")
    assert not covered(mask, pose[KNEE_L])
    assert not covered(mask, pose[ANKLE_L])


def test_lower_mask_covers_legs_but_not_shoulders():
    pose = standing_pose()
    mask = build_agnostic_mask(FRAME, pose, "lower")
    assert covered(mask, pose[KNEE_L])
    assert covered(mask, pose[ANKLE_L])
    assert not covered(mask, pose[SHOULDER_L])


def test_overall_mask_spans_shoulders_to_ankles():
    pose = standing_pose()
    mask = build_agnostic_mask(FRAME, pose, "overall")
    assert covered(mask, pose[SHOULDER_L])
    assert covered(mask, pose[ANKLE_L])


# --------------------------------------------------------------------------- #
# what the mask must never touch
# --------------------------------------------------------------------------- #

def test_face_is_never_repainted():
    pose = standing_pose()
    for category in ("upper", "lower", "overall"):
        mask = build_agnostic_mask(FRAME, pose, category)
        assert not covered(mask, pose[NOSE]), f"{category} mask must preserve the face"


def test_hands_are_never_repainted():
    pose = standing_pose()
    mask = build_agnostic_mask(FRAME, pose, "upper")
    assert not covered(mask, pose[WRIST_L])


# --------------------------------------------------------------------------- #
# the mask must be generous, but not swallow the frame
# --------------------------------------------------------------------------- #

def test_mask_extends_past_the_joint_centres():
    """A looser garment has to have somewhere to go, so the torso band is
    wider than the distance between the hip joints."""
    pose = standing_pose()
    mask = build_agnostic_mask(FRAME, pose, "upper")
    row = int(pose[HIP_L].y * H)
    lit = np.nonzero(np.asarray(mask)[row] > 127)[0]
    assert lit.size > 0
    hip_span = (pose[HIP_R].x - pose[HIP_L].x) * W
    assert (lit[-1] - lit[0]) > hip_span * 1.4


@pytest.mark.parametrize("category,ceiling", [("upper", 0.30), ("lower", 0.30), ("overall", 0.46)])
def test_mask_stays_a_minority_of_the_frame(category, ceiling):
    mask = build_agnostic_mask(FRAME, standing_pose(), category)
    assert 0.02 < coverage(mask) < ceiling


def test_segmentation_mask_clips_the_region():
    """With a silhouette supplied, the mask must not spill across the room."""
    pose = standing_pose()
    silhouette = Image.new("L", FRAME, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(silhouette).rectangle(
        [int(0.33 * W), int(0.10 * H), int(0.67 * W), int(0.99 * H)], fill=255)

    wide = build_agnostic_mask(FRAME, pose, "upper")
    clipped = build_agnostic_mask(FRAME, pose, "upper", person_mask=silhouette)
    assert coverage(clipped) < coverage(wide)


# --------------------------------------------------------------------------- #
# robustness
# --------------------------------------------------------------------------- #

def test_turned_body_still_produces_a_usable_mask():
    """When the customer turns sideways the shoulder span collapses; the mask
    must shrink with it instead of breaking."""
    front = build_agnostic_mask(FRAME, standing_pose(yaw=0.0), "upper")
    turned = build_agnostic_mask(FRAME, standing_pose(yaw=0.8), "upper")
    assert coverage(turned) < coverage(front)
    assert coverage(turned) > 0.01


def test_hidden_legs_do_not_crash_a_lower_mask():
    pose = partial_pose(hidden={KNEE_L, 26, ANKLE_L, 28})
    mask = build_agnostic_mask(FRAME, pose, "lower")
    assert coverage(mask) > 0.0            # the hip band is still repainted
    assert not covered(mask, pose[NOSE])


def test_degenerate_pose_is_rejected():
    flat = [Landmark(0.5, 0.5, 1.0) for _ in range(33)]
    with pytest.raises(PoseUnavailable):
        build_agnostic_mask(FRAME, flat, "upper")


def test_unknown_category_is_rejected():
    with pytest.raises(ValueError):
        build_agnostic_mask(FRAME, standing_pose(), "hat")


# --------------------------------------------------------------------------- #
# letterboxing and compositing
# --------------------------------------------------------------------------- #

def test_fit_canvas_preserves_aspect_ratio():
    """Stretching a person into the model's square input is a classic cause of
    unnatural output, so the body must be letterboxed instead."""
    person = Image.new("RGB", (720, 1280), (200, 120, 90))
    canvas, placement = fit_canvas(person, (768, 1024))
    assert canvas.size == (768, 1024)
    body_w = round(720 * placement.scale)
    body_h = round(1280 * placement.scale)
    assert abs(body_w / body_h - 720 / 1280) < 1e-3


def test_placement_round_trip_restores_original_size():
    person = Image.new("RGB", (640, 960), (10, 20, 30))
    canvas, placement = fit_canvas(person, (768, 1024))
    assert placement.restore(canvas).size == person.size


def test_fit_mask_never_marks_the_padding():
    mask = build_agnostic_mask(FRAME, standing_pose(), "upper")
    _, placement = fit_canvas(Image.new("RGB", FRAME), (768, 1024))
    fitted = fit_mask(mask, placement)
    arr = np.asarray(fitted)
    if placement.offset_x > 0:
        assert arr[:, : placement.offset_x].max() == 0
    if placement.offset_y > 0:
        assert arr[: placement.offset_y, :].max() == 0


def test_composite_keeps_unmasked_pixels_bit_exact():
    """Outside the mask the customer's real photo must survive untouched:
    same face, same skin tone, same background."""
    original = Image.new("RGB", (200, 400), (30, 60, 90))
    generated = Image.new("RGB", (200, 400), (220, 10, 10))
    mask = Image.new("L", (200, 400), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).rectangle([60, 120, 140, 260], fill=255)

    out = np.asarray(composite_result(original, generated, mask, feather=0))
    assert tuple(out[10, 10]) == (30, 60, 90)      # far outside the mask
    assert tuple(out[190, 100]) == (220, 10, 10)   # inside the mask
