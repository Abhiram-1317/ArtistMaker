import torch
from diffusers.pipelines.stable_video_diffusion.pipeline_stable_video_diffusion import StableVideoDiffusionPipeline
from diffusers.utils.loading_utils import load_image
from diffusers.utils.export_utils import export_to_video
import sys
import json

class SVDGenerator:
    def __init__(self):
        print("Loading Stable Video Diffusion...", file=sys.stderr)
        
        self.pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=torch.float16,
            variant="fp16"
        )
        
        self.pipe.enable_model_cpu_offload()
        
        print("SVD loaded!", file=sys.stderr)
    
    def generate(self, image_path, num_frames=25, fps=6, 
                 motion_bucket_id=127, noise_aug_strength=0.02):
        """
        Generate video from single image
        motion_bucket_id: 1-255, higher = more motion
        noise_aug_strength: 0.0-1.0, higher = more variation
        """
        
        # Load and prepare image
        image = load_image(image_path)
        image = image.resize((1024, 576))
        
        # Generate frames
        frames = self.pipe(
            image,
            decode_chunk_size=8,
            num_frames=num_frames,
            motion_bucket_id=motion_bucket_id,
            noise_aug_strength=noise_aug_strength,
        ).frames[0]  # type: ignore[union-attr]
        
        return frames, fps

def main():
    config = json.loads(sys.stdin.read())
    
    generator = SVDGenerator()
    
    frames, fps = generator.generate(
        image_path=config['init_image'],
        num_frames=config.get('num_frames', 25),
        fps=config.get('fps', 6),
        motion_bucket_id=config.get('motion_bucket_id', 127),
        noise_aug_strength=config.get('noise_aug_strength', 0.02)
    )
    
    # Export
    output_path = config['output_path']
    export_to_video(frames, output_path, fps=fps)  # type: ignore[arg-type]
    
    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "num_frames": len(frames),
        "fps": fps
    }))

if __name__ == "__main__":
    main()
