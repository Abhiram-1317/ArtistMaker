# pyright: basic
"""
Frame interpolation — increases video FPS using RIFE (ncnn-vulkan) when
available, falling back to OpenCV optical-flow blending.
"""

import sys
import json
import os

import cv2  # type: ignore[import-unresolved]
import numpy as np  # type: ignore[import-unresolved]


# ── Try to load RIFE ncnn-vulkan; fall back to optical-flow ──────────────────

_USE_RIFE = False
_rife_instance = None

try:
    from rife_ncnn_vulkan import Rife  # type: ignore[import-unresolved]

    _USE_RIFE = True
except ImportError:
    pass


class FrameInterpolator:
    """Interpolate video frames to increase FPS."""

    def __init__(self) -> None:
        global _rife_instance
        if _USE_RIFE and _rife_instance is None:
            print("Loading RIFE ncnn-vulkan model…", file=sys.stderr)
            _rife_instance = Rife(gpuid=0, tta_mode=False)
            print("RIFE loaded!", file=sys.stderr)
        elif not _USE_RIFE:
            print(
                "RIFE not available — using OpenCV optical-flow interpolation",
                file=sys.stderr,
            )
        self.rife = _rife_instance

    # ── public API ───────────────────────────────────────────────────────

    def interpolate(
        self,
        input_video: str,
        output_video: str,
        target_fps: int = 24,
    ) -> str:
        cap = cv2.VideoCapture(input_video)
        source_fps = cap.get(cv2.CAP_PROP_FPS) or 8
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        interp_factor = max(1, int(round(target_fps / source_fps)))
        print(
            f"Interpolating {source_fps}fps → {target_fps}fps ({interp_factor}x)",
            file=sys.stderr,
        )

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")  # type: ignore[attr-defined]
        out = cv2.VideoWriter(output_video, fourcc, target_fps, (width, height))

        ret, prev_frame = cap.read()
        if not ret:
            cap.release()
            raise RuntimeError("Could not read first frame from video")

        out.write(prev_frame)
        frame_count = 0

        while True:
            ret, next_frame = cap.read()
            if not ret:
                break

            # Generate intermediate frames
            for i in range(1, interp_factor):
                t = i / interp_factor
                interpolated = self._interpolate_pair(prev_frame, next_frame, t)
                out.write(interpolated)

            out.write(next_frame)
            prev_frame = next_frame
            frame_count += 1

            if frame_count % 10 == 0:
                print(f"Processed {frame_count} source frames", file=sys.stderr)

        cap.release()
        out.release()
        print(f"Done — wrote {output_video}", file=sys.stderr)
        return output_video

    # ── private helpers ──────────────────────────────────────────────────

    def _interpolate_pair(
        self,
        frame_a: np.ndarray,
        frame_b: np.ndarray,
        t: float,
    ) -> np.ndarray:
        """Return an intermediate frame at normalised time *t* ∈ (0, 1)."""
        if self.rife is not None:
            return self.rife.process(frame_a, frame_b, timestep=t)

        # Fallback: OpenCV optical-flow based blending
        return self._optical_flow_blend(frame_a, frame_b, t)

    @staticmethod
    def _optical_flow_blend(
        frame_a: np.ndarray,
        frame_b: np.ndarray,
        t: float,
    ) -> np.ndarray:
        """Blend two frames using dense optical flow warping."""
        gray_a = cv2.cvtColor(frame_a, cv2.COLOR_BGR2GRAY)
        gray_b = cv2.cvtColor(frame_b, cv2.COLOR_BGR2GRAY)

        # Compute forward optical flow (a → b)
        flow = cv2.calcOpticalFlowFarneback(  # type: ignore[call-overload]
            gray_a, gray_b, None, 0.5, 3, 15, 3, 5, 1.2, 0  # type: ignore[arg-type]
        )

        h, w = frame_a.shape[:2]
        flow_map = np.column_stack(
            (np.repeat(np.arange(w)[np.newaxis, :], h, axis=0).flatten(),
             np.repeat(np.arange(h)[:, np.newaxis], w, axis=1).flatten())
        ).reshape(h, w, 2).astype(np.float32)

        # Warp frame_a forward by t
        warp_a = flow_map + flow * t
        warped_a = cv2.remap(
            frame_a,
            warp_a[:, :, 0],
            warp_a[:, :, 1],
            cv2.INTER_LINEAR,
        )

        # Warp frame_b backward by (1 - t)
        warp_b = flow_map - flow * (1 - t)
        warped_b = cv2.remap(
            frame_b,
            warp_b[:, :, 0],
            warp_b[:, :, 1],
            cv2.INTER_LINEAR,
        )

        # Linear blend
        blended = cv2.addWeighted(warped_a, 1.0 - t, warped_b, t, 0)
        return blended


# ── CLI entrypoint ────────────────────────────────────────────────────────────

def main() -> None:
    config = json.loads(sys.stdin.read())

    interpolator = FrameInterpolator()
    output = interpolator.interpolate(
        input_video=config["input_video"],
        output_video=config["output_video"],
        target_fps=config.get("target_fps", 24),
    )

    print(json.dumps({"success": True, "output_path": output}))


if __name__ == "__main__":
    main()
