"""
Image generation using Stable Diffusion XL.
Called by Node.js via python-shell — outputs JSON to stdout.
"""

import argparse
import json
import os
import sys
import time


def main():
    parser = argparse.ArgumentParser(description="Generate image with SDXL")
    parser.add_argument("--prompt", required=True, help="Text prompt")
    parser.add_argument("--negative-prompt", default="", help="Negative prompt")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=576)
    parser.add_argument("--steps", type=int, default=30)
    parser.add_argument("--guidance-scale", type=float, default=7.5)
    parser.add_argument("--seed", type=int, default=-1)
    parser.add_argument("--model", default="sd-xl")
    args = parser.parse_args()

    start = time.time()

    try:
        import torch
        from diffusers import StableDiffusionXLPipeline

        models_dir = os.environ.get("MODELS_DIR", "./models")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32

        pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=dtype,
            variant="fp16" if device == "cuda" else None,
            cache_dir=os.path.join(models_dir, "sdxl"),
        ).to(device)

        # Enable memory optimizations
        if device == "cuda":
            pipe.enable_xformers_memory_efficient_attention()

        generator = None
        if args.seed >= 0:
            generator = torch.Generator(device=device).manual_seed(args.seed)

        image = pipe(
            prompt=args.prompt,
            negative_prompt=args.negative_prompt or None,
            width=args.width,
            height=args.height,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance_scale,
            generator=generator,
        ).images[0]

        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        image.save(args.output)

        elapsed = time.time() - start
        print(json.dumps({
            "status": "success",
            "path": args.output,
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
