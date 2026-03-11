"""
HuggingFace Inference API video generator.
Generates videos without requiring a local GPU.

Strategy: HF free API doesn't support text-to-video directly.
Instead, we generate a high-quality keyframe image via FLUX.1-schnell,
then apply cinematic Ken Burns motion (zoom/pan/dolly) to create
smooth video output. This is a common technique in production video.

Called from Node.js via python-shell.
"""

import sys
import json
import os
import math
import numpy as np
from PIL import Image
import imageio.v3 as iio


def ken_burns_effect(image: Image.Image, num_frames: int = 16,
                     zoom_start: float = 1.0, zoom_end: float = 1.15,
                     pan_x: float = 0.02, pan_y: float = 0.01) -> list:
    """Apply Ken Burns zoom/pan effect to a single image to create video frames."""
    w, h = image.size
    frames = []

    for i in range(num_frames):
        t = i / max(num_frames - 1, 1)

        # Smooth easing (ease-in-out)
        t_ease = 0.5 - 0.5 * math.cos(math.pi * t)

        # Interpolate zoom
        zoom = zoom_start + (zoom_end - zoom_start) * t_ease

        # Calculate crop dimensions
        crop_w = int(w / zoom)
        crop_h = int(h / zoom)

        # Pan offset (smooth drift)
        offset_x = int((w - crop_w) * (0.5 + pan_x * t_ease))
        offset_y = int((h - crop_h) * (0.5 + pan_y * t_ease))

        # Clamp
        offset_x = max(0, min(offset_x, w - crop_w))
        offset_y = max(0, min(offset_y, h - crop_h))

        # Crop and resize back to original dimensions
        cropped = image.crop((offset_x, offset_y,
                              offset_x + crop_w, offset_y + crop_h))
        frame = cropped.resize((w, h), Image.LANCZOS)
        frames.append(np.array(frame))

    return frames


def main():
    raw = sys.stdin.readline().strip()
    config = json.loads(raw)
    if isinstance(config, str):
        config = json.loads(config)

    output_path = config["output_path"]
    num_frames = int(config.get("num_frames", 16))
    fps = int(config.get("fps", 8))
    mode = config.get("mode", "text-to-video")

    if mode == "image-to-video":
        # Animate an existing image
        image_path = config["image_path"]
        print(f"Animating image: {image_path}", file=sys.stderr)
        image = Image.open(image_path).convert("RGB")
    else:
        # Generate a keyframe image via HF API, then animate it
        from huggingface_hub import InferenceClient

        token = os.environ.get("HF_TOKEN", "")
        client = InferenceClient(
            token=token,
            headers={"X-Wait-For-Model": "true"},
        )

        prompt = config["prompt"]
        print(f"Generating keyframe via HuggingFace API...", file=sys.stderr)
        print(f"Prompt: {prompt}", file=sys.stderr)

        image = client.text_to_image(
            prompt,
            model="black-forest-labs/FLUX.1-schnell",
            width=1024,
            height=576,
        )

    print(f"Applying Ken Burns motion ({num_frames} frames @ {fps}fps)...", file=sys.stderr)

    # Apply cinematic motion
    zoom_end = float(config.get("zoom_end", 1.15))
    pan_x = float(config.get("pan_x", 0.03))
    pan_y = float(config.get("pan_y", 0.01))

    frames = ken_burns_effect(
        image,
        num_frames=num_frames,
        zoom_start=1.0,
        zoom_end=zoom_end,
        pan_x=pan_x,
        pan_y=pan_y,
    )

    # Write video
    iio.imwrite(output_path, frames, fps=fps, codec="libx264",
                plugin="pyav")

    file_size = os.path.getsize(output_path)
    duration = num_frames / fps
    print(f"Video saved: {output_path} ({file_size} bytes, {duration:.1f}s)", file=sys.stderr)

    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "num_frames": num_frames,
        "fps": fps,
        "file_size": file_size,
        "duration": duration,
        "mode": mode,
    }))


if __name__ == "__main__":
    main()
