"""
Stable Video Diffusion — image-to-video generation.
Takes a single image and animates it into a short video clip.
Requires GPU with 16GB+ VRAM.
For CPU/laptop use, see hf_video_generator.py (uses free HF API).
"""

import torch
from diffusers import StableVideoDiffusionPipeline
from diffusers.utils import load_image, export_to_video
from PIL import Image
import sys
import json


class SVDGenerator:
    def __init__(self):
        print("Loading SVD model...", file=sys.stderr)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float16 if self.device == "cuda" else torch.float32

        self.pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=self.dtype,
            variant="fp16" if self.device == "cuda" else None,
        )

        self.pipe.enable_model_cpu_offload()

        print("SVD loaded!", file=sys.stderr)

    def generate(self, image_path, num_frames=25, fps=7,
                 motion_bucket_id=127, noise_aug_strength=0.02, seed=-1):
        """Generate video from input image"""

        image = load_image(image_path)
        image = image.resize((1024, 576))

        if seed == -1:
            generator = None
        else:
            generator = torch.Generator(self.device).manual_seed(seed)

        result = self.pipe(
            image,
            num_frames=num_frames,
            decode_chunk_size=4,
            motion_bucket_id=motion_bucket_id,
            noise_aug_strength=noise_aug_strength,
            generator=generator,
        )

        return result.frames[0]


def main():
    raw = sys.stdin.readline().strip()
    config = json.loads(raw)
    if isinstance(config, str):
        config = json.loads(config)

    generator = SVDGenerator()

    frames = generator.generate(
        image_path=config["image_path"],
        num_frames=config.get("num_frames", 25),
        fps=config.get("fps", 7),
        motion_bucket_id=config.get("motion_bucket_id", 127),
        noise_aug_strength=config.get("noise_aug_strength", 0.02),
        seed=config.get("seed", -1),
    )

    output_path = config["output_path"]
    fps = config.get("fps", 7)
    export_to_video(frames, output_path, fps=fps)

    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "num_frames": len(frames),
        "fps": fps,
    }))


if __name__ == "__main__":
    main()
