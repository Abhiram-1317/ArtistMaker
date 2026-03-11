"""
Download and cache all required AI models for Project Genesis.
Run: python scripts/download_models.py
"""

import os
import sys

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

    # 1. SD-Turbo (fast image generation, ~2.5GB fp16)
    print("[1/4] Downloading SD-Turbo (~2.5GB)...")
    try:
        from diffusers import AutoPipelineForText2Image

        pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sd-turbo",
            torch_dtype=dtype,
            variant="fp16",
            use_safetensors=True,
            cache_dir=os.path.join(models_dir, "sd-turbo"),
        )
        del pipe
        print("  ✓ SD-Turbo downloaded")
    except Exception as e:
        print(f"  ✗ Failed: {e}")

    # 2. Stable Video Diffusion (image-to-video)
    print("[2/4] Downloading Stable Video Diffusion...")
    try:
        from diffusers import StableVideoDiffusionPipeline
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=torch.float16,
            variant="fp16",
            use_auth_token=hf_token,
            cache_dir=os.path.join(models_dir, "svd"),
        )
        del pipe
        print("  ✓ Stable Video Diffusion downloaded")
    except Exception as e:
        print(f"  ✗ Failed: {e}")

    # 3. Coqui TTS (voice generation)
    print("[3/4] Downloading Coqui TTS...")
    try:
        from TTS.api import TTS
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")
        del tts
        print("  ✓ Coqui XTTS v2 downloaded")
    except Exception as e:
        print(f"  ✗ Failed: {e}")

    # 4. MusicGen (music generation)
    print("[4/4] Downloading MusicGen...")
    try:
        from audiocraft.models import MusicGen
        model = MusicGen.get_pretrained("facebook/musicgen-small")
        del model
        print("  ✓ MusicGen-small downloaded")
    except Exception as e:
        print(f"  ✗ Failed: {e}")

    print()
    print("=" * 60)
    print("  Download complete! Models cached in:", models_dir)
    print("=" * 60)


if __name__ == "__main__":
    main()
