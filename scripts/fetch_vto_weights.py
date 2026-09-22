"""Fetch (or diagnose) the weights the photorealistic try-on engine needs.

Model weights are not served from the same host as the model-hub API. The API
lives on huggingface.co, but every actual file download is redirected to a
separate CDN, and those two can fail independently. On a restricted network
the symptom is confusing: metadata loads fine, then the download dies with an
SSL error partway through pipeline construction, which reads like a code fault
and is not one.

    python scripts/fetch_vto_weights.py --diagnose   # which hosts serve bytes
    python scripts/fetch_vto_weights.py --check      # what is already on disk
    python scripts/fetch_vto_weights.py              # download what is missing

Two sources are supported. ``huggingface`` is the upstream. ``modelscope`` is
a mirror of the same two repositories, reachable from networks where the
Hugging Face CDN is not; ``--source auto`` (the default) probes and picks one.

Weights land in a plain directory, not a hub cache, so the engine can be
pointed at them with two environment variables and loads fully offline:

    FITAI_VTO_BASE_MODEL=<dest>/stable-diffusion-inpainting
    FITAI_VTO_IP_ADAPTER_REPO=<dest>/IP-Adapter
    FITAI_VTO_IP_ADAPTER_WEIGHT=ip-adapter-plus_sd15.safetensors

The fp16 variants are downloaded and stored under the plain filenames the
pipeline looks for. That halves the download and matches the precision the
engine runs in anyway.
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import time
from pathlib import Path

import requests

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DEST = REPO_ROOT / "backend" / "vto" / "weights"

# (remote path, local path). Remote fp16 variants are stored under the plain
# name so from_pretrained finds them without variant="fp16".
SD_FILES = [
    ("model_index.json", "model_index.json"),
    ("scheduler/scheduler_config.json", "scheduler/scheduler_config.json"),
    ("feature_extractor/preprocessor_config.json", "feature_extractor/preprocessor_config.json"),
    ("tokenizer/vocab.json", "tokenizer/vocab.json"),
    ("tokenizer/merges.txt", "tokenizer/merges.txt"),
    ("tokenizer/tokenizer_config.json", "tokenizer/tokenizer_config.json"),
    ("tokenizer/special_tokens_map.json", "tokenizer/special_tokens_map.json"),
    ("text_encoder/config.json", "text_encoder/config.json"),
    ("text_encoder/model.fp16.safetensors", "text_encoder/model.safetensors"),
    ("vae/config.json", "vae/config.json"),
    ("vae/diffusion_pytorch_model.fp16.safetensors", "vae/diffusion_pytorch_model.safetensors"),
    ("unet/config.json", "unet/config.json"),
    ("unet/diffusion_pytorch_model.fp16.safetensors", "unet/diffusion_pytorch_model.safetensors"),
]

IPA_FILES = [
    ("models/ip-adapter-plus_sd15.safetensors", "models/ip-adapter-plus_sd15.safetensors"),
    ("models/image_encoder/config.json", "models/image_encoder/config.json"),
    ("models/image_encoder/model.safetensors", "models/image_encoder/model.safetensors"),
]

# source -> {local model dir: remote repo id}
REPOS = {
    "huggingface": {
        "stable-diffusion-inpainting": "runwayml/stable-diffusion-inpainting",
        "IP-Adapter": "h94/IP-Adapter",
    },
    "modelscope": {
        "stable-diffusion-inpainting": "AI-ModelScope/stable-diffusion-inpainting",
        "IP-Adapter": "AI-ModelScope/IP-Adapter",
    },
}

PLAN = [("stable-diffusion-inpainting", SD_FILES), ("IP-Adapter", IPA_FILES)]

SESSION = requests.Session()
SESSION.headers["User-Agent"] = "Mozilla/5.0 (FitAI weight fetcher)"


def url_for(source: str, repo: str, path: str) -> str:
    if source == "huggingface":
        endpoint = os.getenv("HF_ENDPOINT", "https://huggingface.co")
        return f"{endpoint}/{repo}/resolve/main/{path}"
    return (f"https://modelscope.cn/api/v1/models/{repo}/repo"
            f"?Revision=master&FilePath={path}")


# --------------------------------------------------------------------------- #
# probing
# --------------------------------------------------------------------------- #

def serves_bytes(source: str, timeout: int = 35) -> tuple[bool, str]:
    """True only if real bytes of a real weight file arrive.

    A 200 on metadata, or a redirect, proves nothing about the transfer hop -
    that is exactly the trap this whole script exists to avoid.
    """
    repo = REPOS[source]["stable-diffusion-inpainting"]
    url = url_for(source, repo, "vae/diffusion_pytorch_model.fp16.safetensors")
    try:
        started = time.perf_counter()
        r = SESSION.get(url, timeout=timeout, stream=True,
                        headers={"Range": "bytes=0-1048575"})
        got = len(next(r.iter_content(1 << 20), b""))
        elapsed = time.perf_counter() - started
        host = r.url.split("/")[2]
        r.close()
        if got > 4096:
            return True, f"{r.status_code}  {got/1024:.0f} KB in {elapsed:.1f}s via {host}"
        return False, f"{r.status_code} but no payload (via {host})"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {str(exc)[:110]}"


def pick_source(requested: str) -> str:
    if requested != "auto":
        return requested
    for source in ("huggingface", "modelscope"):
        ok, detail = serves_bytes(source, timeout=25)
        print(f"  {source:12s} {'serves weights' if ok else 'unusable'}: {detail}", flush=True)
        if ok:
            print(f"\nusing {source}\n", flush=True)
            return source
    raise SystemExit(
        "\nNo source can deliver weight bytes from this network.\n"
        "The model-hub API and its file CDN are different hosts. If only the CDN\n"
        "failed, the fix is in network or proxy routing, not in FitAI. Otherwise\n"
        "fetch the weights on another machine and copy the destination directory."
    )


# --------------------------------------------------------------------------- #
# commands
# --------------------------------------------------------------------------- #

def download_file(source: str, repo: str, remote: str, target: Path,
                  attempts: int = 8) -> int:
    """Download one file, resuming a partial transfer where the server allows.

    These are multi-gigabyte files and the networks that need a mirror in the
    first place tend to drop long transfers. Restarting from zero each time can
    mean a download never finishes, so progress is kept in a .part file and
    continued with a Range request.
    """
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_suffix(target.suffix + ".part")
    url = url_for(source, repo, remote)
    last_error = None

    for attempt in range(1, attempts + 1):
        have = part.stat().st_size if part.exists() else 0
        headers = {"Range": f"bytes={have}-"} if have else {}

        try:
            with SESSION.get(url, timeout=60, stream=True, headers=headers) as r:
                if have and r.status_code == 200:
                    # Server ignored the range; the body restarts from zero.
                    have = 0
                elif have and r.status_code != 206:
                    r.raise_for_status()
                elif not have:
                    r.raise_for_status()

                remaining = int(r.headers.get("Content-Length") or 0)
                total = have + remaining
                written = have
                last = time.perf_counter()

                with open(part, "ab" if have else "wb") as fh:
                    for chunk in r.iter_content(1 << 20):
                        fh.write(chunk)
                        written += len(chunk)
                        now = time.perf_counter()
                        if total > (8 << 20) and now - last > 10:
                            pct = 100 * written / total if total else 0
                            print(f"        {written/1024**2:8.0f} / {total/1024**2:.0f} MB "
                                  f"({pct:4.1f}%)", flush=True)
                            last = now

            if total and written < total:
                raise IOError(f"truncated at {written} of {total} bytes")

            part.replace(target)
            return written

        except Exception as exc:
            last_error = exc
            done = part.stat().st_size if part.exists() else 0
            if attempt < attempts:
                print(f"        retry {attempt}/{attempts - 1} from "
                      f"{done/1024**2:.0f} MB: {type(exc).__name__}", flush=True)
                time.sleep(min(2 * attempt, 15))

    raise last_error if last_error else IOError("download failed")


def download(source: str, dest: Path) -> int:
    source = pick_source(source)
    print(f"destination: {dest}\n", flush=True)

    failed = []
    for model_dir, files in PLAN:
        repo = REPOS[source][model_dir]
        print(f"{model_dir}  <-  {source}:{repo}", flush=True)
        for remote, local in files:
            target = dest / model_dir / local
            if target.exists() and target.stat().st_size > 0:
                print(f"  have  {local}  ({target.stat().st_size/1024**2:.1f} MB)", flush=True)
                continue
            try:
                started = time.perf_counter()
                size = download_file(source, repo, remote, target)
                elapsed = max(time.perf_counter() - started, 0.01)
                print(f"  got   {local}  ({size/1024**2:.1f} MB, "
                      f"{size/1024**2/elapsed:.1f} MB/s)", flush=True)
            except Exception as exc:
                failed.append((model_dir, local, f"{type(exc).__name__}: {str(exc)[:120]}"))
                print(f"  FAIL  {local}\n        {failed[-1][2]}", flush=True)
        print(flush=True)

    if failed:
        print(f"{len(failed)} file(s) failed. Re-run to resume; completed files are kept.")
        return 2

    print("All weights present. Point the engine at them:\n")
    print(f'  set FITAI_VTO_BASE_MODEL={dest / "stable-diffusion-inpainting"}')
    print(f'  set FITAI_VTO_IP_ADAPTER_REPO={dest / "IP-Adapter"}')
    print(f'  set FITAI_VTO_IP_ADAPTER_WEIGHT=ip-adapter-plus_sd15.safetensors')
    return 0


def check(dest: Path) -> int:
    print(f"destination: {dest}\n")
    missing = total = 0
    for model_dir, files in PLAN:
        print(f"{model_dir}")
        for _, local in files:
            target = dest / model_dir / local
            if target.exists() and target.stat().st_size > 0:
                size = target.stat().st_size
                total += size
                print(f"  present  {size/1024**2:9.1f} MB  {local}")
            else:
                missing += 1
                print(f"  MISSING                {local}")
        print()

    print(f"{total/1024**3:.2f} GB on disk, {missing} file(s) missing")
    if missing:
        print("Run without --check to fetch them, or copy this directory from a")
        print("machine that can reach a model hub.")
    return 1 if missing else 0


def diagnose() -> int:
    print(f"proxies: {requests.utils.getproxies() or 'none'}\n")
    any_ok = False
    for source in ("huggingface", "modelscope"):
        ok, detail = serves_bytes(source)
        any_ok |= ok
        print(f"  {source:12s} {'OK  ' if ok else 'FAIL'}  {detail}")
    print()
    if any_ok:
        print("At least one source serves weight bytes. Run without arguments.")
        return 0
    print("Neither source delivered bytes. The API host and the file CDN are")
    print("different hosts and are blocked independently; if metadata loads but")
    print("downloads do not, the fix is in network or proxy routing, not in FitAI.")
    return 2


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", choices=["auto", "huggingface", "modelscope"],
                        default="auto", help="where to download from (default: probe both)")
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST,
                        help=f"destination directory (default: {DEFAULT_DEST})")
    parser.add_argument("--check", action="store_true", help="report what is already on disk")
    parser.add_argument("--diagnose", action="store_true",
                        help="probe each source for real weight bytes")
    args = parser.parse_args(argv)

    if args.diagnose:
        return diagnose()
    if args.check:
        return check(args.dest)

    free = shutil.disk_usage(args.dest.parent if args.dest.exists() else REPO_ROOT).free
    if free < 6 * 1024 ** 3:
        print(f"warning: only {free/1024**3:.1f} GB free; about 4.6 GB is needed\n",
              file=sys.stderr)
    return download(args.source, args.dest)


if __name__ == "__main__":
    raise SystemExit(main())
