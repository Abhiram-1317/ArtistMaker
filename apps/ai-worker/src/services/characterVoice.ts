import { VoiceGenerationService } from "./voiceGeneration.js";
import path from "path";
import fs from "fs/promises";

export class CharacterVoiceService {
  private voiceService: VoiceGenerationService;
  private voiceProfilesDir: string;

  constructor() {
    this.voiceService = new VoiceGenerationService();
    this.voiceProfilesDir = path.join(__dirname, "../../voice-profiles");
  }

  async createCharacterVoice(
    characterId: string,
    voiceDescription: string,
    referenceAudio?: string
  ): Promise<string> {
    await fs.mkdir(this.voiceProfilesDir, { recursive: true });

    const profilePath = path.join(
      this.voiceProfilesDir,
      `${characterId}.wav`
    );

    // If reference audio provided, use it for cloning
    if (referenceAudio) {
      await fs.copyFile(referenceAudio, profilePath);
      return profilePath;
    }

    // Otherwise, generate a sample and save as profile
    const sampleText =
      "Hello, this is a voice sample for character creation.";
    const sampleAudio = await this.voiceService.generate({
      text: sampleText,
    });

    await fs.copyFile(sampleAudio, profilePath);

    return profilePath;
  }

  async speakLine(
    characterId: string,
    text: string,
    emotion?: string
  ): Promise<string> {
    const voiceProfile = path.join(
      this.voiceProfilesDir,
      `${characterId}.wav`
    );

    // Add emotion to text (prosody control)
    let modifiedText = text;
    if (emotion) {
      modifiedText = this.addEmotionToText(text, emotion);
    }

    return await this.voiceService.generate({
      text: modifiedText,
      speakerReference: voiceProfile,
    });
  }

  private addEmotionToText(text: string, emotion: string): string {
    // Coqui TTS interprets emphasis and pacing from punctuation/formatting
    const emotionMap: Record<string, { speed: number; emphasis: string }> = {
      happy: { speed: 1.1, emphasis: "+" },
      sad: { speed: 0.9, emphasis: "-" },
      angry: { speed: 1.2, emphasis: "++" },
      calm: { speed: 0.95, emphasis: "" },
    };

    const _config = emotionMap[emotion] || {};
    return text; // Simplified - real implementation would modify prosody
  }
}
