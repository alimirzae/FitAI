"""Pipeline tests.

The generator itself needs a GPU and multi-gigabyte weights, so these tests
substitute a recording stub engine. That still exercises everything that
decides whether the output is usable: what the engine is handed, how the
result is mapped back onto the original photograph, and the guarantee that a
failure surfaces as a failure instead of as fake artwork.
"""

from __future__ import annotations

import numpy as np
import pytest
from PIL import Image, ImageDraw

from backend.tests.fixtures import FRAME, standing_pose
from backend.vto import pipeline as pipeline_module
from backend.vto.engine import EngineError, EngineUnavailable, GenerationRequest, VtoEngine, get_engine
from backend.vto.pipeline import prepare_garment, run_tryon
from backend.vto.preprocess import PoseUnavailable

W, H = FRAME


class StubEngine(VtoEngine):
    """Records what it was asked to generate and paints the mask solid red."""

    name = "stub"

    def __init__(self) -> None:
        self.request: GenerationRequest | None = None

    def available(self) -> bool:
        return True

    def generate(self, request: GenerationRequest) -> Image.Image:
        self.request = request
        out = request.person.convert("RGB").copy()
        out.paste(Image.new("RGB", out.size, (255, 0, 0)), (0, 0), request.mask.convert("L"))
        return out


class FailingEngine(VtoEngine):
    name = "failing"

    def available(self) -> bool:
        return True

    def generate(self, request: GenerationRequest) -> Image.Image:
        raise EngineError("the model ran out of memory")


@pytest.fixture
def person_photo() -> Image.Image:
    """A photo-like image with a recognisable face patch and background."""
    img = Image.new("RGB", FRAME, (24, 90, 140))          # background
    draw = ImageDraw.Draw(img)
    draw.rectangle([int(0.33 * W), int(0.10 * H), int(0.67 * W), H], fill=(198, 160, 130))
    pose = standing_pose()
    nose = (pose[0].x * W, pose[0].y * H)
    draw.ellipse([nose[0] - 30, nose[1] - 30, nose[0] + 30, nose[1] + 30], fill=(12, 200, 60))
    return img


@pytest.fixture
def garment_photo() -> Image.Image:
    return Image.new("RGB", (600, 800), (180, 30, 40))


@pytest.fixture(autouse=True)
def stub_pose(monkeypatch):
    """Replace MediaPipe with the in-repo reference pose."""
    def fake_detect(image):
        silhouette = Image.new("L", image.size, 0)
        ImageDraw.Draw(silhouette).rectangle(
            [int(0.30 * W), int(0.08 * H), int(0.70 * W), H], fill=255)
        return standing_pose(), silhouette
    monkeypatch.setattr(pipeline_module, "detect_pose", fake_detect)


# --------------------------------------------------------------------------- #

def test_engine_receives_matching_person_and_mask(person_photo, garment_photo):
    engine = StubEngine()
    run_tryon(person_photo, garment_photo, "upper", engine=engine, resolution=(768, 1024))

    req = engine.request
    assert req is not None
    assert req.person.size == (768, 1024)
    assert req.mask.size == req.person.size
    assert req.garment.size == req.person.size
    assert req.category == "upper"
    assert np.asarray(req.mask).max() > 127, "engine was handed an empty mask"


def test_result_keeps_the_original_resolution(person_photo, garment_photo):
    result = run_tryon(person_photo, garment_photo, "upper", engine=StubEngine())
    assert result.image.size == person_photo.size


def test_face_and_background_survive_generation(person_photo, garment_photo):
    """Everything outside the mask must come back from the real photo."""
    result = run_tryon(person_photo, garment_photo, "upper", engine=StubEngine())
    out = np.asarray(result.image)

    assert tuple(out[20, 20]) == (24, 90, 140)            # background corner

    pose = standing_pose()
    fx, fy = int(pose[0].x * W), int(pose[0].y * H)
    assert tuple(out[fy, fx]) == (12, 200, 60)            # the face patch

    torso_y = int((pose[11].y + pose[23].y) / 2 * H)
    assert tuple(out[torso_y, W // 2]) == (255, 0, 0)     # regenerated garment


def test_reported_metadata(person_photo, garment_photo):
    result = run_tryon(person_photo, garment_photo, "lower", engine=StubEngine())
    assert result.engine == "stub"
    assert result.category == "lower"
    assert result.latency_ms > 0
    assert result.mask.size == person_photo.size


def test_engine_failure_is_not_hidden(person_photo, garment_photo):
    """A failed generation must never be replaced with drawn artwork."""
    with pytest.raises(EngineError):
        run_tryon(person_photo, garment_photo, "upper", engine=FailingEngine())


def test_missing_person_is_reported(monkeypatch, person_photo, garment_photo):
    def no_person(image):
        raise PoseUnavailable("no person detected in the photo")
    monkeypatch.setattr(pipeline_module, "detect_pose", no_person)
    with pytest.raises(PoseUnavailable):
        run_tryon(person_photo, garment_photo, "upper", engine=StubEngine())


def test_bad_category_is_rejected(person_photo, garment_photo):
    with pytest.raises(ValueError):
        run_tryon(person_photo, garment_photo, "shoes", engine=StubEngine())


def test_garment_is_padded_not_stretched():
    garment = Image.new("RGB", (400, 200), (7, 8, 9))
    prepared = prepare_garment(garment, (768, 1024))
    assert prepared.size == (768, 1024)
    arr = np.asarray(prepared)
    assert tuple(arr[5, 5]) == (255, 255, 255)            # padding, not garment
    assert tuple(arr[512, 384]) == (7, 8, 9)              # garment centred


def test_unknown_engine_name_is_rejected():
    with pytest.raises(EngineUnavailable):
        get_engine("magic")
