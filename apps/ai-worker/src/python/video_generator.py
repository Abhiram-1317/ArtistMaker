import torch
from diffusers import MotionAdapter, AnimateDiffPipeline, DDIMScheduler
from diffusers.utils import export_to_video
import sys
import json

class VideoGenerator:
    def __init__(self):
        print("Loading AnimateDiff model...", file=sys.stderr)
        
        # Load motion adapter
        adapter = MotionAdapter.from_pretrained(
            "guoyww/animatediff-motion-adapter-v1-5-2",
            torch_dtype=torch.float16
        )
        
        # Load base model with motion adapter
        self.pipe = AnimateDiffPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            motion_adapter=adapter,
            torch_dtype=torch.float16
        )
        
        # Use DDIM scheduler for better quality
        self.pipe.scheduler = DDIMScheduler.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            subfolder="scheduler",
            clip_sample=False,
            timestep_spacing="linspace",
            steps_offset=1
        )
        
        # Optimizations
        self.pipe.enable_vae_slicing()
        self.pipe.enable_model_cpu_offload()
        
        print("Model loaded successfully!", file=sys.stderr)
    
    def generate(self, prompt, negative_prompt="", num_frames=16, 
                 num_steps=25, guidance_scale=7.5, seed=-1):
        """Generate video from text prompt"""
        
        if seed == -1:
            generator = None
        else:
            generator = torch.Generator("cuda").manual_seed(seed)
        
        # Generate video frames
        result = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_frames=num_frames,
            num_inference_steps=num_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        )
        
        return result.frames[0]
    
    def generate_from_image(self, image_path, prompt, num_frames=16):
        """Generate video starting from an image (I2V)"""
        from PIL import Image
        
        init_image = Image.open(image_path).convert("RGB")
        init_image = init_image.resize((512, 512))
        
        # Use img2img pipeline for I2V
        result = self.pipe(
            prompt=prompt,
            image=init_image,
            num_frames=num_frames,
            strength=0.8,  # How much to change from original
        )
        
        return result.frames[0]

def main():
    config = json.loads(sys.stdin.read())
    
    generator = VideoGenerator()
    
    if config.get('init_image'):
        # Image-to-video
        frames = generator.generate_from_image(
            image_path=config['init_image'],
            prompt=config['prompt'],
            num_frames=config.get('num_frames', 16)
        )
    else:
        # Text-to-video
        frames = generator.generate(
            prompt=config['prompt'],
            negative_prompt=config.get('negative_prompt', ''),
            num_frames=config.get('num_frames', 16),
            num_steps=config.get('num_steps', 25),
            guidance_scale=config.get('guidance_scale', 7.5),
            seed=config.get('seed', -1)
        )
    
    # Export to video
    output_path = config['output_path']
    export_to_video(frames, output_path, fps=8)
    
    print(json.dumps({
        "success": True,
        "output_path": output_path,
        "num_frames": len(frames),
        "fps": 8
    }))


if __name__ == "__main__":
    main()
