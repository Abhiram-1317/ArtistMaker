# pyright: basic
"""
Pre-flight check — validates the deployment environment before starting.
Run:  python scripts/preflight_check.py
"""

import json
import os
import shutil
import subprocess
import sys
from typing import Any

# ── Colour helpers (works on Windows 10+ / Linux / macOS) ─────────────────────

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

pass_count = 0
warn_count = 0
fail_count = 0


def ok(msg: str) -> None:
    global pass_count
    pass_count += 1
    print(f"  {GREEN}✓{RESET} {msg}")


def warn(msg: str) -> None:
    global warn_count
    warn_count += 1
    print(f"  {YELLOW}⚠{RESET} {msg}")


def fail(msg: str) -> None:
    global fail_count
    fail_count += 1
    print(f"  {RED}✗{RESET} {msg}")


def section(title: str) -> None:
    print(f"\n{BOLD}── {title} ──{RESET}")


# ── Checks ────────────────────────────────────────────────────────────────────


def check_gpu() -> None:
    section("GPU")

    # nvidia-smi
    nvidia_smi = shutil.which("nvidia-smi")
    if nvidia_smi:
        try:
            out = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"],
                text=True,
                timeout=10,
            ).strip()
            for line in out.splitlines():
                ok(f"GPU detected: {line.strip()}")
        except Exception as e:
            fail(f"nvidia-smi failed: {e}")
    else:
        fail("nvidia-smi not found — no NVIDIA GPU driver installed")

    # PyTorch CUDA
    try:
        import torch  # type: ignore[import-unresolved]
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            vram = torch.cuda.get_device_properties(0).total_mem / (1024 ** 3)
            ok(f"PyTorch CUDA: {name} ({vram:.1f} GB VRAM)")
            ok(f"CUDA version: {torch.version.cuda}")
        else:
            warn("PyTorch installed but CUDA not available (CPU-only build?)")
    except ImportError:
        fail("PyTorch not installed")

    # cuDNN
    try:
        import torch  # type: ignore[import-unresolved]
        cudnn = torch.backends.cudnn.version()
        if cudnn:
            ok(f"cuDNN version: {cudnn}")
        else:
            warn("cuDNN not detected")
    except Exception:
        warn("Could not check cuDNN")


def check_python_packages() -> None:
    section("Python packages")

    required = {
        "torch": "PyTorch",
        "diffusers": "Diffusers (image/video generation)",
        "transformers": "Transformers (model loading)",
        "accelerate": "Accelerate (GPU acceleration)",
        "TTS": "Coqui TTS (voice generation)",
        "audiocraft": "AudioCraft (MusicGen + AudioGen)",
        "cv2": "OpenCV (frame interpolation)",
        "realesrgan": "Real-ESRGAN (video upscaling)",
    }

    for module, label in required.items():
        try:
            __import__(module)
            ok(label)
        except ImportError:
            fail(f"{label} — not installed (import {module} failed)")


def check_models() -> None:
    section("AI Models")

    models_dir = os.environ.get("MODELS_DIR", "./models")
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub")

    # Check HuggingFace cache for common models
    model_checks = [
        ("stabilityai/sd-turbo", "SD-Turbo (image gen)", "~2.5 GB"),
        ("stabilityai/stable-video-diffusion-img2vid-xt", "Stable Video Diffusion", "~5 GB"),
        ("facebook/musicgen-small", "MusicGen Small", "~1 GB"),
    ]

    if os.path.isdir(cache_dir):
        cached = os.listdir(cache_dir)
        for model_id, label, size in model_checks:
            # HF cache uses -- separator
            cache_name = "models--" + model_id.replace("/", "--")
            if cache_name in cached:
                ok(f"{label} (cached)")
            else:
                warn(f"{label} not cached — will download on first use ({size})")
    else:
        warn(f"HuggingFace cache dir not found ({cache_dir})")
        for _, label, size in model_checks:
            warn(f"{label} — needs download ({size})")

    # Check Coqui TTS model
    tts_dir = os.path.expanduser("~/.local/share/tts")
    if os.path.isdir(tts_dir) and os.listdir(tts_dir):
        ok("Coqui TTS models (cached)")
    else:
        warn("Coqui TTS models not cached — will download on first use (~2 GB)")


def check_services() -> None:
    section("Services")

    import socket

    services = [
        ("PostgreSQL", "localhost", 5432),
        ("Redis", "localhost", 6379),
        ("API server", "localhost", 3001),
        ("Frontend", "localhost", 3000),
        ("AI Worker", "localhost", 3002),
    ]

    for name, host, port in services:
        try:
            s = socket.create_connection((host, port), timeout=2)
            s.close()
            ok(f"{name} — reachable on {host}:{port}")
        except (ConnectionRefusedError, OSError):
            fail(f"{name} — not reachable on {host}:{port}")


