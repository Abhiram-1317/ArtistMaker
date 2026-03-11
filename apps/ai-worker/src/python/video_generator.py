"""
AnimateDiff video generator — text-to-video and image-to-video.
Requires GPU with 8GB+ VRAM for best results.
For CPU/laptop use, see hf_video_generator.py (uses free HF API).
"""

import torch
from diffusers import MotionAdapter, AnimateDiffPipeline, DDIMScheduler
from diffusers.utils import export_to_video
import sys
import json


class VideoGenerator:
    def __init__(self):
        print("Loading AnimateDiff model...", file=sys.stderr)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float16 if self.device == "cuda" else torch.float32

        # Load motion adapter
        adapter = MotionAdapter.from_pretrained(
            "guoyww/animatediff-motion-adapter-v1-5-2",
            torch_dtype=self.dtype,
        )

        # Load base model with motion adapter
        self.pipe = AnimateDiffPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            motion_adapter=adapter,
            torch_dtype=self.dtype,
        )

        # Use DDIM scheduler for better quality
        self.pipe.scheduler = DDIMScheduler.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            subfolder="scheduler",
            clip_sample=False,
            timestep_spacing="linspace",
            steps_offset=1,
        )

        # Memory optimizations
        self.pipe.enable_vae_slicing()
        if self.device == "cuda":
            self.pipe.enable_model_cpu_offload()
        else:
            self.pipe = self.pipe.to("cpu")
            print("Running on CPU — video generation will be very slow", file=sys.stderr)

        print("AnimateDiff loaded!", file=sys.stderr)

    def generate(self, prompt, negative_prompt="", num_frames=16,
                 num_steps=25, guidance_scale=7.5, seed=-1):
        """Generate video from text prompt"""

        if seed == -1:
            generator = None
        else:
            generator = torch.Generator(self.device).manual_seed(seed)

        result = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_frames=num_frames,
            num_inference_steps=num_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        )

        return result.frames[0]


def main():
    raw = sys.stdin.readline().strip()
    config = json.loads(raw)
    if isinstance(config, str):
        config = json.loads(config)

    generator = VideoGenerator()

    frames = generator.generate(
        prompt=config["prompt"],
        negative_prompt=config.get("negative_prompt", ""),
        num_frames=config.get("num_frames", 16),
        num_steps=config.get("num_steps", 25),
        guidance_scale=config.get("guidance_scale", 7.5),
        seed=config.get("seed", -1),
    )

    output_path = config["output_path"]
    fps = config.get("fps", 8)
    export_to_video(frames, output_path, fps=fps)

    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "num_frames": len(frames),
        "fps": fps,
    }))


if __name__ == "__main__":
    main()
