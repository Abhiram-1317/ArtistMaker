// ─────────────────────────────────────────────────────────────────────────────
// Video Composition Service — FFmpeg-based final movie assembly
// Concatenates shot videos, mixes audio tracks, adds transitions, encodes.
// ─────────────────────────────────────────────────────────────────────────────

import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import type { AudioTrackOutput } from "./aiOrchestrator.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShotInput {
  shotId: string;
  videoPath: string;
  thumbnailPath: string;
}

export interface CompositionConfig {
  fadeInDuration?: number;
  fadeOutDuration?: number;
  codec?: "libx264" | "libx265";
  crf?: number;
  audioBitrate?: string;
  preset?: "ultrafast" | "fast" | "medium" | "slow";
}

// ── Service ──────────────────────────────────────────────────────────────────

export class VideoCompositionService {
  private defaultConfig: Required<CompositionConfig> = {
    fadeInDuration: 1,
    fadeOutDuration: 1,
    codec: "libx264",
    crf: 23,
    audioBitrate: "192k",
    preset: "medium",
  };

  async composeMovie(
    shots: ShotInput[],
    audioTracks: AudioTrackOutput[],
    outputDir: string,
    config?: CompositionConfig,
  ): Promise<string> {
    const cfg = { ...this.defaultConfig, ...config };

    console.log(`🎞️ Starting composition (${shots.length} shots, ${audioTracks.length} audio tracks)`);

    const tempDir = path.join(outputDir, "_temp");
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // 1. Concatenate shot videos
      console.log("🎬 Concatenating videos…");
      const concatenatedVideo = await this.concatenateVideos(
        shots.map((s) => s.videoPath),
        tempDir,
      );

      // 2. Get video duration for fade-out calculation
      const videoDuration = await this.getMediaDuration(concatenatedVideo);

      // 3. Mix audio tracks
      console.log("🎵 Mixing audio…");
      const mixedAudio = await this.mixAudioTracks(audioTracks, tempDir, videoDuration);

      // 4. Combine video + audio
      console.log("🔊 Merging video and audio…");
      const merged = await this.mergeVideoAudio(concatenatedVideo, mixedAudio, tempDir);

      // 5. Add fade in/out transitions
      console.log("✨ Adding transitions…");
      const withTransitions = await this.addFadeTransitions(
        merged,
        tempDir,
        videoDuration,
        cfg.fadeInDuration,
        cfg.fadeOutDuration,
      );

      // 6. Final encode
      console.log("📦 Encoding final movie…");
      const finalPath = path.join(outputDir, "final_movie.mp4");
      await this.encodeFinal(withTransitions, finalPath, cfg);

      // 7. Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });

      console.log("✅ Composition complete:", finalPath);
      return finalPath;
    } catch (error) {
      console.error("❌ Composition failed:", error);
      throw error;
    }
  }

  // ── Internal methods ───────────────────────────────────────────────────

  private async concatenateVideos(videoPaths: string[], tempDir: string): Promise<string> {
    const outputFile = path.join(tempDir, "concatenated.mp4");

    // Convert any image files to short static video clips
    const processedPaths: string[] = [];
    for (let i = 0; i < videoPaths.length; i++) {
      const p = videoPaths[i];
      const ext = path.extname(p).toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext)) {
        console.log(`  Converting image to static video clip: ${path.basename(p)}`);
        const clipPath = path.join(tempDir, `static_clip_${i}.mp4`);
        await this.imageToStaticVideo(p, clipPath, 4); // 4s per shot
        processedPaths.push(clipPath);
      } else {
        processedPaths.push(p);
      }
    }

    const listFile = path.join(tempDir, "concat_list.txt");
    const listContent = processedPaths
      .map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
      .join("\n");

    await fs.writeFile(listFile, listContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions(["-c", "copy"])
        .output(outputFile)
        .on("end", () => resolve(outputFile))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private imageToStaticVideo(imagePath: string, outputPath: string, durationSeconds: number): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(["-loop", "1"])
        .outputOptions([
          "-c:v", "libx264",
          "-t", String(durationSeconds),
          "-pix_fmt", "yuv420p",
          "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
          "-r", "24",
        ])
        .output(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private mixAudioTracks(
    tracks: AudioTrackOutput[],
    tempDir: string,
    videoDuration: number,
  ): Promise<string> {
    const outputFile = path.join(tempDir, "mixed_audio.wav");

    if (tracks.length === 0) {
      return this.createSilentAudio(videoDuration, outputFile);
    }

    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add each audio file as an input
      for (const track of tracks) {
        command = command.input(track.path);
      }

      // Build filter: delay + volume for each track, then amix
      const filterParts: string[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const delayMs = Math.round(tracks[i].startTime * 1000);
        const vol = tracks[i].volume;
        filterParts.push(
          `[${i}:a]adelay=${delayMs}|${delayMs},volume=${vol}[a${i}]`,
        );
      }

      const mixInputs = tracks.map((_, i) => `[a${i}]`).join("");
      filterParts.push(
        `${mixInputs}amix=inputs=${tracks.length}:duration=longest:dropout_transition=2[aout]`,
      );

      command
        .complexFilter(filterParts)
        .outputOptions(["-map", "[aout]"])
        .output(outputFile)
        .on("end", () => resolve(outputFile))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private mergeVideoAudio(
    videoPath: string,
    audioPath: string,
    tempDir: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(tempDir, "merged.mp4");

      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          "-c:v", "copy",
          "-c:a", "aac",
          "-b:a", "192k",
          "-shortest",
        ])
        .output(outputFile)
        .on("end", () => resolve(outputFile))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private addFadeTransitions(
    inputPath: string,
    tempDir: string,
    totalDuration: number,
    fadeIn: number,
    fadeOut: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(tempDir, "with_transitions.mp4");
      const fadeOutStart = Math.max(0, totalDuration - fadeOut);

      ffmpeg(inputPath)
        .outputOptions([
          "-vf",
          `fade=t=in:st=0:d=${fadeIn},fade=t=out:st=${fadeOutStart}:d=${fadeOut}`,
          "-c:a", "copy",
        ])
        .output(outputFile)
        .on("end", () => resolve(outputFile))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private encodeFinal(
    inputPath: string,
    outputPath: string,
    config: Required<CompositionConfig>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v", config.codec,
          "-preset", config.preset,
          "-crf", String(config.crf),
          "-c:a", "aac",
          "-b:a", config.audioBitrate,
          "-movflags", "+faststart",
          "-pix_fmt", "yuv420p",
        ])
        .output(outputPath)
        .on("progress", (progress: { percent?: number }) => {
          if (progress.percent) {
            console.log(`  Encoding: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on("end", () => resolve(outputPath))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private createSilentAudio(durationSeconds: number, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input("anullsrc=r=44100:cl=stereo")
        .inputOptions(["-f", "lavfi", "-t", String(durationSeconds)])
        .output(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }

  private getMediaDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data.format.duration ?? 30);
      });
    });
  }
}
