"""Command-line entry point for the try-on pipeline.

Useful on its own for batch work and for checking a machine's setup before
wiring the UI:

    python -m backend.vto.runner --person me.jpg --garment shirt.png --output out.png
    python -m backend.vto.runner --status
    python -m backend.vto.runner --person me.jpg --garment shirt.png \
        --output out.png --dump-mask mask.png --category upper --seed 7
"""

from __future__ import annotations

import argparse
import json
import sys

from PIL import Image

from .engine import EngineError, engine_status, get_engine
from .pipeline import DEFAULT_RESOLUTION, run_tryon
from .preprocess import CATEGORIES, PoseUnavailable


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="backend.vto.runner",
        description="FitAI photorealistic virtual try-on",
    )
    parser.add_argument("--person", help="photo of the customer")
    parser.add_argument("--garment", help="isolated product photo of the garment")
    parser.add_argument("--output", help="where to write the result PNG")
    parser.add_argument("--category", default="upper", choices=CATEGORIES)
    parser.add_argument("--engine", default="auto",
                        help="auto, diffusers-inpaint or external")
    parser.add_argument("--steps", type=int, default=30)
    parser.add_argument("--guidance", type=float, default=6.0)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--width", type=int, default=DEFAULT_RESOLUTION[0])
    parser.add_argument("--height", type=int, default=DEFAULT_RESOLUTION[1])
    parser.add_argument("--dump-mask", help="also write the agnostic mask, for tuning")
    parser.add_argument("--status", action="store_true",
                        help="report which engines are usable on this machine")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.status:
        print(json.dumps(engine_status(), indent=2))
        return 0

    missing = [f"--{n}" for n in ("person", "garment", "output") if not getattr(args, n)]
    if missing:
        print(f"error: {', '.join(missing)} are required (or use --status)", file=sys.stderr)
        return 2

    try:
        engine = get_engine(args.engine)
    except EngineError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 3

    try:
        result = run_tryon(
            Image.open(args.person),
            Image.open(args.garment),
            category=args.category,
            engine=engine,
            steps=args.steps,
            guidance=args.guidance,
            seed=args.seed,
            resolution=(args.width, args.height),
        )
    except PoseUnavailable as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 4
    except EngineError as exc:
        print(f"error: try-on engine failed: {exc}", file=sys.stderr)
        return 5

    result.image.save(args.output)
    if args.dump_mask:
        result.mask.save(args.dump_mask)

    print(json.dumps({
        "output": args.output,
        "engine": result.engine,
        "category": result.category,
        "latency_ms": round(result.latency_ms, 1),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