def check_storage() -> None:
    section("Storage")

    output_dir = os.environ.get("OUTPUT_DIR", "./output")
    models_dir = os.environ.get("MODELS_DIR", "./models")

    for label, dir_path in [("Output dir", output_dir), ("Models dir", models_dir)]:
        abs_path = os.path.abspath(dir_path)
        if os.path.isdir(abs_path):
            # Check disk space
            try:
                usage = shutil.disk_usage(abs_path)
                free_gb = usage.free / (1024 ** 3)
                if free_gb < 10:
                    warn(f"{label}: {abs_path} — only {free_gb:.1f} GB free (recommend ≥20 GB)")
                else:
                    ok(f"{label}: {abs_path} ({free_gb:.0f} GB free)")
            except Exception:
                ok(f"{label}: {abs_path} (exists)")
        else:
            warn(f"{label}: {abs_path} — does not exist (will be created)")

    # Check for S3/R2 env vars
    s3_vars = ["AWS_ACCESS_KEY_ID", "S3_BUCKET", "R2_BUCKET", "CLOUDFLARE_R2_ENDPOINT"]
    if any(os.environ.get(v) for v in s3_vars):
        ok("Cloud storage credentials found")
    else:
        warn("No S3/R2 credentials — using local storage only")


def check_env_files() -> None:
    section("Environment files")

    checks = [
        ("apps/api/.env", ["DATABASE_URL", "JWT_SECRET"]),
        ("apps/web/.env.local", ["NEXTAUTH_SECRET"]),
        ("apps/ai-worker/.env", ["REDIS_URL"]),
    ]

    for env_file, required_vars in checks:
        full_path = os.path.join(os.getcwd(), env_file)
        if os.path.isfile(full_path):
            with open(full_path, encoding="utf-8") as f:
                content = f.read()
            missing = [v for v in required_vars if v + "=" not in content]
            if missing:
                warn(f"{env_file} — missing: {', '.join(missing)}")
            else:
                ok(f"{env_file}")
        else:
            fail(f"{env_file} — not found (copy from .env.example)")


def check_node() -> None:
    section("Node.js")

    node = shutil.which("node")
    if node:
        ver = subprocess.check_output(["node", "--version"], text=True).strip()
        major = int(ver.lstrip("v").split(".")[0])
        if major >= 18:
            ok(f"Node.js {ver}")
        else:
            fail(f"Node.js {ver} — need ≥ 18")
    else:
        fail("Node.js not found")

    npm = shutil.which("npm")
    if npm:
        ver = subprocess.check_output(["npm", "--version"], text=True).strip()
        ok(f"npm {ver}")
    else:
        fail("npm not found")


def check_monitoring() -> None:
    section("Monitoring")

    if os.environ.get("SENTRY_DSN"):
        ok("Sentry DSN configured")
    else:
        warn("SENTRY_DSN not set — no error tracking")

    # Check if GPU monitoring is available
    nvidia_smi = shutil.which("nvidia-smi")
    if nvidia_smi:
        ok("GPU monitoring available via nvidia-smi")
    else:
        warn("nvidia-smi not found — no GPU monitoring")


# ── Main ──────────────────────────────────────────────────────────────────────


def main() -> None:
    print(f"\n{BOLD}{'=' * 60}")
    print("  Project Genesis — Deployment Pre-flight Check")
    print(f"{'=' * 60}{RESET}")

    check_node()
    check_gpu()
    check_python_packages()
    check_models()
    check_env_files()
    check_services()
    check_storage()
    check_monitoring()

    # Summary
    print(f"\n{BOLD}{'=' * 60}{RESET}")
    total = pass_count + warn_count + fail_count
    print(f"  {GREEN}✓ {pass_count} passed{RESET}  "
          f"{YELLOW}⚠ {warn_count} warnings{RESET}  "
          f"{RED}✗ {fail_count} failed{RESET}  "
          f"({total} total)")

    if fail_count == 0 and warn_count == 0:
        print(f"\n  {GREEN}{BOLD}🚀 All checks passed — ready to deploy!{RESET}")
    elif fail_count == 0:
        print(f"\n  {YELLOW}{BOLD}⚠  Passed with warnings — review above{RESET}")
    else:
        print(f"\n  {RED}{BOLD}❌ {fail_count} check(s) failed — fix before deploying{RESET}")

    print()
    sys.exit(1 if fail_count > 0 else 0)


if __name__ == "__main__":
    main()
