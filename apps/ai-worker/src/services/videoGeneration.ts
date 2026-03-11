import { PythonShell } from 'python-shell'
import path from 'path'
import fs from 'fs/promises'

export interface VideoGenerationConfig {
  prompt: string
  negativePrompt?: string
  initImage?: string  // For I2V
  numFrames?: number
  numSteps?: number
  guidanceScale?: number
  seed?: number
}

export class VideoGenerationService {
  private pythonScriptPath: string
  
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../python/video_generator.py')
  }
  
  async generate(config: VideoGenerationConfig): Promise<string> {
    const outputDir = path.join(__dirname, '../../output/videos')
    await fs.mkdir(outputDir, { recursive: true })
    
    const outputPath = path.join(
      outputDir, 
      `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`
    )
    
    const pythonConfig = {
      prompt: config.prompt,
      negative_prompt: config.negativePrompt || '',
      init_image: config.initImage,
      num_frames: config.numFrames || 16,
      num_steps: config.numSteps || 25,
      guidance_scale: config.guidanceScale || 7.5,
      seed: config.seed || -1,
      output_path: outputPath
    }
    
    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(this.pythonScriptPath, {
        mode: 'json',
        pythonPath: process.env.PYTHON_PATH || 'python3',
        pythonOptions: ['-u'],
        env: { ...process.env },
      })
      
      pyshell.send(JSON.stringify(pythonConfig))
      pyshell.end((err) => {
        if (err && !err.message.includes('close')) {
          // Only reject on real send errors
        }
      })
      
      pyshell.on('message', (message: any) => {
        if (message.success) {
          resolve(message.output_path)
        } else {
          reject(new Error(message.error || 'Video generation failed'))
        }
      })
      
      pyshell.on('error', reject)
      pyshell.on('pythonError', (err) => {
        reject(new Error(`Python error: ${err.message}`))
      })
    })
  }
  
  async generateShot(shotConfig: any): Promise<string> {
    // Step 1: Generate initial image with SDXL
    const { ImageGenerationService } = await import('./imageGeneration.js')
    const imageService = new ImageGenerationService()
    
    const initImage = await imageService.generate({
      prompt: shotConfig.visualPrompt,
      width: 512,
      height: 512,
    })
    
    // Step 2: Animate the image
    const video = await this.generate({
      prompt: shotConfig.visualPrompt,
      initImage: initImage,
      numFrames: Math.ceil(shotConfig.durationSeconds * 8), // 8fps
    })
    
    return video
  }
}
