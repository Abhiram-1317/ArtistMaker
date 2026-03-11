from audiocraft.models import AudioGen  # type: ignore[import-unresolved]
from audiocraft.data.audio import audio_write  # type: ignore[import-unresolved]
import sys
import json

class SFXGenerator:
    def __init__(self):
        print("Loading AudioGen for SFX...", file=sys.stderr)
        
        # AudioGen is trained specifically for sound effects
        self.model = AudioGen.get_pretrained('facebook/audiogen-medium')
        self.model.set_generation_params(duration=5)
        
        print("AudioGen loaded!", file=sys.stderr)
    
    def generate(self, description, duration=5):
        """
        Generate sound effect from description
        Examples:
        - "door slamming shut"
        - "footsteps on wooden floor"
        - "car engine starting"
        - "glass breaking"
        - "rain falling on roof"
        """
        
        self.model.set_generation_params(duration=duration)
        
        wav = self.model.generate([description])
        
        return wav[0].cpu()

def main():
    config = json.loads(sys.stdin.read())
    
    generator = SFXGenerator()
    
    audio = generator.generate(
        description=config['description'],
        duration=config.get('duration', 5)
    )
    
    output_path = config['output_path'].replace('.wav', '')
    audio_write(
        output_path,
        audio,
        generator.model.sample_rate,
        strategy="loudness"
    )
    
    print(json.dumps({
        "success": True,
        "output_path": output_path + '.wav'
    }))

if __name__ == "__main__":
    main()
