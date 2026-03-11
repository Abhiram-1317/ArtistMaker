<div align="center">

# 🎬 Project Genesis

### AI Movie Generation Platform

Transform text prompts into AI-generated cinematic content — images, characters, scenes, and video.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-202020?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.12-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Quick Start](#quick-start-new-laptop) · [Features](#features) · [Architecture](#architecture) · [AI Pipeline](#ai-pipeline) · [API Reference](#api-reference) · [Roadmap](#roadmap)

</div>

---

## What This Project Actually Does

Project Genesis is a **full-stack Turborepo monorepo** with three apps:
- **Next.js 14 web app** — Dashboard, wizard, editors, explore, profile pages
- **Fastify 5 API** — REST endpoints, auth, PostgreSQL via Prisma, Bull job queues
- **AI Worker** — Python + Node.js service that generates real AI images via HuggingFace API

### Verified Working (tested end-to-end)
- ✅ Text prompt → Bull queue job → HuggingFace FLUX.1-schnell → **real AI-generated images** (~10s per image)
- ✅ Character reference generation (4 views: front, side, 3/4, expression)
- ✅ Scene keyframe generation from text description
- ✅ Full job queue pipeline with progress tracking
- ✅ JWT auth (register/login), project CRUD, database persistence

### Partial / Needs GPU
- ⚠️ Video generation (AnimateDiff code exists, needs 8GB+ VRAM GPU — falls back to static image)
- ⚠️ Voice generation (Coqui TTS code exists, needs ~2GB install)
- ⚠️ Music/SFX generation (AudioCraft code exists, needs GPU)
- ⚠️ FFmpeg video composition (code complete, works when video input available)

### UI Demo Mode
- 🎨 Dashboard stats, explore page, watch page use demo/seed data when `DEMO_MODE=true`

---

## Features

### 🎥 Movie Creation Wizard
- **5-step guided workflow**: Concept → Style → Characters → Settings → Review
- Natural language story prompts with genre selection
- AI-powered character generation with genre-specific templates
- Cinematic settings: resolution (720p/1080p/4K), frame rate, aspect ratio, color grading
- Cost estimation based on complexity

### 🎭 Character Designer
- AI-generated character profiles with personality traits, voice styles, and appearance
- Reference image generation (front, side, 3/4 view, expressions)
- 12 genre-specific character template sets
- Custom trait system with voice preview

### 🎬 Editor Suite
- **Script Editor** — Write and structure screenplays
- **Scene Configurator** — Set lighting, weather, time of day, camera work
- **Character Designer** — Full character design with reference images
- **Timeline Editor** — Arrange scenes and manage pacing

### 📊 Analytics Dashboard
- Project statistics and engagement metrics
- Watch time tracking and viewer demographics
- Activity feed with render status updates

### 🤝 Real-time Collaboration
- Multi-user project editing with WebSocket sync
- Role-based access control (Owner / Editor / Viewer)
- Character-level locking to prevent conflicts

### 🎨 Template System
- Browse and use community templates
- Categories: Story Starters, Character Archetypes, Scene Compositions, Full Movies, Style Presets, Camera Movements
- Rating and usage tracking

### 💳 Credits & Billing
- Credit-based rendering system with Stripe integration
- Tiered subscriptions: Free, Starter, Pro, Enterprise
- Transaction history and usage analytics

### 🌐 Explore & Watch
- Public movie gallery with search and filtering
- Video player with like, comment, and share functionality
- Creator profiles with filmography

---

## AI Pipeline

How the movie generation pipeline works end-to-end:

```
User enters prompt
       │
       ▼
  Next.js /api/generate/movie
       │ (auto-registers system user, gets JWT)
       ▼
  Fastify API creates Project + Scene + Shot
       │
       ▼
  Bull queue: renderQueue.add("generate-movie", jobData)
       │
       ▼
  AI Worker picks up job from Redis queue
       │
       ├── Step 1: Character Generation (0-10%)
       │   └── 4x HuggingFace FLUX.1-schnell API calls per character
       │       (front view, side view, 3/4 view, expression sheet)
       │
       ├── Step 2: Shot Generation (10-70%)
       │   ├── Keyframe image via HuggingFace API ✅
       │   ├── Image → Video via AnimateDiff (needs GPU, falls back to static)
       │   ├── Frame interpolation via RIFE (optional)
       │   └── Upscaling via Real-ESRGAN (optional)
       │
       ├── Step 3: Audio Generation (70-85%)
       │   ├── Voice/dialogue via Coqui TTS (needs install)
       │   ├── Music via MusicGen (needs GPU)
       │   └── SFX via AudioGen (needs GPU)
       │
       └── Step 4: Composition (85-100%)
           ├── Concatenate videos (or convert images to static clips)
           ├── Mix audio tracks with volume/delay
           ├── Add fade in/out transitions
           └── Final encode via FFmpeg → final_movie.mp4
```

**Every step is wrapped in try/catch** — if any optional service fails, the pipeline continues and returns whatever it successfully generated.

### What Runs Without a GPU

| Service | Without GPU | With GPU (8GB+ VRAM) |
|---|---|---|
| Image generation | ✅ HuggingFace API (free, ~10s/image) | ✅ Local SD-Turbo (~2s/image) |
| Video generation | ❌ Falls back to static keyframe | ✅ AnimateDiff (~30s/clip) |
| Voice (TTS) | ❌ Needs coqui-tts install (~2GB) | ✅ Coqui TTS |
| Music | ❌ Skipped | ✅ MusicGen |
| SFX | ❌ Skipped | ✅ AudioGen |
| FFmpeg composition | ✅ Works (needs FFmpeg installed) | ✅ Works |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| **Backend API** | Fastify 5, Socket.IO, Bull (job queues), @fastify/jwt |
| **AI Worker** | Node.js + Python 3.10+, PythonShell, fluent-ffmpeg |
| **AI Models** | HuggingFace FLUX.1-schnell (image), AnimateDiff (video), Coqui TTS, MusicGen, AudioGen |
| **Database** | PostgreSQL, Prisma ORM 5.12 |
| **Queue/Cache** | Redis + Bull |
| **Auth** | Fastify JWT (API), NextAuth.js v4 (Web) |
| **Video** | FFmpeg (composition), Real-ESRGAN (upscaling), RIFE (interpolation) |
| **Monorepo** | Turborepo 2.0, npm workspaces |
| **Language** | TypeScript 5.4 (strict), Python 3.10+ |
| **Deploy** | Docker Compose, Google Colab (free GPU) |

---

## Architecture

```
project-genesis/
├── apps/
│   ├── web/                        # Next.js 14 frontend (App Router) — port 3333
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/         # Login & registration
│   │   │   │   ├── (dashboard)/    # Dashboard, projects, settings, analytics, generate
│   │   │   │   ├── (marketing)/    # Landing page
│   │   │   │   ├── api/            # Next.js API routes (auth, generate/movie proxy)
│   │   │   │   ├── profile/        # Public creator profiles
│   │   │   │   └── watch/          # Video player & comments
│   │   │   ├── components/
│   │   │   │   ├── editor/         # CharacterDesigner, SceneConfigurator, ScriptEditor, TimelineEditor
│   │   │   │   ├── analytics/      # Charts & metrics components
│   │   │   │   ├── collaboration/  # Real-time collaboration UI
│   │   │   │   ├── templates/      # Template browser & previews
│   │   │   │   ├── credits/        # Billing & transaction components
│   │   │   │   ├── watch/          # Video player, comments, reactions
│   │   │   │   └── wizard-step-*.tsx  # 5-step movie creation wizard
│   │   │   └── lib/                # Data fetching, auth, utilities
│   │   └── next.config.js
│   │
│   ├── api/                        # Fastify 5 backend API — port 3001
│   │   └── src/
│   │       ├── routes/             # REST endpoints (auth, projects, characters, scenes, render)
│   │       ├── services/           # AI service, credit service
│   │       ├── websocket/          # Socket.IO handlers (render updates, collaboration)
│   │       ├── queues/             # Bull job queue (movie-render)
│   │       ├── plugins/            # Fastify plugins (Prisma, JWT auth)
│   │       └── config/             # Environment & Redis config
│   │
│   └── ai-worker/                  # AI generation worker — port 3002
│       ├── src/
│       │   ├── services/
│       │   │   ├── aiOrchestrator.ts     # Coordinates all AI services per job
│       │   │   ├── imageGeneration.ts    # HuggingFace FLUX.1-schnell (REAL)
│       │   │   ├── videoGeneration.ts    # AnimateDiff / Ken Burns (needs GPU)
│       │   │   ├── voiceGeneration.ts    # Coqui TTS (needs install)
│       │   │   ├── musicGeneration.ts    # MusicGen (needs GPU)
│       │   │   ├── sfxGeneration.ts      # AudioGen (needs GPU)
│       │   │   ├── videoEnhancement.ts   # Frame interpolation + upscaling
│       │   │   └── videoComposition.ts   # FFmpeg final movie assembly
│       │   ├── workers/
│       │   │   └── movieRenderWorker.ts  # Bull queue consumer
│       │   └── server.ts                 # Express health endpoint + worker start
│       └── src/python/                   # Python AI scripts
│           ├── hf_image_generator.py     # HuggingFace Inference API (WORKING)
│           ├── image_generator.py        # Local SD-Turbo (needs GPU)
│           ├── video_generator.py        # AnimateDiff (needs GPU)
│           ├── hf_video_generator.py     # HF video API
│           ├── voice_generator.py        # Coqui TTS
│           ├── music_generator.py        # MusicGen
│           ├── sfx_generator.py          # AudioGen  
│           ├── frame_interpolation.py    # RIFE
│           └── video_upscaler.py         # Real-ESRGAN
│
├── packages/
│   ├── ui/                         # @genesis/ui — Shared React component library
│   ├── database/                   # @genesis/database — Prisma schema & client (14 models)
│   ├── typescript-config/          # @genesis/typescript-config — Shared tsconfigs
│   └── eslint-config/              # @genesis/eslint-config — Shared lint rules
│
├── turbo.json
├── package.json
└── docker-compose.yml              # Docker deployment config
```

---

## Database Schema

The Prisma schema defines a cinematic production data model:

| Model | Description |
|---|---|
| **User** | Accounts with subscription tiers (Free/Starter/Pro/Enterprise), credit balances, Stripe integration |
| **Project** | Movies with status pipeline (Draft → Pre-Production → In Production → Rendering → Completed) |
| **Script** | Raw prompts and structured screenplay content |
| **Character** | Characters with appearance, personality traits, voice profiles, and reference images |
| **Scene** | Scenes with lighting, weather, time of day, mood, and location |
| **Shot** | Individual shots with camera type, angle, movement, and AI generation prompts |
| **AudioTrack** | Dialogue, music, SFX, ambient, foley, and voiceover tracks |
| **RenderJob** | Queued rendering tasks (shot generation, upscaling, interpolation, compositing) |
| **Template** | Reusable project/character/scene templates with ratings |
| **ProjectMember** | Collaboration with role-based access (Owner/Editor/Viewer) |
| **Analytics** | Engagement tracking with view events and demographics |

**Supported Genres**: Action, Comedy, Drama, Horror, Sci-Fi, Fantasy, Thriller, Romance, Animation, Documentary, Experimental

**Camera System**: 10+ shot types, 6 camera angles, 15+ camera movements, 8 time-of-day presets, 9 weather conditions

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 10.0.0
- **PostgreSQL** 14+ 
- **Redis** 
- **Python** 3.10+ (for AI worker)
- **FFmpeg** (for video composition)

---

## Quick Start (New Laptop)

Complete step-by-step guide to run this project on a fresh Windows machine.

### Step 1: Install Prerequisites

```powershell
# 1. Node.js — download from https://nodejs.org (LTS version)
# 2. Git — download from https://git-scm.com
# 3. Python 3.10+ — download from https://python.org (check "Add to PATH")
```

**PostgreSQL** (portable, no installer needed):
```powershell
# Download binary zip from https://www.enterprisedb.com/download-postgresql-binaries
# Extract to D:\pgsql (or any folder on D: drive to save C: space)
D:\pgsql\bin\initdb.exe -D D:\pgsql\data -U postgres
Start-Process -FilePath "D:\pgsql\bin\pg_ctl.exe" -ArgumentList "start","-D","D:\pgsql\data","-l","D:\pgsql\logfile.txt" -WindowStyle Hidden
D:\pgsql\bin\createdb.exe -U postgres genesis
```

**Redis** (Windows):
```powershell
# Download from https://github.com/microsoftarchive/redis/releases
# Extract to D:\Redis
Start-Process -FilePath "D:\Redis\redis-server.exe" -ArgumentList "D:\Redis\redis.windows.conf" -WindowStyle Hidden
```

**FFmpeg**:
```powershell
# Download from https://www.gyan.dev/ffmpeg/builds/ (ffmpeg-release-essentials.zip)
# Extract to D:\ffmpeg
# Add D:\ffmpeg\bin to system PATH
$env:PATH = "D:\ffmpeg\bin;" + $env:PATH
```

### Step 2: Clone & Install

```powershell
D:
git clone https://github.com/Abhiram-1317/ArtistMaker.git Artist
cd D:\Artist
npm install
```

### Step 3: Create Environment Files

**`packages/database/.env`**:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/genesis"
```

**`apps/api/.env`**:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/genesis?schema=public"
JWT_SECRET="change-this-to-a-random-32-char-string-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3333
```

**`apps/web/.env`**:
```env
NEXTAUTH_SECRET=change-this-to-a-random-32-char-string-in-production
NEXTAUTH_URL=http://localhost:3333
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/genesis
DEMO_MODE=true
NEXT_PUBLIC_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_URL=http://localhost:3001/api
REDIS_URL=redis://localhost:6379
```

**`apps/ai-worker/.env`**:
```env
REDIS_URL=redis://localhost:6379
WORKER_PORT=3002
WORKER_HOST=0.0.0.0
NODE_ENV=development
MODELS_DIR=./models
PYTHON_PATH=d:/Artist/apps/ai-worker/.venv/Scripts/python.exe
WORKER_CONCURRENCY=1
OUTPUT_DIR=./output
API_URL=http://localhost:3001
HF_TOKEN=<your-huggingface-token>
```

> Get a free HuggingFace token at https://huggingface.co/settings/tokens

### Step 4: Setup Database

```powershell
cd D:\Artist
npx -w @genesis/database prisma generate
npx -w @genesis/database prisma db push
npx -w @genesis/database prisma db seed
```

### Step 5: Setup Python Environment (for AI Worker)

```powershell
cd D:\Artist\apps\ai-worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install diffusers transformers accelerate safetensors huggingface-hub Pillow python-shell
```

### Step 6: Start All Services

Open 3 separate terminals:

```powershell
# Terminal 1: Start PostgreSQL + Redis (if not already running)
Start-Process -FilePath "D:\pgsql\bin\pg_ctl.exe" -ArgumentList "start","-D","D:\pgsql\data","-l","D:\pgsql\logfile.txt" -WindowStyle Hidden
Start-Process -FilePath "D:\Redis\redis-server.exe" -ArgumentList "D:\Redis\redis.windows.conf" -WindowStyle Hidden

# Terminal 2: API Server (port 3001)
cd D:\Artist\apps\api
npm run dev

# Terminal 3: AI Worker (port 3002)
cd D:\Artist\apps\ai-worker
$env:PATH = "D:\ffmpeg\bin;" + $env:PATH
npm run dev

# Terminal 4: Web App (port 3333)
cd D:\Artist\apps\web
npx next dev --port 3333
```

### Step 7: Test the Pipeline

```powershell
# Submit a movie generation job via the API
$body = '{"prompt":"A magical forest with glowing fireflies at twilight","style":"cinematic"}'
Invoke-WebRequest -Uri "http://localhost:3333/api/generate/movie" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

Or visit http://localhost:3333 → Dashboard → Generate → Movie tab → Enter a prompt

### Startup Cheatsheet (After First Setup)

Every time you open the project:
```powershell
# 1. Start PostgreSQL
Start-Process "D:\pgsql\bin\pg_ctl.exe" -ArgumentList "start","-D","D:\pgsql\data","-l","D:\pgsql\logfile.txt" -WindowStyle Hidden

# 2. Start Redis
Start-Process "D:\Redis\redis-server.exe" -ArgumentList "D:\Redis\redis.windows.conf" -WindowStyle Hidden

# 3. Start API
cd D:\Artist\apps\api; npm run dev

# 4. Start AI Worker  
cd D:\Artist\apps\ai-worker; $env:PATH = "D:\ffmpeg\bin;" + $env:PATH; npm run dev

# 5. Start Web
cd D:\Artist\apps\web; npx next dev --port 3333
```

---

## Available Scripts

### Root Commands

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in development mode (Turbo) |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Lint all packages |
| `npm run clean` | Remove all build artifacts |
| `npm run format` | Format code with Prettier |

### Database Commands

| Command | Description |
|---|---|
| `npm run -w @genesis/database db:generate` | Generate Prisma client |
| `npm run -w @genesis/database db:push` | Push schema to database |
| `npm run -w @genesis/database db:migrate` | Run database migrations (dev) |
| `npm run -w @genesis/database db:migrate:prod` | Deploy migrations (production) |
| `npm run -w @genesis/database db:seed` | Seed database with sample data |
| `npm run -w @genesis/database db:studio` | Open Prisma Studio GUI |
| `npm run -w @genesis/database db:reset` | Reset database (destructive) |

### App-specific Commands

| Command | Description |
|---|---|
| `npm run -w @genesis/web dev` | Start Next.js dev server |
| `npm run -w @genesis/web build` | Build Next.js for production |
| `npm run -w @genesis/api dev` | Start Fastify dev server (with tsx watch) |
| `npm run -w @genesis/api build` | Compile API TypeScript |

---

## API Reference

### Fastify Backend (`apps/api`, port 3001)

| Module | Endpoints | Description |
|---|---|---|
| **Health** | `GET /api/health` | Server health check |
| **Projects** | `GET/POST/PUT/DELETE /api/projects` | Project CRUD and management |
| **Characters** | `GET/POST/PUT/DELETE /api/characters` | Character CRUD with reference image generation |
| **Scenes** | `GET/POST/PUT/DELETE /api/scenes` | Scene management |
| **Templates** | `GET/POST /api/templates` | Template browsing, rating, and usage |
| **Analytics** | `GET /api/analytics` | Engagement and viewer data |
| **Credits** | `GET/POST /api/credits` | Credit balance and Stripe purchases |
| **Collaboration** | `GET/POST /api/collaboration` | Project sharing and member management |
| **Admin** | `GET/POST /api/admin` | Admin-only operations |
| **Webhooks** | `POST /api/webhooks` | Stripe payment webhooks |

### Next.js API Routes (`apps/web/src/app/api/`)

| Route | Description |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth.js authentication (credentials + OAuth) |
| `/api/projects` | Project creation from wizard |
| `/api/credits/*` | Credit management |
| `/api/explore` | Public movie browsing |
| `/api/templates/*` | Template operations (get, rate, use) |
| `/api/watch/[id]/*` | Video analytics, comments, likes |
| `/api/profile/[username]` | Public profile data |

### WebSocket Events

| Namespace | Events | Description |
|---|---|---|
| **Render** | `render:progress`, `render:complete`, `render:failed` | Real-time render job updates |
| **Collaboration** | `collab:join`, `collab:lock`, `collab:update`, `collab:cursor` | Multi-user editing sync |

---

## Packages

### `@genesis/ui`
Shared React component library built with Radix UI primitives and Tailwind CSS.

| Component | Description |
|---|---|
| `Button` | Primary, secondary, ghost, danger variants with icon support |
| `Badge` | Status indicators (default, success, warning, error, info) |
| `Card` | Content container with glass morphism style |
| `Input` | Form input with label and validation |
| `Modal` | Dialog with overlay, powered by Radix UI Dialog |
| `Spinner` | Loading indicator |
| `Toast` | Notification system with success/error/warning variants |

### `@genesis/database`
Prisma schema, client, and migrations for PostgreSQL. Exports the Prisma client instance and all model/enum types.

### `@genesis/typescript-config`
Shared TypeScript configurations: `base.json`, `nextjs.json`, `node.json`, `react-library.json`.

### `@genesis/eslint-config`
Shared ESLint configurations: `base.js`, `next.js`, `node.js`, `react-internal.js`.

---

## Design System

The UI uses a custom dark theme with the **Genesis** color palette:

| Token | Usage |
|---|---|
| `genesis-*` | Primary purple gradient (brand color) |
| `neon-pink/purple/blue/cyan` | Accent colors for highlights |
| `surface-*` | Dark background layers (`#0a0a0f` base) |

**Fonts**: Inter (body), Space Grotesk (headings)

**Responsive**: Mobile-first with breakpoints at 475px (xs), 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)

**Animations**: Framer Motion for page transitions, staggered lists, and micro-interactions

---

## Image Optimization

- **Formats**: WebP and AVIF with automatic negotiation
- **Device sizes**: 640, 750, 828, 1080, 1200, 1920px
- **Caching**: 30-day minimum cache TTL for static assets
- **Lazy loading**: Blur placeholder data URLs for progressive image loading

---

## Turborepo Pipeline

```
build
├── @genesis/database (prisma generate)
├── @genesis/ui (type check)
├── @genesis/api (tsc compile)
└── @genesis/web (next build, depends on ui + database)
```

- **Caching**: Build outputs cached locally (`.next/`, `dist/`, `.prisma/`)
- **Environment awareness**: Builds invalidate on env variable changes
- **Parallel execution**: Independent tasks run concurrently

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and ensure builds pass: `npm run build`
4. Lint and format: `npm run lint && npm run format`
5. Commit with a descriptive message
6. Push and open a Pull Request

### Code Style

- TypeScript strict mode throughout
- Prettier for formatting (configured at root)
- ESLint with shared configs per package
- Component files use PascalCase, utilities use kebab-case

---

## Roadmap — What to Implement Next

### Phase 1: Make It a Real Movie Generator (Priority: HIGH)

These changes turn the project from "image generator with a pipeline" into an actual movie generator:

| # | Task | Effort | Impact |
|---|---|---|---|
| 1 | **Integrate Runway ML / Pika API** for video generation — replace AnimateDiff with a cloud API that works without GPU. ~$0.05-0.50 per 4s clip. | 1-2 days | Produces real video clips from text |
| 2 | **Integrate ElevenLabs API** for voice — replace Coqui TTS with cloud API. Free tier available. | 0.5 day | Real character dialogue |
| 3 | **Integrate Suno API** for music — replace MusicGen with cloud API. | 0.5 day | Background music for scenes |
| 4 | **Multi-shot scenes** — currently generates 1 shot per scene. Add logic to break a scene description into 3-5 shots with different camera angles. | 1 day | Actual cinematic sequences |
| 5 | **Wire FFmpeg composition end-to-end** — with real video + audio inputs, produce a watchable `.mp4`. Add title cards, credits. | 1 day | Downloadable final movie file |

### Phase 2: Connect the UI to Real Data (Priority: HIGH)

| # | Task | Description |
|---|---|---|
| 6 | **Connect Next.js auth to Fastify JWT** — Replace demo credentials flow. Add signup/login pages that call `/api/auth/register` + `/api/auth/login`. Store JWT in httpOnly cookie. |
| 7 | **Remove DEMO_MODE** — Wire dashboard stats, project list, and analytics to real database queries instead of hardcoded data. |
| 8 | **Project detail page** — Show generated images/video for a specific project. Link to download/view outputs. |
| 9 | **Generation progress UI** — Poll or WebSocket for real-time job progress (the Bull queue already reports 0-100%). Show progress bar. |
| 10 | **Gallery/Explore from real data** — Show actually generated movies in the explore page instead of seed data. |

### Phase 3: Production Hardening (Priority: MEDIUM)

| # | Task | Description |
|---|---|---|
| 11 | **Error handling & retry UI** — Show failed jobs, let users retry. The Bull queue already has retry logic. |
| 12 | **File storage** — Move generated files from local disk to S3/Cloudflare R2. Serve via CDN. |
| 13 | **Rate limiting per user** — Currently global rate limit. Add per-user limits based on subscription tier. |
| 14 | **Stripe integration** — Wire real payment for credits. The schema supports it, UI components exist. |
| 15 | **Deploy to production** — Docker Compose is ready. Deploy API + Worker to a VPS. Deploy web to Vercel. |

### Phase 4: Advanced Features (Priority: LOW)

| # | Task | Description |
|---|---|---|
| 16 | **Character consistency** — Use IP-Adapter or reference image conditioning so the same character looks consistent across shots. |
| 17 | **Scene transitions** — Crossfade, wipe, dissolve between shots using FFmpeg filters. |
| 18 | **Storyboard editor** — Let users rearrange generated shots, regenerate individual shots, adjust prompts per shot. |
| 19 | **Real-time collaboration** — WebSocket infrastructure exists. Wire it to actual multi-user editing. |
| 20 | **Mobile app** — React Native wrapper for the web app. |

### Recommended Priority Order

Do this first to get the most impressive demo:
1. Runway/Pika video API (#1) — turns static images into real video
2. ElevenLabs voice API (#2) — adds character speech  
3. Generation progress UI (#9) — users see something happening
4. Project detail page (#8) — users see their results
5. Connect auth (#6) — real user accounts

---

## License

MIT
