import torch
import torchaudio  # type: ignore[import-unresolved]
from audiocraft.models import MusicGen  # type: ignore[import-unresolved]
from audiocraft.data.audio import audio_write  # type: ignore[import-unresolved]
import sys
import json

class MusicGenerator:
    def __init__(self, model_size='medium'):
        """
        model_size: 'small' (300M), 'medium' (1.5B), 'large' (3.3B)
        small: faster, lower quality
        medium: balanced (recommended)
        large: best quality, slower, needs 16GB+ VRAM
        """
        print(f"Loading MusicGen {model_size} model...", file=sys.stderr)
        
        self.model = MusicGen.get_pretrained(f'facebook/musicgen-{model_size}')
        self.model.set_generation_params(duration=30)  # Default duration
        
        print("MusicGen loaded!", file=sys.stderr)
    
    def generate(self, description, duration=30, temperature=1.0, 
                 top_k=250, top_p=0.0, cfg_coef=3.0):
        """
        Generate music from text description
        
        Args:
            description: Text prompt (e.g., "upbeat electronic dance music")
            duration: Length in seconds
            temperature: Randomness (0.1-1.5, higher = more random)
            top_k: Sampling parameter
            top_p: Nucleus sampling parameter
            cfg_coef: Classifier-free guidance (higher = stick closer to prompt)
        """
        
        self.model.set_generation_params(
            duration=duration,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            cfg_coef=cfg_coef,
        )
        
        # Generate
        wav = self.model.generate([description])
        
        return wav[0].cpu()  # Return audio tensor
    
    def generate_continuation(self, prompt_audio_path, description, duration=30):
        """
        Continue from existing audio (melody conditioning)
        """
        # Load prompt audio
        prompt_waveform, sr = torchaudio.load(prompt_audio_path)
        
        # Resample if needed
        if sr != self.model.sample_rate:
            resampler = torchaudio.transforms.Resample(sr, self.model.sample_rate)
            prompt_waveform = resampler(prompt_waveform)
        
        self.model.set_generation_params(duration=duration)
        
        # Generate with melody conditioning
        wav = self.model.generate_with_chroma(
            descriptions=[description],
            melody_wavs=prompt_waveform[None],
            melody_sample_rate=self.model.sample_rate,
        )
        
        return wav[0].cpu()

def main():
    config = json.loads(sys.stdin.read())
    
    generator = MusicGenerator(model_size=config.get('model_size', 'medium'))
    
    if config.get('continuation_from'):
        # Continuation mode
        audio = generator.generate_continuation(
            prompt_audio_path=config['continuation_from'],
            description=config['description'],
            duration=config.get('duration', 30)
        )
    else:
        # Normal generation
        audio = generator.generate(
            description=config['description'],
            duration=config.get('duration', 30),
            temperature=config.get('temperature', 1.0),
            top_k=config.get('top_k', 250),
            cfg_coef=config.get('cfg_coef', 3.0)
        )
    
    # Save audio
    output_path = config['output_path'].replace('.wav', '')
    audio_write(
        output_path,
        audio,
        generator.model.sample_rate,
        strategy="loudness",
        loudness_compressor=True
    )
    
    print(json.dumps({
        "success": True,
        "output_path": output_path + '.wav',
        "duration": audio.shape[-1] / generator.model.sample_rate,
        "sample_rate": generator.model.sample_rate
    }))

if __name__ == "__main__":
    main()
