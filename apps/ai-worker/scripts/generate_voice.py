# pyright: basic
"""
Voice / TTS generation using Coqui XTTS v2.
Called by Node.js via python-shell — outputs JSON to stdout.
"""

import argparse
import json
import os
import sys
import time


def main():
    parser = argparse.ArgumentParser(description="Generate speech with TTS")
    parser.add_argument("--text", required=True, help="Text to speak")
    parser.add_argument("--output", required=True, help="Output WAV path")
    parser.add_argument("--model", default="coqui-tts", help="TTS model")
    parser.add_argument("--speaker", default="", help="Speaker/voice preset")
    parser.add_argument("--language", default="en", help="Language code")
    parser.add_argument("--speed", type=float, default=1.0, help="Speed multiplier")
    args = parser.parse_args()

    start = time.time()

    try:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)

        if args.model == "coqui-tts":
            from TTS.api import TTS  # type: ignore[import-unresolved]

            tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

            # Generate speech
            tts.tts_to_file(
                text=args.text,
                file_path=args.output,
                language=args.language,
                speaker=args.speaker if args.speaker else None,
                speed=args.speed,
            )
        elif args.model == "bark":
            from transformers import AutoProcessor, BarkModel
            import torch
            import scipy.io.wavfile  # type: ignore[import-unresolved]

            device = "cuda" if torch.cuda.is_available() else "cpu"
            processor = AutoProcessor.from_pretrained("suno/bark")
            model = BarkModel.from_pretrained("suno/bark").to(device)  # type: ignore[arg-type]

            inputs = processor(args.text, return_tensors="pt").to(device)
            audio = model.generate(**inputs)
            audio_np = audio.cpu().numpy().squeeze()

            scipy.io.wavfile.write(args.output, 24000, audio_np)
        else:
            raise ValueError(f"Unknown voice model: {args.model}")

        # Get audio duration
        duration_sec = 0
        try:
            import wave
            with wave.open(args.output, "r") as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                duration_sec = round(frames / float(rate), 2)
        except Exception:
            pass

        elapsed = time.time() - start
        print(json.dumps({
            "status": "success",
            "path": args.output,
            "duration_sec": duration_sec,
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
