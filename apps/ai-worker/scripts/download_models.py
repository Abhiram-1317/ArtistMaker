# pyright: basic
"""
Download and cache all required AI models for Project Genesis.
Run: python scripts/download_models.py
"""

import os
import sys
import urllib.request

def main():
    models_dir = os.environ.get("MODELS_DIR", "./models")
    os.makedirs(models_dir, exist_ok=True)
    hf_token = os.environ.get("HF_TOKEN", None)

    print("=" * 60)
    print("  Project Genesis — Model Downloader")
    print("=" * 60)

    # Check GPU
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            vram = torch.cuda.get_device_properties(0).total_mem / (1024**3)
            print(f"  GPU: {gpu_name} ({vram:.1f} GB VRAM)")
        else:
            print("  WARNING: No CUDA GPU detected — models will run on CPU (very slow)")
    except ImportError:
        print("  ERROR: PyTorch not installed. Run:")
        print("  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
        sys.exit(1)

    print()

    use_cuda = torch.cuda.is_available()
    dtype = torch.float16 if use_cuda else torch.float32
    total = 7
    ok = 0
    failed = 0

    # 1. SD-Turbo (fast image generation, ~2.5GB fp16)
    print(f"[1/{total}] Downloading SD-Turbo (~2.5GB)...")
    try:
        from diffusers.pipelines.auto_pipeline import AutoPipelineForText2Image

        pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sd-turbo",
            torch_dtype=dtype,
            variant="fp16",
            use_safetensors=True,
            cache_dir=os.path.join(models_dir, "sd-turbo"),
        )
        del pipe
        ok += 1
        print("  ✓ SD-Turbo downloaded")
    except Exception as e:
        failed += 1
        print(f"  ✗ Failed: {e}")

    # 2. Stable Video Diffusion (image-to-video, ~5GB)
    print(f"[2/{total}] Downloading Stable Video Diffusion (~5GB)...")
    try:
        from diffusers.pipelines.stable_video_diffusion.pipeline_stable_video_diffusion import StableVideoDiffusionPipeline
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=torch.float16,
            variant="fp16",
            use_auth_token=hf_token,
            cache_dir=os.path.join(models_dir, "svd"),
        )
        del pipe
        ok += 1
        print("  ✓ Stable Video Diffusion downloaded")
    except Exception as e:
        failed += 1
        print(f"  ✗ Failed: {e}")

    # 3. Coqui TTS — XTTS v2 (~2GB)
    print(f"[3/{total}] Downloading Coqui TTS XTTS v2 (~2GB)...")
    try:
        from TTS.api import TTS  # type: ignore[import-unresolved]
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
        del tts
        ok += 1
        print("  ✓ Coqui XTTS v2 downloaded")
    except Exception as e:
        failed += 1
        print(f"  ✗ Failed: {e}")

    # 4. MusicGen Medium (~3GB)
    print(f"[4/{total}] Downloading MusicGen Medium (~3GB)...")
    try:
        from audiocraft.models import MusicGen  # type: ignore[import-unresolved]
        model = MusicGen.get_pretrained("facebook/musicgen-medium")
        del model
        ok += 1
        print("  ✓ MusicGen-medium downloaded")
    except Exception as e:
        failed += 1
        print(f"  ✗ Failed: {e}")

    # 5. AudioGen Medium (~2GB)
    print(f"[5/{total}] Downloading AudioGen Medium (~2GB)...")
    try:
        from audiocraft.models import AudioGen  # type: ignore[import-unresolved]
        model = AudioGen.get_pretrained("facebook/audiogen-medium")
        del model
        ok += 1
        print("  ✓ AudioGen-medium downloaded")
    except Exception as e:
        failed += 1
        print(f"  ✗ Failed: {e}")

    # 6. Real-ESRGAN x2 upscaler (~60MB)
    print(f"[6/{total}] Downloading Real-ESRGAN x2plus (~60MB)...")
    esrgan_path = os.path.join(models_dir, "RealESRGAN_x2plus.pth")
    try:
        if not os.path.isfile(esrgan_path):
            url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth"
            urllib.request.urlretrieve(url, esrgan_path)
        ok += 1
        print("  ✓ Real-ESRGAN x2plus downloaded")
    except Exception as e:
        failed += 1
        print(f"  ✗ Failed: {e}")

    # 7. RIFE (frame interpolation) — optional, uses OpenCV fallback if absent
    print(f"[7/{total}] Checking RIFE availability...")
    try:
        from rife_ncnn_vulkan import Rife  # type: ignore[import-unresolved]
        ok += 1
        print("  ✓ RIFE ncnn-vulkan available")
    except ImportError:
        print("  ⚠ RIFE not installed — will use OpenCV optical-flow fallback")
        print("    (Install with: pip install rife-ncnn-vulkan-python)")

    # Summary
    print()
    print("=" * 60)
    print(f"  ✓ {ok} models ready   ✗ {failed} failed")
    print(f"  Cache: {models_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
