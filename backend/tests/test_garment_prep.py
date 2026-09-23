"""Mask profiles and garment framing.

Both exist because of defects seen in real output: a warping engine stretched
the garment across the skirt because the mask reached past its hem, and a
garment photographed small in its frame spent most of the conditioning signal
on the backdrop.
"""

from __future__ import annotations

import numpy as np
import pytest
from PIL import Image, ImageDraw

from backend.tests.fixtures import FRAME, standing_pose
from backend.vto.pipeline import trim_garment_border
from backend.vto.preprocess import HIP_L, build_agnostic_mask

W, H = FRAME


def coverage(mask: Image.Image) -> float:
    return float(np.count_nonzero(np.asarray(mask) > 127)) / (W * H)


def lowest_lit_row(mask: Image.Image) -> int:
    rows = np.nonzero((np.asarray(mask) > 127).any(axis=1))[0]
    return int(rows[-1]) if rows.size else 0


# --------------------------------------------------------------------------- #
# mask profiles
# --------------------------------------------------------------------------- #

def test_tight_profile_stops_closer_to_the_hips():
    """A warping engine fills the mask with garment, so an upper mask that
    reaches far below the hips becomes fabric hanging over the skirt."""
    pose = standing_pose()
    generous = build_agnostic_mask(FRAME, pose, "upper", profile="generous")
    tight = build_agnostic_mask(FRAME, pose, "upper", profile="tight")

    hip_row = pose[HIP_L].y * H
    generous_drop = lowest_lit_row(generous) - hip_row
    tight_drop = lowest_lit_row(tight) - hip_row

    assert generous_drop > 0, "the generous mask should fall below the hips"
    assert tight_drop < generous_drop * 0.6
    assert coverage(tight) < coverage(generous)


def dressed_silhouette() -> Image.Image:
    """A person in a flared skirt: the outfit reaches well past the legs."""
    silhouette = Image.new("L", FRAME, 0)
    draw = ImageDraw.Draw(silhouette)
    draw.polygon([
        (int(0.40 * W), int(0.08 * H)), (int(0.60 * W), int(0.08 * H)),
        (int(0.64 * W), int(0.48 * H)),
        (int(0.88 * W), int(0.90 * H)), (int(0.12 * W), int(0.90 * H)),
        (int(0.36 * W), int(0.48 * H)),
    ], fill=255)
    return silhouette


def test_tight_profile_applies_when_a_silhouette_is_supplied():
    """The real path always passes a segmentation mask.

    The silhouette covers the whole worn outfit, so if its lower bound ignores
    the profile it overrides the drawn band and the profile does nothing. That
    is exactly what happened: on a real photo both profiles came out within
    0.3% of each other while the skeleton-only test passed.
    """
    pose = standing_pose()
    body = dressed_silhouette()
    generous = build_agnostic_mask(FRAME, pose, "upper",
                                   person_mask=body, profile="generous")
    tight = build_agnostic_mask(FRAME, pose, "upper",
                                person_mask=body, profile="tight")

    assert coverage(tight) < coverage(generous) * 0.9, (
        f"tight {coverage(tight):.3f} is not meaningfully smaller than "
        f"generous {coverage(generous):.3f}"
    )
    assert lowest_lit_row(tight) < lowest_lit_row(generous)


def test_tight_profile_still_covers_the_torso():
    """Tighter must not mean useless: the garment region has to survive."""
    tight = build_agnostic_mask(FRAME, standing_pose(), "upper", profile="tight")
    assert coverage(tight) > 0.02


@pytest.mark.parametrize("category", ("upper", "lower", "overall"))
def test_both_profiles_accept_every_category(category):
    for profile in ("generous", "tight"):
        mask = build_agnostic_mask(FRAME, standing_pose(), category, profile=profile)
        assert coverage(mask) > 0.01


def test_unknown_profile_is_rejected():
    with pytest.raises(ValueError):
        build_agnostic_mask(FRAME, standing_pose(), "upper", profile="snug")


# --------------------------------------------------------------------------- #
# garment framing
# --------------------------------------------------------------------------- #

def garment_on_field(size, colour, background, box) -> Image.Image:
    image = Image.new("RGB", size, background)
    ImageDraw.Draw(image).rectangle(box, fill=colour)
    return image


def test_border_is_trimmed_on_a_white_field():
    image = garment_on_field((800, 800), (30, 30, 40), (255, 255, 255),
                             (300, 250, 500, 550))
    cropped = trim_garment_border(image)
    assert cropped.width < image.width and cropped.height < image.height
    # the garment itself must survive the crop
    assert cropped.width >= 200 and cropped.height >= 300


def test_border_is_trimmed_on_a_dark_field():
    """Background is sampled, not assumed white, so a dark sweep works too."""
    image = garment_on_field((800, 800), (240, 235, 230), (18, 18, 22),
                             (280, 200, 520, 600))
    cropped = trim_garment_border(image)
    assert cropped.width < image.width


def test_a_full_bleed_garment_is_left_alone():
    """Nothing to trim means nothing is trimmed, rather than a wild guess."""
    image = Image.new("RGB", (400, 600), (120, 90, 70))
    assert trim_garment_border(image).size == image.size


def test_noise_does_not_collapse_the_crop():
    rng = np.random.default_rng(0)
    noise = rng.integers(0, 255, (400, 400, 3), dtype=np.uint8)
    image = Image.fromarray(noise)
    cropped = trim_garment_border(image)
    assert cropped.width > 40 and cropped.height > 40
