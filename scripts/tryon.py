"""Run one try-on from the command line and see the result.

The point of this script is that you can check the work yourself without
starting the backend or the frontend: one photo in, one photo out, and a
side-by-side sheet showing what was masked so you can see why the result looks
the way it does.

    python scripts/tryon.py --person me.jpg --garment shirt.jpg
    python scripts/tryon.py --person me.jpg --garment shirt.jpg --engine external
    python scripts/tryon.py --person me.jpg --garment shirt.jpg --category lower

Output goes next to the person photo unless --output says otherwise, and
--sheet also writes person | garment | mask | result so the mask is visible.

Garment photography decides most of the quality. An upright, front-facing,
flat product shot on a plain background transfers correctly; a garment folded
or draped at an angle is reproduced folded and at an angle.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--person", required=True, type=Path, help="photo of the customer")
    parser.add_argument("--garment", required=True, type=Path, help="product shot")
    parser.add_argument("--output", type=Path, help="where to write the result")
    parser.add_argument("--sheet", type=Path,
                        help="also write person | garment | mask | result")
    parser.add_argument("--category", default="upper",
                        choices=("upper", "lower", "overall"))
    parser.add_argument("--engine", default="auto",
                        help="auto, diffusers-inpaint or external")
    parser.add_argument("--steps", type=int, default=40)
    parser.add_argument("--seed", type=int,
                        help="omit for a different result each run")
    parser.add_argument("--mask-profile", choices=("generous", "tight"),
                        help="override what the engine asks for")
    args = parser.parse_args(argv)

    from PIL import Image, ImageDraw

    from backend.vto.engine import EngineError, engine_status, get_engine
    from backend.vto.pipeline import PoseUnavailable, run_tryon

    for path in (args.person, args.garment):
        if not path.exists():
            print(f"no such file: {path}", file=sys.stderr)
            return 2

    try:
        engine = get_engine(args.engine)
    except EngineError as exc:
        print(str(exc), file=sys.stderr)
        print(f"\nengines: {engine_status()}", file=sys.stderr)
        return 3

    person = Image.open(args.person).convert("RGB")
    garment = Image.open(args.garment).convert("RGB")

    print(f"engine   : {engine.name}")
    print(f"mask     : {args.mask_profile or engine.mask_profile}")
    print(f"canvas   : {engine.native_resolution[0]}x{engine.native_resolution[1]}")
    print("generating...", flush=True)

    started = time.perf_counter()
    try:
        result = run_tryon(person, garment, category=args.category, engine=engine,
                           steps=args.steps, seed=args.seed,
                           mask_profile=args.mask_profile)
    except PoseUnavailable as exc:
        print(f"\nNo usable person in {args.person.name}: {exc}", file=sys.stderr)
        print("The whole body from head to feet should be visible, facing the camera.",
              file=sys.stderr)
        return 4
    except EngineError as exc:
        print(f"\nGeneration failed: {exc}", file=sys.stderr)
        return 5

    output = args.output or args.person.with_name(f"{args.person.stem}-tryon.png")
    result.image.save(output)
    print(f"took {time.perf_counter() - started:.1f}s -> {output}")

    if args.sheet:
        overlay = person.copy()
        overlay.paste(Image.new("RGB", person.size, (226, 86, 60)), (0, 0), result.mask)
        overlay = Image.blend(person, overlay, 0.55)

        field = Image.new("RGB", person.size, (24, 24, 28))
        thumb = garment.copy()
        thumb.thumbnail(person.size)
        field.paste(thumb, ((person.width - thumb.width) // 2,
                            (person.height - thumb.height) // 2))

        panels = [("person", person), ("garment", field),
                  ("mask", overlay), ("result", result.image.resize(person.size))]
        sheet = Image.new("RGB", (person.width * len(panels), person.height), (18, 18, 22))
        for i, (label, panel) in enumerate(panels):
            sheet.paste(panel, (i * person.width, 0))
            ImageDraw.Draw(sheet).text((i * person.width + 14, 14), label,
                                       fill=(255, 255, 255))
        sheet.save(args.sheet)
        print(f"sheet -> {args.sheet}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
