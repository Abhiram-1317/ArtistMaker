// ─────────────────────────────────────────────────────────────────────────────
// AI Orchestrator — unified pipeline that coordinates all AI services
// to generate a complete movie from project data
// ─────────────────────────────────────────────────────────────────────────────

import { ImageGenerationService } from "./imageGeneration.js";
import { VideoGenerationService } from "./videoGeneration.js";
import { VoiceGenerationService } from "./voiceGeneration.js";
import { MusicGenerationService } from "./musicGeneration.js";
import { SFXGenerationService } from "./sfxGeneration.js";
import { CharacterVoiceService } from "./characterVoice.js";
import { VideoEnhancementService } from "./videoEnhancement.js";
import path from "path";
import fs from "fs/promises";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  voiceDescription: string;
  style?: string;
}

export interface GeneratedCharacter {
  id: string;
  name: string;
  referenceImages: string[];
  voiceProfilePath: string;
  description: string;
}

export interface ShotConfig {
  shotNumber: number;
  sceneNumber: number;
  shotType: string;
  cameraAngle: string;
  locationDescription: string;
  description?: string;
  negativePrompt?: string;
  timeOfDay?: string;
  weather?: string;
  style?: string;
  resolution?: string;
  durationSeconds: number;
  charactersInShot?: string[];
}

export interface GeneratedShot {
  videoPath: string;
  thumbnailPath: string;
  durationSeconds: number;
}

