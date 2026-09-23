"""Virtual try-on generation engines.

FitAI never ships model weights and never silently substitutes artwork. This
module defines the engine contract and two real implementations:

``diffusers-inpaint``
    Stable Diffusion inpainting conditioned on the garment photo through
    IP-Adapter. Everything installs from PyPI and Hugging Face under
    permissive/OpenRAIL terms, and it fits in roughly 6 GB of VRAM. This is the
    baseline that a clean clone can actually run.

``external``
    Delegates to a separately installed research checkout (CatVTON,
    IDM-VTON, StableVITON, ...) through a command template. Those checkpoints
    are CC BY-NC-SA 4.0; see docs/licenses/MODEL_LICENSE_MATRIX.md. FitAI does
    not vendor that code or those weights, and the engine stays disabled unless
    the operator configures it explicitly.

Both engines receive an already-prepared person image, agnostic mask and
garment image from ``backend.vto.preprocess``.
"""

from __future__ import annotations

import os
import shlex
import subprocess
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from PIL import Image


class EngineError(RuntimeError):
    """The engine could not produce an image."""


class EngineUnavailable(EngineError):
    """The engine is not installed or not configured on this machine."""


@dataclass
class GenerationRequest:
    person: Image.Image
    mask: Image.Image
    garment: Image.Image
    category: str = "upper"
    steps: int = 30
    # 2.5 is too weak here: the model ignores the garment image and invents
    # its own clothing. Measured on a black leather jacket, 2.5 produced a
    # grey utility shirt while 6.0 reproduced the jacket.
    guidance: float = 6.0
    seed: Optional[int] = None
    resolution: tuple[int, int] = (768, 1024)
    extra: dict = field(default_factory=dict)


class VtoEngine(ABC):
    name: str = "engine"

    # What kind of mask this engine wants. See backend.vto.preprocess.
    mask_profile: str = "generous"
    # The resolution this engine was trained at, as (width, height). Working
    # far below it costs real detail, which is what makes a garment read as
    # flat rather than worn.
    native_resolution: tuple[int, int] = (576, 768)

    @abstractmethod
    def available(self) -> bool:
        """True when this engine can actually run right now."""

    @abstractmethod
    def generate(self, request: GenerationRequest) -> Image.Image:
        """Repaint the masked region wearing the given garment."""

    def status(self) -> dict:
        return {"name": self.name, "available": self.available()}


# --------------------------------------------------------------------------- #
# diffusers baseline
# --------------------------------------------------------------------------- #

