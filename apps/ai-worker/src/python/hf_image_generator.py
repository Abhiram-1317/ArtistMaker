"""
HuggingFace Inference API image generator.
Generates high-quality 1024x1024 PNG images using FLUX.1-schnell.
Called from Node.js via python-shell.
"""

import sys
import json
import os


def main():
    raw = sys.stdin.readline().strip()
    config = json.loads(raw)
    # If double-encoded (received as string), parse again
    if isinstance(config, str):
        config = json.loads(config)

    from huggingface_hub import InferenceClient

    token = os.environ.get("HF_TOKEN", "")
    client = InferenceClient(token=token)

    width = int(config.get("width", 1024))
    height = int(config.get("height", 1024))
    print(f"Generating {width}x{height} image via HuggingFace API...", file=sys.stderr)

    image = client.text_to_image(
        config["prompt"],
        model="black-forest-labs/FLUX.1-schnell",
        width=width,
        height=height,
    )

    output_path = config["output_path"]
    image.save(output_path, "PNG")

    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "width": image.size[0],
        "height": image.size[1],
    }))


if __name__ == "__main__":
    main()
