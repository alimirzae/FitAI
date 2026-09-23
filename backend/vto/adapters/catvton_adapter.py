"""Drive a separately installed CatVTON checkout from FitAI's external engine.

CatVTON warps the actual garment onto the body instead of regenerating one
from an image prompt, so the cut survives: sleeves stay sleeves. That is the
weakness of the diffusers-inpaint baseline, where colour and material transfer
reliably but garment structure varies run to run.

LICENSING. CatVTON's code and checkpoints are CC BY-NC-SA 4.0 - non-commercial
only. FitAI vendors neither. This file is FitAI's own adapter: it imports a
checkout the operator installed themselves, and it refuses to run until
CATVTON_ROOT points at one. Read docs/licenses/MODEL_LICENSE_MATRIX.md before
enabling this in anything commercial.

Setup:

    git clone https://github.com/Zheng-Chong/CatVTON <somewhere>
    set CATVTON_ROOT=<somewhere>
    python scripts/fetch_vto_weights.py --model catvton
    set FITAI_VTO_COMMAND=python -m backend.vto.adapters.catvton_adapter
        --person {person} --garment {garment} --mask {mask}
        --output {output} --category {category} --steps {steps} --seed {seed}

FitAI supplies the mask from backend/vto/preprocess.py, so CatVTON's own
DensePose and SCHP mask stack is not needed and is not downloaded.
"""

from __future__ import annotations

import argparse
import contextlib
import os
import sys
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_WEIGHTS = REPO_ROOT / "backend" / "vto" / "weights"


class AdapterError(RuntimeError):
    """Configuration or environment problem, reported without a traceback."""


def _catvton_root() -> Path:
    root = os.getenv("CATVTON_ROOT")
    if not root:
        raise AdapterError(
            "CATVTON_ROOT is not set. FitAI does not vendor CatVTON, whose code "
            "and checkpoints are CC BY-NC-SA 4.0. Clone "
            "https://github.com/Zheng-Chong/CatVTON and point CATVTON_ROOT at it."
        )
    path = Path(root)
    if not (path / "model" / "pipeline.py").exists():
        raise AdapterError(f"{path} does not look like a CatVTON checkout "
                           f"(no model/pipeline.py).")
    return path


@contextlib.contextmanager
def _local_vae(vae_dir: Path):
    """Make CatVTON load the VAE from disk instead of reaching for the hub.

    CatVTONPipeline hard-codes ``AutoencoderKL.from_pretrained("stabilityai/
    sd-vae-ft-mse")``. On an offline kiosk, or a network where the model CDN is
    unreachable, that call is the one thing that would fail. Redirecting the id
    to a local directory keeps the upstream checkout unmodified, which matters:
    it is licensed code we do not want to patch.
    """
    from diffusers import AutoencoderKL

    original = AutoencoderKL.from_pretrained

    def patched(name, *args, **kwargs):
        if isinstance(name, str) and name.endswith("sd-vae-ft-mse"):
            if not vae_dir.exists():
                raise AdapterError(
                    f"CatVTON needs the sd-vae-ft-mse weights at {vae_dir}. "
                    f"Run: python scripts/fetch_vto_weights.py --model catvton"
                )
            return original(str(vae_dir), *args, **kwargs)
        return original(name, *args, **kwargs)

    AutoencoderKL.from_pretrained = staticmethod(patched)
    try:
        yield
    finally:
        AutoencoderKL.from_pretrained = original


def build_pipeline(weights: Path, device: str, dtype):
    root = _catvton_root()
    # CatVTON's own modules import each other as top-level packages.
    sys.path.insert(0, str(root))

    with _local_vae(weights / "CatVTON" / "sd-vae-ft-mse"):
        from model.pipeline import CatVTONPipeline

        base = weights / "stable-diffusion-inpainting"
        if not (base / "unet" / "diffusion_pytorch_model.safetensors").exists():
            raise AdapterError(
                f"The Stable Diffusion inpainting UNet is missing from {base}. "
                f"Run: python scripts/fetch_vto_weights.py"
            )

        return CatVTONPipeline(
            base_ckpt=str(base),
            attn_ckpt=str(weights / "CatVTON"),
            attn_ckpt_version="mix",
            weight_dtype=dtype,
            device=device,
            # The safety checker weights are a further 1.2 GB and this runs on a
            # staff-operated kiosk against a photo the shop just took.
            skip_safety_check=True,
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="CatVTON adapter for FitAI")
    parser.add_argument("--person", required=True, type=Path)
    parser.add_argument("--garment", required=True, type=Path)
    parser.add_argument("--mask", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--category", default="upper")
    parser.add_argument("--steps", type=int, default=50)
    parser.add_argument("--seed", type=int, default=0)
    # 2.5 is CatVTON's own tuned value, not FitAI's diffusers default of 6.0.
    parser.add_argument("--guidance", type=float, default=2.5)
    # Size follows the incoming image unless overridden. FitAI has already
    # letterboxed the person and mask to the pipeline's resolution, and the
    # result is mapped straight back onto the original photograph, so the
    # adapter must not impose a size of its own: CatVTON's check_inputs crops
    # to the requested aspect ratio, which would shift the framing and make
    # the restore land in the wrong place.
    parser.add_argument("--height", type=int, default=0)
    parser.add_argument("--width", type=int, default=0)
    parser.add_argument("--weights", type=Path, default=DEFAULT_WEIGHTS)
    args = parser.parse_args(argv)

    try:
        import torch
    except ImportError:
        print("torch is not installed; see backend/requirements-vto.txt",
              file=sys.stderr)
        return 3

    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        pipeline = build_pipeline(args.weights, device, dtype)

        person = Image.open(args.person).convert("RGB")
        garment = Image.open(args.garment).convert("RGB")
        mask = Image.open(args.mask).convert("L")

        if mask.size != person.size:
            # CatVTON asserts on this, and the assertion message is unhelpful.
            raise AdapterError(f"mask {mask.size} does not match person {person.size}")

        width = args.width or person.width
        height = args.height or person.height
        # The VAE downsamples by 8 and the UNet by a further 8.
        width, height = (max(64, v // 64 * 64) for v in (width, height))

        generator = torch.Generator(device=device).manual_seed(args.seed)
        result = pipeline(
            image=person,
            condition_image=garment,
            mask=mask,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance,
            height=height,
            width=width,
            generator=generator,
        )

        image = result[0] if isinstance(result, list) else result
        args.output.parent.mkdir(parents=True, exist_ok=True)
        image.save(args.output)
        return 0

    except AdapterError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except Exception as exc:  # surfaced verbatim by ExternalCommandEngine
        print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