class DiffusersInpaintEngine(VtoEngine):
    """Stable Diffusion inpainting with IP-Adapter garment conditioning.

    The garment photo drives an image prompt, so the repainted region takes on
    the real garment's colour, texture and cut instead of an invented one. This
    is a genuine generative try-on, though a purpose-built VTON checkpoint
    reproduces fine garment detail (prints, logos) more faithfully.
    """

    name = "diffusers-inpaint"
    # This engine invents the drape, so it needs room past the body.
    mask_profile = "generous"
    # Stable Diffusion 1.5 was trained at 512; 576x768 keeps the aspect ratio
    # of a standing person without drifting far enough from training to start
    # duplicating limbs.
    native_resolution = (576, 768)

    BASE_MODEL = os.getenv("FITAI_VTO_BASE_MODEL", "runwayml/stable-diffusion-inpainting")
    IP_ADAPTER_REPO = os.getenv("FITAI_VTO_IP_ADAPTER_REPO", "h94/IP-Adapter")
    IP_ADAPTER_WEIGHT = os.getenv("FITAI_VTO_IP_ADAPTER_WEIGHT", "ip-adapter-plus_sd15.bin")

    PROMPTS = {
        "upper": "a person wearing the garment, natural drape and folds, photorealistic, studio lighting",
        "lower": "a person wearing the trousers, natural drape and folds, photorealistic, studio lighting",
        "overall": "a person wearing the outfit, natural drape and folds, photorealistic, studio lighting",
    }
    NEGATIVE = ("deformed body, extra limbs, distorted hands, blurry, low quality, "
                "watermark, text, cartoon, illustration, painting")

    def __init__(self) -> None:
        self._pipe = None

    # -- availability ------------------------------------------------------- #

    def available(self) -> bool:
        try:
            import torch  # noqa: F401
            import diffusers  # noqa: F401
        except ImportError:
            return False
        return True

    def status(self) -> dict:
        info = {"name": self.name, "available": self.available(), "base_model": self.BASE_MODEL}
        try:
            import torch
            info["device"] = "cuda" if torch.cuda.is_available() else "cpu"
            if torch.cuda.is_available():
                props = torch.cuda.get_device_properties(0)
                info["gpu"] = props.name
                info["vram_gb"] = round(props.total_memory / 1024 ** 3, 1)
        except Exception:  # pragma: no cover - environment dependent
            pass
        return info

    # -- pipeline ----------------------------------------------------------- #

    def _load(self):
        if self._pipe is not None:
            return self._pipe
        try:
            import torch
            from diffusers import StableDiffusionInpaintPipeline
        except ImportError as exc:
            raise EngineUnavailable(
                "torch/diffusers are not installed. See backend/requirements-vto.txt"
            ) from exc

        cuda = torch.cuda.is_available()
        dtype = torch.float16 if cuda else torch.float32
        pipe = StableDiffusionInpaintPipeline.from_pretrained(
            self.BASE_MODEL, torch_dtype=dtype, safety_checker=None, requires_safety_checker=False
        )

        try:
            pipe.load_ip_adapter(self.IP_ADAPTER_REPO, subfolder="models",
                                 weight_name=self.IP_ADAPTER_WEIGHT)
            pipe.set_ip_adapter_scale(float(os.getenv("FITAI_VTO_IP_SCALE", "1.0")))
            self._ip_adapter = True
        except Exception as exc:   # pragma: no cover - network/weights dependent
            # Without IP-Adapter the garment cannot condition the result, and a
            # text-only inpaint would be an invented garment, not a try-on.
            raise EngineUnavailable(
                f"IP-Adapter weights are required for garment conditioning: {exc}"
            ) from exc

        if cuda:
            free_gb = torch.cuda.get_device_properties(0).total_memory / 1024 ** 3
            if free_gb < 6.5:
                # Small cards still work, just slower.
                pipe.enable_sequential_cpu_offload()
            else:
                pipe.to("cuda")
            # Deliberately NOT enable_attention_slicing(): it replaces every
            # attention processor in the UNet, including the IP-Adapter ones
            # installed above. The pipeline then still hands the processors a
            # (text, image) embedding tuple that a plain processor cannot read,
            # and generation dies inside the first cross-attention block.
            # torch's scaled_dot_product_attention already keeps this model
            # within 8 GB at try-on resolutions.
            try:
                # VAE slicing is safe: it only affects decoding, not attention.
                pipe.enable_vae_slicing()
            except Exception:
                pass
        else:
            pipe.to("cpu")

        pipe.set_progress_bar_config(disable=True)
        self._pipe = pipe
        return pipe

    def generate(self, request: GenerationRequest) -> Image.Image:
        import torch

        pipe = self._load()
        generator = None
        if request.seed is not None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            generator = torch.Generator(device=device).manual_seed(request.seed)

        width, height = request.resolution
        result = pipe(
            prompt=self.PROMPTS.get(request.category, self.PROMPTS["upper"]),
            negative_prompt=self.NEGATIVE,
            image=request.person.convert("RGB"),
            mask_image=request.mask.convert("L"),
            ip_adapter_image=request.garment.convert("RGB"),
            width=width,
            height=height,
            num_inference_steps=request.steps,
            guidance_scale=request.guidance,
            generator=generator,
        )
        return result.images[0]


# --------------------------------------------------------------------------- #
# external research checkout
# --------------------------------------------------------------------------- #

