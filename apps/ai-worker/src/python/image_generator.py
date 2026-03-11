import torch
from diffusers import AutoPipelineForText2Image
import sys
import json
import os


class ImageGenerator:
    def __init__(self):
        print("Loading SD-Turbo model...", file=sys.stderr)

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float16 if self.device == "cuda" else torch.float32

        # Try local models dir first, fall back to HuggingFace hub
        script_dir = os.path.dirname(os.path.abspath(__file__))
        local_model = os.path.join(script_dir, "..", "..", "models", "sd-turbo")
        model_path = local_model if os.path.isdir(local_model) else "stabilityai/sd-turbo"

        load_kwargs = {
            "torch_dtype": self.dtype,
            "use_safetensors": True,
            "variant": "fp16",
        }

        self.pipe = AutoPipelineForText2Image.from_pretrained(
            model_path,
            **load_kwargs,
        )

        # Enable memory optimizations
        if self.device == "cuda":
            self.pipe.enable_model_cpu_offload()
            self.pipe.enable_vae_slicing()
        else:
            self.pipe = self.pipe.to("cpu")
            self.pipe.enable_vae_slicing()
            print("Running on CPU — generation will be slow (~1-3 min per image)", file=sys.stderr)

        print(f"Model loaded on {self.device}!", file=sys.stderr)

    def generate(self, prompt, negative_prompt="", width=512, height=512,
                 num_steps=4, guidance_scale=0.0, seed=-1):
        """Generate image from text prompt using SDXL-Turbo (1-4 steps)"""

        # Set seed for reproducibility
        if seed == -1:
            generator = None
        else:
            generator = torch.Generator(self.device).manual_seed(seed)

        # SDXL-Turbo works best with guidance_scale=0.0 and 1-4 steps
        result = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=num_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        )

        return result.images[0]


def main():
    # Read config from stdin
    config = json.loads(sys.stdin.read())

    # Initialize generator
    gen = ImageGenerator()

    # Generate image
    image = gen.generate(
        prompt=config["prompt"],
        negative_prompt=config.get("negative_prompt", ""),
        width=config.get("width", 512),
        height=config.get("height", 512),
        num_steps=config.get("num_steps", 4),
        guidance_scale=config.get("guidance_scale", 0.0),
        seed=config.get("seed", -1),
    )

    # Save image
    output_path = config["output_path"]
    image.save(output_path)

    # Return success
    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "width": image.width,
        "height": image.height,
    }))


if __name__ == "__main__":
    main()
