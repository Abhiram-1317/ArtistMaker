# pyright: basic
"""
Music generation using Meta's MusicGen (audiocraft).
Called by Node.js via python-shell — outputs JSON to stdout.
"""

import argparse
import json
import os
import sys
import time


def main():
    parser = argparse.ArgumentParser(description="Generate music with MusicGen")
    parser.add_argument("--prompt", required=True, help="Music description")
    parser.add_argument("--output", required=True, help="Output WAV path")
    parser.add_argument("--model", default="musicgen-small",
                        choices=["musicgen-small", "musicgen-medium", "musicgen-large"])
    parser.add_argument("--duration", type=int, default=10, help="Duration in seconds")
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--top-k", type=int, default=250)
    parser.add_argument("--melody", default="", help="Optional melody audio path")
    args = parser.parse_args()

    start = time.time()

    try:
        import torch
        import torchaudio  # type: ignore[import-unresolved]
        from audiocraft.models import MusicGen  # type: ignore[import-unresolved]

        model_map = {
            "musicgen-small": "facebook/musicgen-small",
            "musicgen-medium": "facebook/musicgen-medium",
            "musicgen-large": "facebook/musicgen-large",
        }
        model_name = model_map.get(args.model, "facebook/musicgen-small")

        model = MusicGen.get_pretrained(model_name)
        model.set_generation_params(
            duration=args.duration,
            temperature=args.temperature,
            top_k=args.top_k,
        )

        if args.melody and os.path.exists(args.melody):
            melody, sr = torchaudio.load(args.melody)
            wav = model.generate_with_chroma(
                descriptions=[args.prompt],
                melody_wavs=melody[None],
                melody_sample_rate=sr,
            )
        else:
            wav = model.generate(descriptions=[args.prompt])

        os.makedirs(os.path.dirname(args.output), exist_ok=True)

        # Save as WAV
        audio = wav[0].cpu()
        torchaudio.save(args.output, audio, sample_rate=32000)

        duration_sec = audio.shape[-1] / 32000

        elapsed = time.time() - start
        print(json.dumps({
            "status": "success",
            "path": args.output,
            "duration_sec": round(duration_sec, 2),
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
