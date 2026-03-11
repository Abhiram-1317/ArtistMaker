# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis — Google Colab GPU Notebook
# 
# How to use:
# 1. Go to https://colab.research.google.com
# 2. Click "New Notebook"
# 3. Runtime → Change runtime type → T4 GPU → Save
# 4. Copy-paste each cell below and run them in order
# ─────────────────────────────────────────────────────────────────────────────


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 1: Setup — Clone repo + Install dependencies (~2 min)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

!nvidia-smi
!git clone https://github.com/Abhiram-1317/ArtistMaker.git /content/genesis
%cd /content/genesis/apps/ai-worker

!pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu121
!pip install -q diffusers transformers accelerate safetensors
!pip install -q huggingface-hub Pillow imageio imageio-ffmpeg
!pip install -q einops omegaconf av

import torch
print(f"\n✅ PyTorch {torch.__version__}")
print(f"✅ CUDA available: {torch.cuda.is_available()}")
print(f"✅ GPU: {torch.cuda.get_device_name(0)}")
print(f"✅ VRAM: {torch.cuda.get_device_properties(0).total_mem / 1024**3:.1f} GB")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 2: Generate a high-quality image (~10 sec)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import subprocess, json, os
from IPython.display import display, Image as IPImage

os.makedirs("/content/output", exist_ok=True)

# Paste your HuggingFace token here (get one at https://huggingface.co/settings/tokens)
os.environ["HF_TOKEN"] = "hf_YOUR_TOKEN_HERE"

config = json.dumps({
    "prompt": "A lone astronaut standing on Mars, cinematic lighting, highly detailed, 8k",
    "width": 1024,
    "height": 1024,
    "output_path": "/content/output/keyframe.png"
})

result = subprocess.run(
    ["python", "src/python/hf_image_generator.py"],
    input=config, capture_output=True, text=True,
    env={**os.environ}
)
print(result.stderr)
print(result.stdout)

display(IPImage(filename="/content/output/keyframe.png", width=512))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 3: Generate AnimateDiff video from text (REAL AI video!) (~2-5 min first run)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

config = json.dumps({
    "prompt": "A lone astronaut walking on Mars, dust particles floating in wind, cinematic, smooth motion, high quality",
    "negative_prompt": "blurry, low quality, distorted, watermark, text",
    "num_frames": 16,
    "num_steps": 25,
    "guidance_scale": 7.5,
    "fps": 8,
    "seed": 42,
    "output_path": "/content/output/animatediff_video.mp4"
})

result = subprocess.run(
    ["python", "src/python/video_generator.py"],
    input=config, capture_output=True, text=True,
    env={**os.environ}
)
print(result.stderr)
print(result.stdout)

from IPython.display import Video
Video("/content/output/animatediff_video.mp4", embed=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 4: Generate SVD image-to-video (animate the keyframe!) (~3-5 min first run)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

config = json.dumps({
    "image_path": "/content/output/keyframe.png",
    "num_frames": 25,
    "fps": 7,
    "motion_bucket_id": 127,
    "noise_aug_strength": 0.02,
    "seed": 42,
    "output_path": "/content/output/svd_video.mp4"
})

result = subprocess.run(
    ["python", "src/python/svd_generator.py"],
    input=config, capture_output=True, text=True,
    env={**os.environ}
)
print(result.stderr)
print(result.stdout)

Video("/content/output/svd_video.mp4", embed=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 5: Ken Burns video (quick, no model download needed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

config = json.dumps({
    "prompt": "A futuristic city at sunset, flying cars, neon lights, cinematic",
    "num_frames": 24,
    "fps": 8,
    "zoom_end": 1.2,
    "pan_x": 0.05,
    "pan_y": 0.02,
    "output_path": "/content/output/kenburns_video.mp4",
    "mode": "text-to-video"
})

result = subprocess.run(
    ["python", "src/python/hf_video_generator.py"],
    input=config, capture_output=True, text=True,
    env={**os.environ}
)
print(result.stderr)
print(result.stdout)

Video("/content/output/kenburns_video.mp4", embed=True)
