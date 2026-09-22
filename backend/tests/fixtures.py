"""Synthetic pose fixtures.

A reference standing pose with real adult proportions, expressed in the same
normalized 33-point layout MediaPipe Pose returns. Having this in-repo means
the mask geometry can be tested deterministically, with no camera, no GPU and
no MediaPipe install.

Proportions (fractions of total height, measured from the top of the head):
head 0.13, shoulder line 0.18, elbow 0.33, wrist 0.44, hip joint 0.47,
knee 0.71, ankle 0.94. Shoulder-joint span is 0.24 of height and hip-joint
span is 0.12 of height.
"""

from __future__ import annotations

from backend.vto.preprocess import Landmark

# Frame the fixture describes: a portrait photo 720 x 1280.
FRAME = (720, 1280)

_REFERENCE = {
    0: (0.500, 0.142),                                    # nose
    1: (0.484, 0.134), 2: (0.478, 0.134), 3: (0.472, 0.134),
    4: (0.516, 0.134), 5: (0.522, 0.134), 6: (0.528, 0.134),
    7: (0.450, 0.139), 8: (0.550, 0.139),                 # ears
    9: (0.488, 0.156), 10: (0.512, 0.156),                # mouth
    11: (0.306, 0.224), 12: (0.694, 0.224),               # shoulders
    13: (0.290, 0.360), 14: (0.710, 0.360),               # elbows
    15: (0.280, 0.461), 16: (0.720, 0.461),               # wrists
    17: (0.276, 0.492), 18: (0.724, 0.492),
    19: (0.280, 0.497), 20: (0.720, 0.497),
    21: (0.288, 0.485), 22: (0.712, 0.485),
    23: (0.403, 0.488), 24: (0.597, 0.488),               # hip joints
    25: (0.419, 0.706), 26: (0.581, 0.706),               # knees
    27: (0.431, 0.916), 28: (0.569, 0.916),               # ankles
    29: (0.428, 0.930), 30: (0.572, 0.930),               # heels
    31: (0.440, 0.968), 32: (0.560, 0.968),               # foot index
}


def standing_pose(yaw: float = 0.0, visibility: float = 0.97) -> list[Landmark]:
    """Reference pose. ``yaw`` from 0 (facing the camera) to 1 (full profile)
    squeezes the body horizontally the way a real turn does, which is the case
    that breaks naive garment fitting."""
    squash = 1.0 - 0.88 * max(0.0, min(1.0, yaw))
    return [
        Landmark(0.5 + (_REFERENCE[i][0] - 0.5) * squash, _REFERENCE[i][1], visibility)
        for i in range(33)
    ]


def partial_pose(hidden: set[int], yaw: float = 0.0) -> list[Landmark]:
    """Reference pose with some joints marked as not visible, e.g. a customer
    standing too close so their legs are out of frame."""
    base = standing_pose(yaw)
    return [
        Landmark(p.x, p.y, 0.05 if i in hidden else p.visibility)
        for i, p in enumerate(base)
    ]
