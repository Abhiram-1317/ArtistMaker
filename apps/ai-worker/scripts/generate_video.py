# pyright: basic
"""
Video generation using Stable Video Diffusion (image-to-video).
Called by Node.js via python-shell — outputs JSON to stdout.
"""

import argparse
import json
import os
import sys
import time


def main():
    parser = argparse.ArgumentParser(description="Generate video from image")
    parser.add_argument("--input", required=True, help="Input image path or text prompt")
    parser.add_argument("--input-type", choices=["text", "image"], default="image")
    parser.add_argument("--output", required=True, help="Output video path")
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=576)
    parser.add_argument("--num-frames", type=int, default=25)
    parser.add_argument("--fps", type=int, default=8)
    parser.add_argument("--motion-strength", type=float, default=127)
    parser.add_argument("--seed", type=int, default=-1)
    args = parser.parse_args()

    start = time.time()

    try:
        import torch
        from diffusers.pipelines.stable_video_diffusion.pipeline_stable_video_diffusion import StableVideoDiffusionPipeline
        from diffusers.utils.export_utils import export_to_video
        from PIL import Image

        models_dir = os.environ.get("MODELS_DIR", "./models")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32

        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=dtype,
            variant="fp16" if device == "cuda" else None,
            cache_dir=os.path.join(models_dir, "svd"),
        ).to(device)

        if device == "cuda":
            pipe.enable_xformers_memory_efficient_attention()

        # Load or generate the conditioning image
        if args.input_type == "image":
            image = Image.open(args.input).convert("RGB")
            image = image.resize((args.width, args.height))
        else:
            # For text-to-video, first generate an image using SDXL
            # then feed it to SVD — handled by the Node orchestrator
            raise ValueError("text-to-video should provide an image from the keyframe step")

        generator = None
        if args.seed >= 0:
            generator = torch.Generator(device=device).manual_seed(args.seed)

        frames = pipe(
            image,
            num_frames=args.num_frames,
            decode_chunk_size=8,
            motion_bucket_id=int(args.motion_strength),
            generator=generator,
        ).frames[0]  # type: ignore[union-attr]

        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        export_to_video(frames, args.output, fps=args.fps)  # type: ignore[arg-type]

        elapsed = time.time() - start
        print(json.dumps({
            "status": "success",
            "path": args.output,
            "num_frames": len(frames),
            "fps": args.fps,
            "elapsed_sec": round(elapsed, 2),
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "error": str(e),
            "elapsed_sec": round(time.time() - start, 2),
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