export interface AudioTrackOutput {
  type: "dialogue" | "music" | "sfx";
  path: string;
  startTime: number;
  duration: number;
  volume: number;
  characterId?: string;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export class AIOrchestrator {
  private imageService: ImageGenerationService;
  private videoService: VideoGenerationService;
  private voiceService: VoiceGenerationService;
  private musicService: MusicGenerationService;
  private sfxService: SFXGenerationService;
  private characterVoiceService: CharacterVoiceService;
  private enhancementService: VideoEnhancementService;

  constructor() {
    this.imageService = new ImageGenerationService();
    this.videoService = new VideoGenerationService();
    this.voiceService = new VoiceGenerationService();
    this.musicService = new MusicGenerationService();
    this.sfxService = new SFXGenerationService();
    this.characterVoiceService = new CharacterVoiceService();
    this.enhancementService = new VideoEnhancementService();
  }

  // ── Character generation ─────────────────────────────────────────────────

  async generateCharacter(config: CharacterConfig): Promise<GeneratedCharacter> {
    console.log(`[orchestrator] Generating character: ${config.name}`);

    // Generate character reference images (4 views)
    const views = ["front view", "side view", "3/4 view", "expression sheet"];
    const referenceImages: string[] = [];

    for (const view of views) {
      const prompt = [
        config.description,
        view,
        "character reference sheet",
        `${config.style || "realistic"} style`,
        "consistent design, white background, detailed, high quality, professional character design",
      ].join(", ");

      const image = await this.imageService.generate({
        prompt,
        negativePrompt: "blurry, low quality, multiple characters, background",
        width: 1024,
        height: 1024,
        numSteps: 30,
      });

      referenceImages.push(image);
    }

    // Create voice profile
    const voiceProfilePath =
      await this.characterVoiceService.createCharacterVoice(
        config.id,
        config.voiceDescription,
      );

    return {
      id: config.id,
      name: config.name,
      referenceImages,
      voiceProfilePath,
      description: config.description,
    };
  }

  // ── Shot generation ──────────────────────────────────────────────────────

  async generateShot(
    shotConfig: ShotConfig,
    characters: GeneratedCharacter[],
  ): Promise<GeneratedShot> {
    console.log(
      `[orchestrator] Generating shot ${shotConfig.shotNumber} of scene ${shotConfig.sceneNumber}`,
    );

    // Step 1: Generate initial keyframe image
    const keyframePrompt = this.buildShotPrompt(shotConfig, characters);

    const keyframe = await this.imageService.generate({
      prompt: keyframePrompt,
      negativePrompt:
        shotConfig.negativePrompt || "blurry, low quality, distorted",
      width: 1024,
      height: 576,
      numSteps: 30,
      guidanceScale: 7.5,
    });

    // Step 2: Convert image to video
    const video = await this.videoService.generate({
      prompt: keyframePrompt,
      initImage: keyframe,
      numFrames: Math.ceil(shotConfig.durationSeconds * 8), // 8fps base
    });

    // Step 3: Interpolate to 24fps using RIFE / optical-flow
    const interpolated = await this.enhancementService.interpolateFrames(
      video,
      24,
    );

    // Step 4: Upscale if needed using Real-ESRGAN
    let final = interpolated;
    if (shotConfig.resolution === "1080p") {
      final = await this.enhancementService.upscale(interpolated, 1920, 1080);
    } else if (shotConfig.resolution === "4k") {
      final = await this.enhancementService.upscale(interpolated, 3840, 2160);
    }

    return {
      videoPath: final,
      thumbnailPath: keyframe,
      durationSeconds: shotConfig.durationSeconds,
    };
  }

  // ── Scene audio generation ───────────────────────────────────────────────

  async generateSceneAudio(
    scene: any,
    characters: GeneratedCharacter[],
  ): Promise<AudioTrackOutput[]> {
    console.log(
      `[orchestrator] Generating audio for scene ${scene.sceneNumber}`,
    );

    const audioTracks: AudioTrackOutput[] = [];

    // 1. Generate dialogue
    if (scene.dialogue && Array.isArray(scene.dialogue) && scene.dialogue.length > 0) {
      let currentTime = 0;

      for (const line of scene.dialogue) {
        const character = characters.find((c) => c.id === line.characterId);
        if (!character) continue;

        const audio = await this.characterVoiceService.speakLine(
          character.id,
          line.text,
          line.emotion,
        );

        const duration = await this.estimateAudioDuration(audio);

        audioTracks.push({
          type: "dialogue",
          path: audio,
          startTime: currentTime,
          duration,
          volume: 1.0,
          characterId: character.id,
        });

        currentTime += duration + 0.5; // Pause between lines
      }
    }

    // 2. Generate background music
    const music = await this.musicService.generateSceneMusic(scene);
    audioTracks.push({
      type: "music",
      path: music,
      startTime: 0,
      duration: scene.durationSeconds || 30,
      volume: 0.3,
    });

    // 3. Generate sound effects
    const sfxPaths = await this.sfxService.generateSceneSFX(scene);
    for (let i = 0; i < sfxPaths.length; i++) {
      audioTracks.push({
        type: "sfx",
        path: sfxPaths[i],
        startTime: i * 2, // Stagger SFX by 2 seconds
        duration: 3,
        volume: 0.6,
      });
    }

    return audioTracks;
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  private buildShotPrompt(
    shotConfig: ShotConfig,
    characters: GeneratedCharacter[],
  ): string {
    const parts: string[] = [];

    // Shot type and camera angle
    parts.push(`${shotConfig.shotType} shot, ${shotConfig.cameraAngle} angle`);

    // Location / environment
    if (shotConfig.locationDescription) {
      parts.push(shotConfig.locationDescription);
    }

    // Characters in shot
    if (shotConfig.charactersInShot && shotConfig.charactersInShot.length > 0) {
      const charDescriptions = shotConfig.charactersInShot
        .map((charId) => {
          const char = characters.find((c) => c.id === charId);
          return char ? char.description : "";
        })
        .filter(Boolean);

      if (charDescriptions.length > 0) {
        parts.push(charDescriptions.join(", "));
      }
    }

    // Action / description
    if (shotConfig.description) {
      parts.push(shotConfig.description);
    }

    // Time of day lighting
    if (shotConfig.timeOfDay) {
      parts.push(`${shotConfig.timeOfDay} lighting`);
    }

    // Weather
    if (shotConfig.weather) {
      parts.push(shotConfig.weather);
    }

    // Style
    parts.push(
      `${shotConfig.style || "cinematic"} style, cinematic, highly detailed, 8k quality`,
    );

    return parts.join(", ");
  }

  private async estimateAudioDuration(audioPath: string): Promise<number> {
    // Estimate duration from file size (rough: ~16 KB/s for 16 kHz mono WAV)
    try {
      const stats = await fs.stat(audioPath);
      return Math.max(1, stats.size / 32000);
    } catch {
      return 3; // Default 3 seconds if file doesn't exist yet
    }
  }
}
