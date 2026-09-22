"""Tests for metric measurement and size suggestion.

The property that matters most here is the truthfulness rule from
PROJECT_MEMORY: no centimetre value may be reported before calibration.
"""

from __future__ import annotations

import pytest

from backend.tests.fixtures import FRAME, partial_pose, standing_pose
from backend.vto.measure import (
    ANKLE_L,
    Calibration,
    calibrate,
    load_size_table,
    measure,
    suggest_size,
)


def test_no_centimetres_before_calibration():
    m = measure(standing_pose(), FRAME)
    assert m.height_px > 0
    assert m.shoulder_px > 0
    assert m.height_cm is None
    assert m.shoulder_cm is None
    assert m.hip_cm is None
    assert not m.calibrated


def test_size_is_withheld_before_calibration():
    m = measure(standing_pose(), FRAME)
    assert suggest_size("upper", m) is None
    assert suggest_size("lower", m) is None


def test_calibration_round_trip():
    """A 170 cm reference person must measure back as 170 cm."""
    pose = standing_pose()
    cal = calibrate(pose, FRAME, 170.0)
    m = measure(pose, FRAME, cal)
    assert m.height_cm == pytest.approx(170.0, abs=0.5)


def test_calibrated_proportions_are_anatomically_plausible():
    cal = calibrate(standing_pose(), FRAME, 170.0)
    m = measure(standing_pose(), FRAME, cal)
    # Shoulder-joint span is about a quarter of standing height.
    assert 36.0 < m.shoulder_cm < 46.0
    assert 17.0 < m.hip_cm < 25.0


def test_size_suggestion_after_calibration():
    cal = calibrate(standing_pose(), FRAME, 170.0)
    m = measure(standing_pose(), FRAME, cal)
    assert suggest_size("upper", m) in {"S", "M", "L", "XL"}
    assert suggest_size("lower", m) in {"S", "M", "L", "XL"}


def test_taller_person_gets_a_larger_or_equal_size():
    table = load_size_table()
    small = measure(standing_pose(), FRAME, calibrate(standing_pose(), FRAME, 155.0))
    large = measure(standing_pose(), FRAME, calibrate(standing_pose(), FRAME, 195.0))
    order = [row[0] for row in table["tables"]["shoulder"]]
    assert order.index(suggest_size("upper", large, table)) >= \
           order.index(suggest_size("upper", small, table))


def test_height_is_withheld_when_feet_are_out_of_frame():
    """Someone standing too close has no measurable height, even if the
    camera is calibrated."""
    cal = calibrate(standing_pose(), FRAME, 170.0)
    cropped = partial_pose(hidden={ANKLE_L, 28, 29, 30, 31, 32})
    m = measure(cropped, FRAME, cal)
    assert not m.full_body_visible
    assert m.height_cm is None
    # Widths are still usable because the shoulders are visible.
    assert m.shoulder_cm is not None


def test_implausible_reference_height_is_rejected():
    for bad in (0.0, 45.0, 260.0):
        with pytest.raises(ValueError):
            calibrate(standing_pose(), FRAME, bad)


def test_calibration_requires_a_fully_visible_person():
    cropped = partial_pose(hidden={ANKLE_L, 28, 29, 30, 31, 32})
    with pytest.raises(ValueError):
        calibrate(cropped, FRAME, 170.0)


def test_calibration_serialises():
    cal = calibrate(standing_pose(), FRAME, 170.0)
    restored = Calibration.from_dict(cal.to_dict())
    assert restored.cm_per_px == pytest.approx(cal.cm_per_px)
    assert restored.frame == cal.frame


def test_size_table_rows_are_contiguous():
    table = load_size_table()
    for rows in table["tables"].values():
        for previous, current in zip(rows, rows[1:]):
            assert previous[2] == current[1], "size bands must not leave gaps"
