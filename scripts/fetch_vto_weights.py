"""Fetch (or diagnose) the weights the photorealistic try-on engine needs.

Model weights are not served from the same host as the Hugging Face API. The
API lives on huggingface.co, but every actual file download is redirected to a
separate CDN. Those two can fail independently, and on a restricted network
the usual symptom is confusing: metadata loads fine, then the download dies
with an SSL error partway through pipeline construction.

This script separates the two, so a failure says which hop is broken:

    python scripts/fetch_vto_weights.py --check      # what is already cached
    python scripts/fetch_vto_weights.py --diagnose   # which hop is reachable
    python scripts/fetch_vto_weights.py              # download what is missing

If the CDN is unreachable from the store's network, weights can be fetched on
any other machine and copied across - see --check output for the cache path.
"""

from __future__ import annotations

import argparse
import os
import sys
import time

# Files the diffusers-inpaint engine loads. fp16 variants are used because the
# engine runs in half precision on GPU.
REQUIRED = [
    ("runwayml/stable-diffusion-inpainting", "model_index.json"),
    ("runwayml/stable-diffusion-inpainting", "scheduler/scheduler_config.json"),
    ("runwayml/stable-diffusion-inpainting", "tokenizer/vocab.json"),
    ("runwayml/stable-diffusion-inpainting", "tokenizer/merges.txt"),
    ("runwayml/stable-diffusion-inpainting", "tokenizer/tokenizer_config.json"),
    ("runwayml/stable-diffusion-inpainting", "tokenizer/special_tokens_map.json"),
    ("runwayml/stable-diffusion-inpainting", "text_encoder/config.json"),
    ("runwayml/stable-diffusion-inpainting", "text_encoder/model.fp16.safetensors"),
    ("runwayml/stable-diffusion-inpainting", "vae/config.json"),
    ("runwayml/stable-diffusion-inpainting", "vae/diffusion_pytorch_model.fp16.safetensors"),
    ("runwayml/stable-diffusion-inpainting", "unet/config.json"),
    ("runwayml/stable-diffusion-inpainting", "unet/diffusion_pytorch_model.fp16.safetensors"),
    ("h94/IP-Adapter", "models/image_encoder/config.json"),
    ("h94/IP-Adapter", "models/image_encoder/model.safetensors"),
    ("h94/IP-Adapter", "models/ip-adapter-plus_sd15.bin"),
]

API_HOST = os.getenv("HF_ENDPOINT", "https://huggingface.co")


def cache_root() -> str:
    from huggingface_hub.constants import HF_HUB_CACHE
    return HF_HUB_CACHE


def check() -> int:
    """Report which required files are already on disk."""
    from huggingface_hub import try_to_load_from_cache

    print(f"cache: {cache_root()}\n")
    missing = 0
    for repo, filename in REQUIRED:
        path = try_to_load_from_cache(repo_id=repo, filename=filename)
        if isinstance(path, str) and os.path.exists(path):
            size = os.path.getsize(path) / 1024 ** 2
            print(f"  present  {size:8.1f} MB  {repo}  {filename}")
        else:
            missing += 1
            print(f"  MISSING              {repo}  {filename}")

    print()
    if missing:
        print(f"{missing} file(s) missing. Run this script without --check to fetch them,")
        print("or copy the cache directory above from a machine that can reach the CDN.")
    else:
        print("All weights present. The try-on engine can load offline.")
    return 1 if missing else 0


def diagnose() -> int:
    """Probe the API host and the file CDN separately."""
    import requests

    print(f"API endpoint: {API_HOST}")
    print(f"proxies     : {requests.utils.getproxies() or 'none'}\n")

    ok = True

    try:
        r = requests.get(f"{API_HOST}/api/models/runwayml/stable-diffusion-inpainting",
                         timeout=20)
        print(f"  api host      -> {r.status_code}")
    except Exception as exc:
        ok = False
        print(f"  api host      -> {type(exc).__name__}: {str(exc)[:120]}")

    # The CDN hop: ask for one megabyte of a real weight file and see if bytes
    # actually arrive. A redirect alone proves nothing.
    url = (f"{API_HOST}/runwayml/stable-diffusion-inpainting/resolve/main/"
           f"vae/diffusion_pytorch_model.fp16.safetensors")
    try:
        started = time.perf_counter()
        r = requests.get(url, timeout=40, stream=True, headers={"Range": "bytes=0-1048575"})
        got = len(next(r.iter_content(1 << 20), b""))
        elapsed = time.perf_counter() - started
        r.close()
        if got:
            print(f"  weight CDN    -> {r.status_code}  {got/1024:.0f} KB in {elapsed:.1f}s")
            print(f"                   host: {r.url.split('/')[2]}")
        else:
            ok = False
            print(f"  weight CDN    -> {r.status_code} but no bytes arrived")
    except Exception as exc:
        ok = False
        print(f"  weight CDN    -> {type(exc).__name__}: {str(exc)[:120]}")

    print()
    if ok:
        print("Both hops work. Run this script without arguments to download.")
    else:
        print("The API host and the weight CDN are different hosts and are blocked")
        print("independently. If only the CDN failed, the fix is in the network or")
        print("proxy routing, not in FitAI: make sure *.hf.co and *.xethub.hf.co go")
        print("through the same tunnel as huggingface.co. Otherwise fetch the weights")
        print("elsewhere and copy the cache directory shown by --check.")
    return 0 if ok else 2


def download() -> int:
    from huggingface_hub import hf_hub_download

    print(f"cache: {cache_root()}")
    print(f"endpoint: {API_HOST}\n")

    failed = []
    for index, (repo, filename) in enumerate(REQUIRED, 1):
        label = f"[{index}/{len(REQUIRED)}] {repo} {filename}"
        try:
            started = time.perf_counter()
            path = hf_hub_download(repo_id=repo, filename=filename)
            size = os.path.getsize(path) / 1024 ** 2
            elapsed = time.perf_counter() - started
            print(f"  ok   {label}  ({size:.1f} MB in {elapsed:.1f}s)", flush=True)
        except Exception as exc:
            failed.append((repo, filename, f"{type(exc).__name__}: {str(exc)[:160]}"))
            print(f"  FAIL {label}\n       {failed[-1][2]}", flush=True)

    print()
    if failed:
        print(f"{len(failed)} file(s) could not be downloaded.")
        print("Run --diagnose to see which network hop is failing.")
        return 2
    print("All weights downloaded. Try it:")
    print("  python -m backend.vto.runner --person me.jpg --garment shirt.png --output out.png")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="report what is already cached")
    parser.add_argument("--diagnose", action="store_true",
                        help="probe the API host and the weight CDN separately")
    args = parser.parse_args(argv)

    try:
        import huggingface_hub  # noqa: F401
    except ImportError:
        print("huggingface_hub is not installed.", file=sys.stderr)
        print("Install backend/requirements-vto.txt first.", file=sys.stderr)
        return 3

    if args.check:
        return check()
    if args.diagnose:
        return diagnose()
    return download()


if __name__ == "__main__":
    raise SystemExit(main())
