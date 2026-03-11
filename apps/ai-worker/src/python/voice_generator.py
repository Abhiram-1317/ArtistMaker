from TTS.api import TTS  # type: ignore[import-unresolved]
import sys
import json
import torch

class VoiceGenerator:
    def __init__(self):
        print("Loading TTS model...", file=sys.stderr)
        
        # Use XTTS v2 - supports voice cloning and multi-lingual
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        
        print("TTS model loaded!", file=sys.stderr)
    
    def generate(self, text, speaker_wav=None, language="en", output_path="output.wav"):
        """
        Generate speech from text
        speaker_wav: Reference audio for voice cloning
        """
        
        if speaker_wav:
            # Voice cloning mode
            self.tts.tts_to_file(
                text=text,
                speaker_wav=speaker_wav,
                language=language,
                file_path=output_path
            )
        else:
            # Use built-in speaker
            self.tts.tts_to_file(
                text=text,
                language=language,
                file_path=output_path
            )
        
        return output_path
    
    def list_speakers(self):
        """List available built-in speakers"""
        return self.tts.speakers

def main():
    config = json.loads(sys.stdin.read())
    
    generator = VoiceGenerator()
    
    output_path = generator.generate(
        text=config['text'],
        speaker_wav=config.get('speaker_wav'),
        language=config.get('language', 'en'),
        output_path=config['output_path']
    )
    
    print(json.dumps({
        "success": True,
        "output_path": output_path
    }))

if __name__ == "__main__":
    main()
