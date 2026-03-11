import torch
import os
import sys
import traceback

try:
    from diffusers import AutoPipelineForText2Image
    print("Loading model from local files...", flush=True)
    pipe = AutoPipelineForText2Image.from_pretrained(
        "models/sd-turbo",
        torch_dtype=torch.float32,
        variant="fp16",
        use_safetensors=True,
    )
    pipe = pipe.to("cpu")
    pipe.enable_vae_slicing()
    print("Model loaded!", flush=True)
    os.makedirs("output/images", exist_ok=True)
    print("Generating image (4 steps, 512x512)...", flush=True)
    result = pipe(
        prompt="A lone astronaut standing on Mars, cinematic lighting",
        num_inference_steps=4,
        guidance_scale=0.0,
        width=512,
        height=512,
    )
    result.images[0].save("output/images/test_astronaut.png")
    print("SUCCESS: Image saved to output/images/test_astronaut.png")
except Exception as e:
    print(f"ERROR: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)
