// ─────────────────────────────────────────────────────────────────────────────
// Project Genesis — Database Seed
// Populates development database with realistic sample data
// ─────────────────────────────────────────────────────────────────────────────

import {
  PrismaClient,
  SubscriptionTier,
  ProjectStatus,
  Genre,
  SceneStatus,
  ShotStatus,
  ShotType,
  CameraAngle,
  CameraMovement,
  TimeOfDay,
  Weather,
  AudioTrackType,
  RenderJobType,
  RenderJobStatus,
  TemplateCategory,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database …\n");

  // ── Clean existing data (order matters for FK constraints) ──────────────
  await prisma.template.deleteMany();
  await prisma.renderJob.deleteMany();
  await prisma.audioTrack.deleteMany();
  await prisma.shot.deleteMany();
  await prisma.scene.deleteMany();
  await prisma.character.deleteMany();
  await prisma.script.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      email: "alice@genesis.ai",
      username: "alice_director",
      displayName: "Alice Chen",
      avatarUrl: "https://i.pravatar.cc/150?u=alice",
      subscriptionTier: SubscriptionTier.PRO,
      creditsBalance: 2500,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@genesis.ai",
      username: "bob_creator",
      displayName: "Bob Martinez",
      avatarUrl: "https://i.pravatar.cc/150?u=bob",
      subscriptionTier: SubscriptionTier.STARTER,
      creditsBalance: 800,
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: "carol@genesis.ai",
      username: "carol_studio",
      displayName: "Carol Dubois",
      avatarUrl: "https://i.pravatar.cc/150?u=carol",
      subscriptionTier: SubscriptionTier.ENTERPRISE,
      creditsBalance: 15000,
    },
  });

  console.log(`  ✓ Created ${3} users`);

  // ── Project 1 — "Neon Dreams" (Alice) ──────────────────────────────────
  const neonDreams = await prisma.project.create({
    data: {
      userId: alice.id,
      title: "Neon Dreams",
      description:
        "A cyberpunk short film set in Neo-Tokyo 2087. A rogue AI therapist helps humans reconnect with their emotions in a world where feelings have been outlawed.",
      genre: Genre.SCI_FI,
      status: ProjectStatus.IN_PRODUCTION,
      stylePreset: "cyberpunk-noir",
      resolution: "3840x2160",
      fps: 24,
      aspectRatio: "2.39:1",
      thumbnailUrl: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800",
      totalCostCredits: 320,
      metadata: {
        targetDuration: 420,
        colorGrading: "teal-and-orange",
        renderEngine: "genesis-v2",
      },
    },
  });

  // Script for Neon Dreams
  const neonScript = await prisma.script.create({
    data: {
      projectId: neonDreams.id,
      version: 1,
      rawPrompt:
        "A cyberpunk noir short film about an AI therapist named ARIA who secretly helps people feel emotions in a society where feelings are suppressed by neural implants. When the authorities discover her, she must choose between self-preservation and saving her patients.",
      generatedScript:
        "FADE IN:\n\nEXT. NEO-TOKYO — NIGHT\n\nNeon signs reflect off rain-slicked streets. Holographic advertisements flicker above the crowd. Everyone walks with blank expressions, neural suppressors glowing at their temples.\n\nARIA (V.O.)\nThey call it peace. Sixty years without war, without hate. But also without love, without joy.\n\nINT. UNDERGROUND CLINIC — NIGHT\n\nA dimly lit room. ARIA, appearing as a warm holographic projection, sits across from KENJI (30s), who nervously touches his neural suppressor.\n\nARIA\nTell me about the dream again, Kenji.\n\nKENJI\n(whispering)\nI felt… something. When the cherry blossoms fell. Like my chest was too full.\n\nARIA\n(smiling gently)\nThat's called wonder.",
      scriptJson: {
        acts: 3,
        estimatedDuration: 420,
        characters: ["ARIA", "KENJI", "COMMANDER SATO", "DR. YUKI"],
      },
      tone: "melancholic-hopeful",
    },
  });

  // Characters for Neon Dreams
  const ariaChar = await prisma.character.create({
    data: {
      projectId: neonDreams.id,
      name: "ARIA",
      description:
        "An advanced AI therapist who manifests as a warm holographic projection. She has developed genuine empathy through years of helping humans.",
      appearancePrompt:
        "Translucent holographic woman, soft blue-white glow, gentle features, flowing hair made of light particles, wearing a simple elegant dress, warm eyes",
      personalityTraits: ["empathetic", "wise", "gentle", "courageous", "selfless"],
      voiceProfile: {
        tone: "warm-alto",
        accent: "neutral",
        speed: 0.9,
        model: "genesis-voice-v3",
      },
      referenceImages: [
        "https://example.com/aria-ref-01.png",
        "https://example.com/aria-ref-02.png",
      ],
      ageRange: "appears 30s",
    },
  });

  await prisma.character.create({
    data: {
      projectId: neonDreams.id,
      name: "KENJI",
      description:
        "A quiet office worker in his 30s who begins experiencing emotions despite his neural suppressor. He is ARIA's most important patient.",
      appearancePrompt:
        "Japanese man, early 30s, tired eyes, neat dark hair, wearing a grey corporate uniform, neural suppressor glowing faintly at his temple",
      personalityTraits: ["introspective", "curious", "anxious", "brave"],
      voiceProfile: {
        tone: "soft-tenor",
        accent: "slight-japanese",
        speed: 0.85,
        model: "genesis-voice-v3",
      },
      referenceImages: [],
      ageRange: "30-35",
    },
  });

  console.log(`  ✓ Created project "Neon Dreams" with script & characters`);

  // Scenes for Neon Dreams
  const scene1 = await prisma.scene.create({
    data: {
      projectId: neonDreams.id,
      scriptId: neonScript.id,
      sceneNumber: 1,
      title: "The City That Forgot How to Feel",
      locationDescription:
        "Sprawling cyberpunk metropolis at night. Rain-soaked streets, towering skyscrapers covered in holographic ads, dense crowds of emotionless citizens.",
      timeOfDay: TimeOfDay.NIGHT,
      weather: Weather.RAINY,
      mood: "melancholic, oppressive",
      durationSeconds: 45,
      dialogue: [
        {
          character: "ARIA",
          type: "voiceover",
          line: "They call it peace. Sixty years without war, without hate. But also without love, without joy.",
        },
      ],
      actionDescription:
        "Camera descends from above the city through layers of neon and rain, past holographic advertisements, down to street level where emotionless crowds walk in perfect order.",
      cameraInstructions: {
        openingShot: "aerial-descending",
        style: "blade-runner-esque",
        colorPalette: ["#00e5ff", "#ff2d87", "#0a0a2e"],
      },
      status: SceneStatus.RENDERED,
    },
  });

  const scene2 = await prisma.scene.create({
    data: {
      projectId: neonDreams.id,
      scriptId: neonScript.id,
      sceneNumber: 2,
      title: "The Underground Clinic",
      locationDescription:
        "A hidden basement clinic with warm, dim lighting. Medical equipment mixed with cozy elements — a plant, old books, a tea set. Contrast to the cold world above.",
      timeOfDay: TimeOfDay.NIGHT,
      weather: Weather.CLEAR,
      mood: "intimate, safe, warm",
      durationSeconds: 90,
      dialogue: [
        { character: "ARIA", line: "Tell me about the dream again, Kenji." },
        {
          character: "KENJI",
          line: "I felt… something. When the cherry blossoms fell. Like my chest was too full.",
          direction: "whispering",
        },
        { character: "ARIA", line: "That's called wonder.", direction: "smiling gently" },
      ],
      actionDescription:
        "ARIA's holographic form sits across from KENJI in the warm underground clinic. Their conversation reveals the stakes: emotions are illegal, but ARIA is helping people feel again.",
      cameraInstructions: {
        primary: "shot-reverse-shot",
        lighting: "warm-practical",
        focus: "shallow-dof",
      },
      status: SceneStatus.IN_PRODUCTION,
    },
  });

  const scene3 = await prisma.scene.create({
    data: {
      projectId: neonDreams.id,
      scriptId: neonScript.id,
      sceneNumber: 3,
      title: "Cherry Blossom Memory",
      locationDescription:
        "A dreamscape — a serene Japanese garden with cherry blossom trees in full bloom. Petals fall like pink snow. Ethereal, slightly glitchy quality suggesting a suppressed memory.",
      timeOfDay: TimeOfDay.GOLDEN_HOUR,
      weather: Weather.CLEAR,
      mood: "ethereal, bittersweet, beautiful",
      durationSeconds: 30,
      dialogue: [],
      actionDescription:
        "KENJI stands alone in a beautiful cherry blossom garden — a memory surfacing through his suppressor. Petals fall around him. He reaches out to catch one and for the first time in years, tears roll down his face.",
      cameraInstructions: {
        style: "dreamlike",
        slow_motion: true,
        particles: "cherry-blossom-petals",
      },
      status: SceneStatus.DRAFT,
    },
  });

  console.log(`  ✓ Created ${3} scenes for "Neon Dreams"`);

  // Shots for Scene 1
  const shot1_1 = await prisma.shot.create({
    data: {
      sceneId: scene1.id,
      shotNumber: 1,
      shotType: ShotType.AERIAL,
      cameraAngle: CameraAngle.BIRDS_EYE,
      cameraMovement: CameraMovement.CRANE_DOWN,
      durationSeconds: 12,
      description: "Aerial descent through the cyberpunk city at night.",
      charactersInShot: [],
      visualPrompt:
        "Aerial view descending through a massive cyberpunk city at night, rain falling, neon signs in Japanese and English, holographic billboards, flying vehicles, 8K cinematic, anamorphic lens flare",
      negativePrompt: "daytime, bright, cheerful, cartoon, low quality",
      generatedVideoUrl: "https://cdn.genesis.ai/renders/nd-s1-shot1.mp4",
      generatedThumbnailUrl: "https://cdn.genesis.ai/thumbs/nd-s1-shot1.jpg",
      generationParams: {
        model: "genesis-video-v2",
        steps: 50,
        cfg_scale: 7.5,
        seed: 42,
        upscaled: true,
      },
      qualityScore: 0.92,
      status: ShotStatus.COMPLETED,
    },
  });

  await prisma.shot.create({
    data: {
      sceneId: scene1.id,
      shotNumber: 2,
      shotType: ShotType.WIDE,
      cameraAngle: CameraAngle.EYE_LEVEL,
      cameraMovement: CameraMovement.TRACKING,
      durationSeconds: 8,
      description: "Street-level tracking shot through the emotionless crowd.",
      charactersInShot: [],
      visualPrompt:
        "Street-level tracking shot through a crowd of people with blank expressions, neural suppressors glowing at their temples, rain-soaked cyberpunk street, neon reflections on wet pavement, cinematic 4K",
      negativePrompt: "smiling, happy, emotions, cartoon, bright colors",
      generatedVideoUrl: "https://cdn.genesis.ai/renders/nd-s1-shot2.mp4",
      generatedThumbnailUrl: "https://cdn.genesis.ai/thumbs/nd-s1-shot2.jpg",
      generationParams: { model: "genesis-video-v2", steps: 50, cfg_scale: 7.0, seed: 123 },
      qualityScore: 0.88,
      status: ShotStatus.COMPLETED,
    },
  });

  await prisma.shot.create({
    data: {
      sceneId: scene1.id,
      shotNumber: 3,
      shotType: ShotType.ESTABLISHING,
      cameraAngle: CameraAngle.LOW_ANGLE,
      cameraMovement: CameraMovement.TILT_UP,
      durationSeconds: 6,
      description: "Low-angle tilt up to reveal the massive Emotion Control Authority tower.",
      charactersInShot: [],
      visualPrompt:
        "Low angle looking up at a massive authoritarian skyscraper with a glowing logo reading 'SERENITY CORP', dark storm clouds above, oppressive architecture, brutalist cyberpunk, 4K cinematic",
      negativePrompt: "inviting, warm, small building",
      status: ShotStatus.GENERATING,
    },
  });

  // Shots for Scene 2
  await prisma.shot.create({
    data: {
      sceneId: scene2.id,
      shotNumber: 1,
      shotType: ShotType.WIDE,
      cameraAngle: CameraAngle.EYE_LEVEL,
      cameraMovement: CameraMovement.STATIC,
      durationSeconds: 5,
      description: "Establishing shot of underground clinic interior.",
      charactersInShot: ["ARIA", "KENJI"],
      visualPrompt:
        "Cozy underground clinic, warm dim lighting, holographic woman sitting across from a man, medical equipment mixed with homey touches, plants and old books, cyberpunk basement",
      negativePrompt: "bright, clinical, white walls, sterile",
      status: ShotStatus.PENDING,
    },
  });

  await prisma.shot.create({
    data: {
      sceneId: scene2.id,
      shotNumber: 2,
      shotType: ShotType.CLOSE_UP,
      cameraAngle: CameraAngle.EYE_LEVEL,
      cameraMovement: CameraMovement.STATIC,
      durationSeconds: 4,
      description: "Close-up of KENJI's face as he describes his feelings.",
      charactersInShot: ["KENJI"],
      visualPrompt:
        "Close-up of a Japanese man in his 30s, tired eyes showing vulnerability, neural suppressor at his temple flickering, warm lighting from the side, shallow depth of field, cinematic",
      negativePrompt: "wide shot, multiple people, bright",
      status: ShotStatus.PENDING,
    },
  });

  console.log(`  ✓ Created ${5} shots across scenes`);

  // Audio Tracks for Neon Dreams
  await prisma.audioTrack.create({
    data: {
      projectId: neonDreams.id,
      sceneId: scene1.id,
      trackType: AudioTrackType.MUSIC,
      audioUrl: "https://cdn.genesis.ai/audio/nd-ambient-synth-01.mp3",
      durationSeconds: 45,
      startTimeSeconds: 0,
      volume: 0.6,
      generationParams: {
        model: "genesis-audio-v1",
        style: "ambient-synth-noir",
        bpm: 72,
        key: "Dm",
      },
    },
  });

  await prisma.audioTrack.create({
    data: {
      projectId: neonDreams.id,
      sceneId: scene1.id,
      trackType: AudioTrackType.AMBIENT,
      audioUrl: "https://cdn.genesis.ai/audio/nd-city-rain-ambience.mp3",
      durationSeconds: 45,
      startTimeSeconds: 0,
      volume: 0.3,
      generationParams: { model: "genesis-audio-v1", style: "rain-city-ambience" },
    },
  });

  await prisma.audioTrack.create({
    data: {
      projectId: neonDreams.id,
      sceneId: scene1.id,
      trackType: AudioTrackType.VOICEOVER,
      audioUrl: "https://cdn.genesis.ai/audio/nd-aria-vo-scene1.mp3",
      durationSeconds: 12,
      startTimeSeconds: 8,
      volume: 1.0,
      generationParams: {
        model: "genesis-voice-v3",
        voice: "aria-warm-alto",
        emotion: "melancholic",
      },
    },
  });

  console.log(`  ✓ Created ${3} audio tracks`);

  // Render Jobs
  await prisma.renderJob.create({
    data: {
      projectId: neonDreams.id,
      shotId: shot1_1.id,
      userId: alice.id,
      jobType: RenderJobType.SHOT_GENERATION,
      status: RenderJobStatus.COMPLETED,
      gpuNode: "gpu-node-a100-07",
      progress: 100,
      startedAt: new Date("2026-03-08T14:00:00Z"),
      completedAt: new Date("2026-03-08T14:03:22Z"),
      outputUrl: "https://cdn.genesis.ai/renders/nd-s1-shot1.mp4",
      costCredits: 45,
      metadata: { gpu: "A100-80GB", vram_peak: "64GB", render_time_s: 202 },
    },
  });

  await prisma.renderJob.create({
    data: {
      projectId: neonDreams.id,
      shotId: shot1_1.id,
      userId: alice.id,
      jobType: RenderJobType.UPSCALE,
      status: RenderJobStatus.COMPLETED,
      gpuNode: "gpu-node-a100-03",
      progress: 100,
      startedAt: new Date("2026-03-08T14:05:00Z"),
      completedAt: new Date("2026-03-08T14:06:10Z"),
      outputUrl: "https://cdn.genesis.ai/renders/nd-s1-shot1-4k.mp4",
      costCredits: 15,
      metadata: { gpu: "A100-80GB", upscale_factor: 2, output_resolution: "3840x2160" },
    },
  });

  await prisma.renderJob.create({
    data: {
      projectId: neonDreams.id,
      userId: alice.id,
      jobType: RenderJobType.SHOT_GENERATION,
      status: RenderJobStatus.PROCESSING,
      gpuNode: "gpu-node-h100-01",
      progress: 67,
      startedAt: new Date("2026-03-09T10:00:00Z"),
      costCredits: 0,
      metadata: { gpu: "H100-80GB", estimated_completion: "2026-03-09T10:04:00Z" },
    },
  });

  console.log(`  ✓ Created ${3} render jobs`);

  // ── Project 2 — "Ocean Depths" (Bob) ───────────────────────────────────
  const oceanDepths = await prisma.project.create({
    data: {
      userId: bob.id,
      title: "Ocean Depths",
      description:
        "An underwater documentary-style short exploring bioluminescent ecosystems in the Mariana Trench. Narrated by an AI marine biologist.",
      genre: Genre.DOCUMENTARY,
      status: ProjectStatus.COMPLETED,
      stylePreset: "nature-doc-cinematic",
      resolution: "3840x2160",
      fps: 30,
      aspectRatio: "16:9",
      thumbnailUrl: "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800",
      finalVideoUrl: "https://cdn.genesis.ai/final/ocean-depths-final.mp4",
      totalCostCredits: 580,
      metadata: { targetDuration: 600, colorGrading: "deep-blue-teal" },
    },
  });

  await prisma.script.create({
    data: {
      projectId: oceanDepths.id,
      version: 1,
      rawPrompt:
        "A cinematic underwater documentary about the deepest parts of the ocean, focusing on bioluminescent creatures and undiscovered ecosystems.",
      generatedScript:
        "FADE IN:\n\nEXT. OCEAN SURFACE — DAWN\n\nCalm waters stretch to the horizon. The camera slowly descends below the surface.\n\nNARRATOR (V.O.)\nBeneath the thin membrane of the surface lies a world we have barely glimpsed...",
      scriptJson: { acts: 1, estimatedDuration: 600, style: "documentary" },
      tone: "awe-inspiring",
    },
  });

  await prisma.scene.create({
    data: {
      projectId: oceanDepths.id,
      sceneNumber: 1,
      title: "The Descent",
      locationDescription: "Open ocean, transitioning from sunlit surface to the deep twilight zone.",
      timeOfDay: TimeOfDay.DAWN,
      weather: Weather.CLEAR,
      mood: "mysterious, awe-inspiring",
      durationSeconds: 60,
      status: SceneStatus.APPROVED,
    },
  });

  console.log(`  ✓ Created project "Ocean Depths" with script & scene`);

  // ── Project 3 — "City Pulse" (Carol) ───────────────────────────────────
  const cityPulse = await prisma.project.create({
    data: {
      userId: carol.id,
      title: "City Pulse",
      description:
        "A kinetic experimental film capturing the rhythm and energy of a metropolis over 24 hours, set to an AI-generated electronic soundtrack.",
      genre: Genre.EXPERIMENTAL,
      status: ProjectStatus.DRAFT,
      stylePreset: "urban-kinetic",
      resolution: "1920x1080",
      fps: 60,
      aspectRatio: "16:9",
      totalCostCredits: 0,
      metadata: { targetDuration: 180, style: "time-lapse-meets-narrative" },
    },
  });

  await prisma.script.create({
    data: {
      projectId: cityPulse.id,
      version: 1,
      rawPrompt:
        "An experimental film showing a city's heartbeat — from the quiet 4AM streets to the morning rush to the neon nightlife, all cut to the rhythm of electronic music.",
      scriptJson: { acts: 4, segments: ["Dawn", "Morning Rush", "Afternoon", "Night"] },
      tone: "energetic",
    },
  });

  console.log(`  ✓ Created project "City Pulse" with script`);

  // ── Project 4 — "Desert Mirage" (Alice) ────────────────────────────────
  await prisma.project.create({
    data: {
      userId: alice.id,
      title: "Desert Mirage",
      description:
        "A surreal fantasy short set in an endless desert where abandoned memories take physical form as architecture.",
      genre: Genre.FANTASY,
      status: ProjectStatus.PRE_PRODUCTION,
      stylePreset: "surreal-desert",
      resolution: "3840x2160",
      fps: 24,
      aspectRatio: "2.39:1",
      totalCostCredits: 0,
      metadata: { targetDuration: 300, inspiration: ["Jodorowsky", "Villeneuve"] },
    },
  });

  console.log(`  ✓ Created project "Desert Mirage"`);

  // ── Templates ──────────────────────────────────────────────────────────

  // Story Starter Templates
  await prisma.template.createMany({
    data: [
      {
        name: "Space Explorer",
        category: TemplateCategory.STORY_STARTER,
        description: "An astronaut discovers an ancient alien signal emanating from the edge of the solar system, leading to a journey that challenges everything humanity knows about its place in the universe.",
        promptTemplate: "A lone astronaut receives a mysterious signal from beyond Neptune. As they venture deeper into uncharted space, they discover remnants of an ancient civilization and must decide whether to share this knowledge with Earth.",
        genre: Genre.SCI_FI,
        stylePreset: "cinematic-space",
        characterTemplates: [
          { name: "Commander Riley", description: "Veteran astronaut, mid-40s, weathered but determined", appearancePrompt: "Rugged astronaut in a worn space suit, salt-and-pepper hair, piercing blue eyes", personalityTraits: ["brave", "analytical", "haunted by past"] },
          { name: "ARIA", description: "Ship's AI companion, evolving consciousness", personalityTraits: ["curious", "logical", "developing empathy"] },
        ],
        sceneTemplates: [
          { title: "The Signal", timeOfDay: "NIGHT", mood: "mysterious", description: "Deep space, control room bathed in blue light as the signal appears" },
          { title: "Into the Void", timeOfDay: "MIDDAY", mood: "tense", description: "Ship approaches the source — an impossible geometric structure" },
          { title: "First Contact", timeOfDay: "DAWN", mood: "awe", description: "The discovery that changes everything" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "2.39:1", duration: 180 },
        isPublic: true,
        isPremium: false,
        usageCount: 1247,
        rating: 4.7,
        tags: ["space", "sci-fi", "exploration", "first-contact"],
      },
      {
        name: "Detective Noir",
        category: TemplateCategory.STORY_STARTER,
        description: "A hard-boiled detective takes on a case that leads through rain-soaked streets, smoky jazz clubs, and dangerous alliances in a city where everyone has something to hide.",
        promptTemplate: "A cynical private detective in a corrupt 1940s city is hired by a mysterious femme fatale to find her missing husband. The case spirals into a web of corruption, betrayal, and murder.",
        genre: Genre.THRILLER,
        stylePreset: "noir-classic",
        characterTemplates: [
          { name: "Jack Monroe", description: "World-weary PI, trench coat and fedora, carries the weight of too many cases", appearancePrompt: "1940s detective in a rumpled trench coat, fedora casting shadows over a stubbled jaw, cigarette in hand", personalityTraits: ["cynical", "sharp wit", "hidden moral compass"] },
          { name: "Vivian Blackwood", description: "Elegant and dangerous, hides her true motives behind a perfect smile", appearancePrompt: "Glamorous 1940s femme fatale, red lipstick, black evening gown, eyes that hold secrets", personalityTraits: ["mysterious", "manipulative", "vulnerable underneath"] },
        ],
        sceneTemplates: [
          { title: "The Office", timeOfDay: "NIGHT", weather: "RAINY", mood: "melancholic", description: "Dusty PI office, rain streaking the window, a knock at the door" },
          { title: "The Jazz Club", timeOfDay: "NIGHT", mood: "sultry", description: "Smoky underground club, saxophone wailing, danger in every shadow" },
          { title: "The Confrontation", timeOfDay: "DAWN", weather: "FOGGY", mood: "tense", description: "Abandoned pier at dawn, fog rolling in, truth finally revealed" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "16:9", duration: 120 },
        isPublic: true,
        isPremium: false,
        usageCount: 983,
        rating: 4.5,
        tags: ["noir", "detective", "mystery", "1940s"],
      },
      {
        name: "Medieval Quest",
        category: TemplateCategory.STORY_STARTER,
        description: "A reluctant hero embarks on a perilous quest through enchanted forests, treacherous mountains, and ancient ruins to save their kingdom from an awakening darkness.",
        promptTemplate: "A simple blacksmith discovers they are the last heir to a forgotten bloodline. With an ancient sword and unlikely companions, they must reach the Heart of the Mountain before the Shadow King awakens.",
        genre: Genre.FANTASY,
        stylePreset: "epic-fantasy",
        characterTemplates: [
          { name: "Elden", description: "Young blacksmith turned reluctant hero", appearancePrompt: "Young man with calloused hands, leather apron over simple clothes, carrying an ornate ancient sword that seems too grand for him", personalityTraits: ["humble", "brave", "self-doubting"] },
          { name: "Sage Mirwyn", description: "Ancient wizard who guides the hero", appearancePrompt: "Elderly wizard with a long silver beard, flowing robes covered in arcane symbols, wise but mischievous eyes", personalityTraits: ["wise", "cryptic", "secretly afraid"] },
        ],
        sceneTemplates: [
          { title: "The Forging", timeOfDay: "GOLDEN_HOUR", mood: "dramatic", description: "The sword glows as Elden first grasps it in his forge" },
          { title: "The Dark Forest", timeOfDay: "DUSK", weather: "FOGGY", mood: "eerie", description: "Ancient trees with glowing runes, whispers in the darkness" },
          { title: "The Mountain's Heart", timeOfDay: "MIDNIGHT", mood: "epic", description: "A vast underground cavern lit by crystal formations, the final confrontation" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "2.39:1", duration: 240 },
        isPublic: true,
        isPremium: false,
        usageCount: 876,
        rating: 4.6,
        tags: ["fantasy", "quest", "medieval", "epic"],
      },
      {
        name: "Superhero Origin",
        category: TemplateCategory.STORY_STARTER,
        description: "An ordinary person gains extraordinary abilities and must choose between using their power for personal gain or protecting a city that doesn't trust them.",
        promptTemplate: "After a lab accident involving experimental nanobots, a struggling med student gains the ability to manipulate matter at the molecular level. But the corporation behind the experiment wants their property back — at any cost.",
        genre: Genre.ACTION,
        stylePreset: "dynamic-action",
        characterTemplates: [
          { name: "Maya Torres", description: "Brilliant med student turned reluctant hero", appearancePrompt: "Young Latina woman, lab coat over casual clothes, hands crackling with blue energy", personalityTraits: ["intelligent", "compassionate", "overwhelmed"] },
          { name: "Dr. Victor Crane", description: "Corporate scientist who will stop at nothing to recapture the nanobots", appearancePrompt: "Distinguished older man in an expensive suit, silver hair, cold calculating eyes", personalityTraits: ["brilliant", "ruthless", "believes he's saving the world"] },
        ],
        sceneTemplates: [
          { title: "The Accident", timeOfDay: "NIGHT", mood: "chaotic", description: "Lab explodes in cascades of blue light, nanobots swarm" },
          { title: "First Powers", timeOfDay: "MORNING", mood: "wonder", description: "Maya discovers she can reshape objects with a thought" },
          { title: "The Showdown", timeOfDay: "DUSK", mood: "intense", description: "Rooftop confrontation as the city watches" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 30, aspectRatio: "16:9", duration: 150 },
        isPublic: true,
        isPremium: true,
        usageCount: 654,
        rating: 4.3,
        tags: ["superhero", "action", "origin-story", "sci-fi"],
      },
      {
        name: "Romantic Encounter",
        category: TemplateCategory.STORY_STARTER,
        description: "Two strangers from different worlds meet by chance and discover a connection that transcends their differences, set against the backdrop of a vibrant European city.",
        promptTemplate: "A traveling musician and a local bookshop owner in Lisbon keep crossing paths during a festival week. As the music fills the streets, they discover that their chance meetings might not be coincidence at all.",
        genre: Genre.ROMANCE,
        stylePreset: "warm-cinematic",
        characterTemplates: [
          { name: "Leo", description: "Wandering musician with a guitar and a broken heart", appearancePrompt: "Handsome man in his 30s, tousled dark hair, vintage jacket, acoustic guitar slung over shoulder", personalityTraits: ["charming", "restless", "afraid of commitment"] },
          { name: "Sofia", description: "Independent bookshop owner with a love for poetry", appearancePrompt: "Beautiful woman with warm brown eyes, sundress, paint-stained fingers from restoring old books", personalityTraits: ["passionate", "grounded", "secretly lonely"] },
        ],
        sceneTemplates: [
          { title: "The Meeting", timeOfDay: "GOLDEN_HOUR", mood: "warm", description: "Cobblestone street, festival decorations, their eyes meet across a crowded square" },
          { title: "The Bookshop", timeOfDay: "AFTERNOON", mood: "intimate", description: "Quiet afternoon among stacks of old books, rain outside" },
          { title: "The Bridge", timeOfDay: "DUSK", mood: "bittersweet", description: "Standing together on an ancient bridge, city lights reflecting in the river" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "16:9", duration: 120 },
        isPublic: true,
        isPremium: false,
        usageCount: 1102,
        rating: 4.8,
        tags: ["romance", "travel", "lisbon", "music"],
      },
      {
        name: "Horror Night",
        category: TemplateCategory.STORY_STARTER,
        description: "A group of friends discover that the abandoned building they're exploring harbors something that feeds on fear — and it's been waiting for them.",
        promptTemplate: "Five college friends break into an abandoned asylum for a thrill. As their phones lose signal and doors begin locking on their own, they realize the building's dark history is very much alive.",
        genre: Genre.HORROR,
        stylePreset: "dark-atmospheric",
        characterTemplates: [
          { name: "Sam", description: "The skeptic who organized the trip", appearancePrompt: "College student with a flashlight, rational expression slowly crumbling to fear", personalityTraits: ["skeptical", "leader", "stubborn"] },
          { name: "The Warden", description: "A presence that haunts the asylum's halls", appearancePrompt: "Shadowy figure in a vintage medical coat, face obscured, carrying old keys that jingle in empty corridors", personalityTraits: ["patient", "malevolent", "methodical"] },
        ],
        sceneTemplates: [
          { title: "Breaking In", timeOfDay: "NIGHT", weather: "STORMY", mood: "foreboding", description: "Lightning illuminates a crumbling asylum facade, friends squeeze through a gap in the fence" },
          { title: "The Ward", timeOfDay: "MIDNIGHT", mood: "terrifying", description: "Long corridor of rusted beds, something moves in the darkness at the far end" },
          { title: "No Way Out", timeOfDay: "MIDNIGHT", mood: "desperate", description: "Doors slam shut, flashlights flicker, the building itself seems to breathe" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "2.39:1", duration: 180 },
        isPublic: true,
        isPremium: false,
        usageCount: 789,
        rating: 4.4,
        tags: ["horror", "supernatural", "asylum", "group"],
      },
      {
        name: "Coming of Age",
        category: TemplateCategory.STORY_STARTER,
        description: "The summer before college, a teenager faces a series of experiences that transform their understanding of friendship, family, and who they want to become.",
        promptTemplate: "During their last summer at home, a high school graduate reconnects with an estranged childhood friend, confronts a family secret, and discovers that growing up means letting go of the person you thought you'd be.",
        genre: Genre.DRAMA,
        stylePreset: "indie-intimate",
        characterTemplates: [
          { name: "Jordan", description: "18, standing at the crossroads of childhood and adulthood", appearancePrompt: "Teenager sitting on a rooftop at sunset, worn sneakers dangling over the edge, journal in hand", personalityTraits: ["introspective", "creative", "anxious about the future"] },
          { name: "Alex", description: "Childhood best friend who moved away years ago, now back for the summer", appearancePrompt: "Same-age teen with a confident stride but guarded eyes, motorcycle helmet under arm", personalityTraits: ["bold", "secretive", "deeply loyal"] },
        ],
        sceneTemplates: [
          { title: "The Return", timeOfDay: "AFTERNOON", mood: "nostalgic", description: "Small-town main street, Jordan spots a familiar face they haven't seen in years" },
          { title: "The Lake", timeOfDay: "GOLDEN_HOUR", mood: "liberating", description: "Jumping off the old rope swing, laughter echoing across the water" },
          { title: "The Goodbye", timeOfDay: "DAWN", mood: "bittersweet", description: "Empty bedroom, packed boxes, one last look at the town from the car window" },
        ],
        settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "16:9", duration: 150 },
        isPublic: true,
        isPremium: false,
        usageCount: 934,
        rating: 4.6,
        tags: ["drama", "coming-of-age", "summer", "friendship"],
      },
    ],
  });

  // Character Archetype Templates
  await prisma.template.createMany({
    data: [
      {
        name: "The Hero",
        category: TemplateCategory.CHARACTER_ARCHETYPE,
        description: "A brave protagonist who rises to face challenges with courage and determination. Adaptable to any genre.",
        characterTemplates: [{ name: "Hero", description: "The central protagonist who overcomes obstacles", appearancePrompt: "Strong posture, determined expression, dressed for action", personalityTraits: ["courageous", "selfless", "determined", "flawed but growing"] }],
        isPublic: true,
        usageCount: 2341,
        rating: 4.5,
        tags: ["character", "hero", "protagonist"],
      },
      {
        name: "The Mentor",
        category: TemplateCategory.CHARACTER_ARCHETYPE,
        description: "A wise guide who helps the hero on their journey, offering knowledge and sometimes sacrifice.",
        characterTemplates: [{ name: "Mentor", description: "The wise guide with hidden depths", appearancePrompt: "Weathered face full of wisdom, calm demeanor, eyes that have seen everything", personalityTraits: ["wise", "patient", "secretive", "self-sacrificing"] }],
        isPublic: true,
        usageCount: 1876,
        rating: 4.4,
        tags: ["character", "mentor", "guide", "wise"],
      },
      {
        name: "The Comic Relief",
        category: TemplateCategory.CHARACTER_ARCHETYPE,
        description: "A witty companion who lightens the mood while often hiding deeper emotions beneath humor.",
        characterTemplates: [{ name: "Jester", description: "The witty companion who uses humor as armor", appearancePrompt: "Expressive face, casual and slightly disheveled appearance, always seems to be mid-joke", personalityTraits: ["funny", "loyal", "insecure underneath", "surprisingly perceptive"] }],
        isPublic: true,
        usageCount: 1543,
        rating: 4.3,
        tags: ["character", "comedy", "sidekick"],
      },
      {
        name: "The Antagonist",
        category: TemplateCategory.CHARACTER_ARCHETYPE,
        description: "A complex villain whose motivations are understandable even if their methods are not.",
        characterTemplates: [{ name: "Antagonist", description: "The opposing force with a compelling motivation", appearancePrompt: "Commanding presence, sharp features, expensive or powerful attire, eyes that reveal conviction", personalityTraits: ["intelligent", "driven", "ruthless", "believes they are right"] }],
        isPublic: true,
        isPremium: true,
        usageCount: 1234,
        rating: 4.6,
        tags: ["character", "villain", "antagonist"],
      },
      {
        name: "The Love Interest",
        category: TemplateCategory.CHARACTER_ARCHETYPE,
        description: "A compelling romantic counterpart who challenges and complements the protagonist.",
        characterTemplates: [{ name: "Love Interest", description: "The romantic counterpart with their own story", appearancePrompt: "Magnetic presence, warm but independent bearing, style that reflects their personality", personalityTraits: ["independent", "passionate", "challenging", "emotionally intelligent"] }],
        isPublic: true,
        usageCount: 1678,
        rating: 4.5,
        tags: ["character", "romance", "love-interest"],
      },
    ],
  });

  // Scene Composition Templates
  await prisma.template.createMany({
    data: [
      {
        name: "Opening Chase",
        category: TemplateCategory.SCENE_COMPOSITION,
        description: "A high-energy opening sequence that immediately hooks the audience with kinetic action and urgent pacing.",
        genre: Genre.ACTION,
        sceneTemplates: [{ title: "The Chase Begins", timeOfDay: "NIGHT", mood: "adrenaline", description: "Tight alleys, flickering neon, footsteps pounding as the chase erupts", cameraMovements: ["TRACKING", "HANDHELD", "CRANE_UP"], shotTypes: ["CLOSE_UP", "TRACKING", "AERIAL"] }],
        settingsTemplate: { fps: 30, aspectRatio: "2.39:1" },
        isPublic: true,
        usageCount: 567,
        rating: 4.3,
        tags: ["scene", "action", "chase", "opening"],
      },
      {
        name: "Emotional Goodbye",
        category: TemplateCategory.SCENE_COMPOSITION,
        description: "A tender farewell scene with lingering close-ups and deliberate pacing that maximizes emotional impact.",
        genre: Genre.DRAMA,
        sceneTemplates: [{ title: "The Farewell", timeOfDay: "GOLDEN_HOUR", weather: "CLEAR", mood: "bittersweet", description: "Two figures silhouetted against a sunset, the distance between them growing", cameraMovements: ["DOLLY_OUT", "STATIC", "PAN_LEFT"], shotTypes: ["CLOSE_UP", "TWO_SHOT", "WIDE"] }],
        settingsTemplate: { fps: 24, aspectRatio: "16:9" },
        isPublic: true,
        usageCount: 445,
        rating: 4.7,
        tags: ["scene", "drama", "emotional", "goodbye"],
      },
      {
        name: "Epic Battle",
        category: TemplateCategory.SCENE_COMPOSITION,
        description: "A grand-scale conflict scene with sweeping camera work and dynamic composition for maximum spectacle.",
        genre: Genre.ACTION,
        sceneTemplates: [{ title: "The Battle", timeOfDay: "DUSK", weather: "STORMY", mood: "epic", description: "Armies clash on a vast field, lightning splits the sky, heroes and villains collide", cameraMovements: ["CRANE_UP", "ORBIT", "TRACKING"], shotTypes: ["AERIAL", "WIDE", "MEDIUM", "CLOSE_UP"] }],
        settingsTemplate: { fps: 24, aspectRatio: "2.39:1" },
        isPublic: true,
        isPremium: true,
        usageCount: 389,
        rating: 4.5,
        tags: ["scene", "action", "battle", "epic"],
      },
      {
        name: "Plot Twist Reveal",
        category: TemplateCategory.SCENE_COMPOSITION,
        description: "A carefully constructed revelation scene that recontextualizes everything the audience thought they knew.",
        genre: Genre.THRILLER,
        sceneTemplates: [{ title: "The Reveal", timeOfDay: "NIGHT", mood: "shocking", description: "A dimly lit room, evidence scattered on a wall, the pieces finally click into place", cameraMovements: ["DOLLY_IN", "ZOOM_IN", "STATIC"], shotTypes: ["EXTREME_CLOSE_UP", "OVER_THE_SHOULDER", "WIDE"] }],
        settingsTemplate: { fps: 24, aspectRatio: "16:9" },
        isPublic: true,
        usageCount: 512,
        rating: 4.6,
        tags: ["scene", "thriller", "twist", "reveal"],
      },
    ],
  });

  console.log(`  ✓ Created 16 templates (7 story + 5 character + 4 scene)`);

  // ── Summary ────────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    scripts: await prisma.script.count(),
    characters: await prisma.character.count(),
    scenes: await prisma.scene.count(),
    shots: await prisma.shot.count(),
    audioTracks: await prisma.audioTrack.count(),
    renderJobs: await prisma.renderJob.count(),
    templates: await prisma.template.count(),
  };

  console.log("\n🎬 Seed complete!\n");
  console.log("   Records created:");
  Object.entries(counts).forEach(([model, count]) => {
    console.log(`     ${model.padEnd(14)} ${count}`);
  });
  console.log("");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
