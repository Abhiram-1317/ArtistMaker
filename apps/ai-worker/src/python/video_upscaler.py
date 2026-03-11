# pyright: basic
"""
Video upscaler — uses Real-ESRGAN to upscale video frames.
Reads JSON config from stdin, writes result JSON to stdout.
"""

import sys
import json

import cv2  # type: ignore[import-unresolved]
import numpy as np  # type: ignore[import-unresolved]
import torch  # type: ignore[import-unresolved]
from basicsr.archs.rrdbnet_arch import RRDBNet  # type: ignore[import-unresolved]
from realesrgan import RealESRGANer  # type: ignore[import-unresolved]


class VideoUpscaler:
    """Upscale video frames using Real-ESRGAN."""

    def __init__(self, scale: int = 2) -> None:
        print(f"Loading Real-ESRGAN {scale}x model…", file=sys.stderr)

        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=scale,
        )

        # Model weights will be auto-downloaded by RealESRGANer
        model_name = f"RealESRGAN_x{scale}plus"

        self.upsampler = RealESRGANer(  # type: ignore[call-arg]
            scale=scale,
            model_path=None,  # auto-downloads from hub
            model=model,
            model_name=model_name,  # type: ignore[call-arg]
            tile=400,        # tile size for VRAM efficiency
            tile_pad=10,
            pre_pad=0,
            half=torch.cuda.is_available(),  # FP16 only when GPU available
            gpu_id=0 if torch.cuda.is_available() else None,
        )

        print("Real-ESRGAN loaded!", file=sys.stderr)

    def upscale(
        self,
        input_video: str,
        output_video: str,
        target_width: int = 1920,
        target_height: int = 1080,
    ) -> str:
        """Upscale every frame of *input_video* and write to *output_video*."""

        cap = cv2.VideoCapture(input_video)
        fps = cap.get(cv2.CAP_PROP_FPS) or 24

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")  # type: ignore[attr-defined]
        out = cv2.VideoWriter(
            output_video, fourcc, fps, (target_width, target_height)
        )

        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Upscale frame
            upscaled, _ = self.upsampler.enhance(frame, outscale=2)

            # Resize to exact target resolution
            upscaled = cv2.resize(upscaled, (target_width, target_height))

            out.write(upscaled)
            frame_count += 1

            if frame_count % 10 == 0:
                print(f"Upscaled {frame_count} frames", file=sys.stderr)

        cap.release()
        out.release()
        print(
            f"Done — upscaled {frame_count} frames → {output_video}",
            file=sys.stderr,
        )
        return output_video


# ── CLI entrypoint ────────────────────────────────────────────────────────────

def main() -> None:
    config = json.loads(sys.stdin.read())

    upscaler = VideoUpscaler(scale=config.get("scale", 2))
    output = upscaler.upscale(
        input_video=config["input_video"],
        output_video=config["output_video"],
        target_width=config.get("width", 1920),
        target_height=config.get("height", 1080),
    )

    print(json.dumps({"success": True, "output_path": output}))


if __name__ == "__main__":
    main()