def _split_command(command: str) -> list[str]:
    """Split a command template into argv, correctly on Windows too.

    ``shlex`` has no mode that suits Windows. With ``posix=True`` it eats the
    backslashes in a Windows path; with ``posix=False`` it keeps the quotes
    *inside* the token, so an interpreter under "Program Files" is looked up
    with its quotes attached and the run dies with a bare "cannot find the file
    specified". Quoted paths are the normal case on Windows, not an edge case,
    so split without posix rules and strip the quotes afterwards.
    """
    if os.name != "nt":
        return shlex.split(command)

    parts = []
    for token in shlex.split(command, posix=False):
        if len(token) >= 2 and token[0] == token[-1] and token[0] in "\"'":
            token = token[1:-1]
        parts.append(token)
    return parts


class ExternalCommandEngine(VtoEngine):
    """Run a separately installed VTON checkout through a command template.

    The template may use ``{person}``, ``{mask}``, ``{garment}``, ``{output}``,
    ``{category}``, ``{steps}`` and ``{seed}``. Example for a CatVTON checkout::

        FITAI_VTO_COMMAND=python C:/models/CatVTON/infer.py
          --person {person} --cloth {garment} --mask {mask}
          --output {output} --cloth_type {category}
    """

    name = "external"
    # Warping engines stretch the garment to fill the mask, so the mask has to
    # stop where the garment really ends.
    mask_profile = os.getenv("FITAI_VTO_MASK_PROFILE", "tight")
    # CatVTON's released checkpoints are trained at 768x1024.
    native_resolution = (
        int(os.getenv("FITAI_VTO_WIDTH", "768")),
        int(os.getenv("FITAI_VTO_HEIGHT", "1024")),
    )

    def __init__(self, env_name: str = "FITAI_VTO_COMMAND") -> None:
        self.env_name = env_name

    @property
    def template(self) -> Optional[str]:
        return os.getenv(self.env_name)

    def available(self) -> bool:
        return bool(self.template)

    def status(self) -> dict:
        return {"name": self.name, "available": self.available(), "env": self.env_name}

    def generate(self, request: GenerationRequest) -> Image.Image:
        template = self.template
        if not template:
            raise EngineUnavailable(
                f"{self.name} engine is not configured. Set {self.env_name}."
            )

        with tempfile.TemporaryDirectory(prefix="fitai-vto-") as tmp:
            root = Path(tmp)
            person_path = root / "person.png"
            mask_path = root / "mask.png"
            garment_path = root / "garment.png"
            out_path = root / "result.png"

            request.person.save(person_path)
            request.mask.save(mask_path)
            request.garment.save(garment_path)

            command = template.format(
                person=person_path, mask=mask_path, garment=garment_path,
                reference=garment_path,        # backwards compatible alias
                output=out_path, category=request.category,
                steps=request.steps, seed=request.seed if request.seed is not None else 0,
                color=request.extra.get("color", ""),
            )
            proc = subprocess.run(_split_command(command),
                                  capture_output=True, text=True, timeout=600)
            if proc.returncode != 0:
                raise EngineError((proc.stderr or proc.stdout or "")[-2000:])
            if not out_path.exists():
                raise EngineError("engine finished without writing an output image")
            return Image.open(out_path).convert("RGB")


# --------------------------------------------------------------------------- #
# registry
# --------------------------------------------------------------------------- #

_ENGINES: dict[str, VtoEngine] = {
    DiffusersInpaintEngine.name: DiffusersInpaintEngine(),
    ExternalCommandEngine.name: ExternalCommandEngine(),
}

DEFAULT_ENGINE = os.getenv("FITAI_VTO_ENGINE", "auto")


def get_engine(name: str = "auto") -> VtoEngine:
    """Resolve an engine by name. ``auto`` prefers a configured external
    research checkout, then falls back to the installable diffusers baseline."""
    if name == "auto":
        for candidate in (ExternalCommandEngine.name, DiffusersInpaintEngine.name):
            engine = _ENGINES[candidate]
            if engine.available():
                return engine
        raise EngineUnavailable(
            "No try-on engine is available. Install backend/requirements-vto.txt "
            "for the diffusers baseline, or set FITAI_VTO_COMMAND for an external model."
        )
    if name not in _ENGINES:
        raise EngineUnavailable(f"unknown engine {name!r}; known: {sorted(_ENGINES)}")
    return _ENGINES[name]


def engine_status() -> dict:
    return {name: engine.status() for name, engine in _ENGINES.items()}
