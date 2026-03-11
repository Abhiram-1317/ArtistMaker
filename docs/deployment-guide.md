# Deployment Guide — Project Genesis

Production deployment guide for the AI movie generation platform.

---

## Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| **GPU** | NVIDIA 8 GB VRAM (RTX 3070) | NVIDIA 24 GB VRAM (RTX 4090 / A100) |
| **RAM** | 16 GB | 32 GB |
| **Disk** | 80 GB (models + data) | 200 GB SSD |
| **CUDA** | 12.1 | 12.1+ |
| **Docker** | 24.0+ with Compose v2 | Latest |
| **NVIDIA Container Toolkit** | Required for GPU passthrough | — |
| **Node.js** | 18 | 20 LTS |
| **Python** | 3.10 | 3.12 |

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/Abhiram-1317/ArtistMaker.git
cd ArtistMaker

# 2. Configure
cp .env.docker .env
# Edit .env — set POSTGRES_PASSWORD, JWT_SECRET, NEXTAUTH_SECRET

# 3. Launch
docker compose up -d

# 4. Run database migrations
docker compose exec api npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma

# 5. Seed (optional demo data)
docker compose exec api npx tsx ../../packages/database/prisma/seed.ts

# 6. Download AI models (first run ~15 GB)
docker compose exec ai-worker python scripts/download_models.py
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **AI Worker**: http://localhost:3002

---

## Manual Setup (No Docker)

### 1. Install System Dependencies

```bash
# PostgreSQL 16 + Redis 7
sudo apt install postgresql-16 redis-server

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install nodejs

# Python 3.12 + venv
sudo apt install python3.12 python3.12-venv

# NVIDIA CUDA 12.1 (see https://developer.nvidia.com/cuda-12-1-1-download-archive)
```

### 2. Install Dependencies

```bash
# Node
npm install

# Python (in ai-worker)
cd apps/ai-worker
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/ai-worker/.env.example apps/ai-worker/.env

# Edit each file — at minimum set:
#   apps/api/.env       → DATABASE_URL, JWT_SECRET
#   apps/web/.env       → NEXTAUTH_SECRET, DATABASE_URL
#   apps/ai-worker/.env → HF_TOKEN (for gated models)
```

### 4. Database Setup

```bash
cd packages/database
npx prisma migrate deploy    # apply migrations
npx tsx prisma/seed.ts       # seed demo data (optional)
```

### 5. Download AI Models

```bash
cd apps/ai-worker
python scripts/download_models.py
```

Expected downloads (~15 GB total):
| Model | Size | Purpose |
|---|---|---|
| SD-Turbo | ~2.5 GB | Image generation |
| Stable Video Diffusion | ~5 GB | Video generation |
| Coqui XTTS v2 | ~2 GB | Voice synthesis |
| MusicGen Medium | ~3 GB | Music generation |
| AudioGen Medium | ~2 GB | Sound effects |
| Real-ESRGAN x2 | ~60 MB | Video upscaling |
| RIFE (optional) | ~50 MB | Frame interpolation |

### 6. Start Services

```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Web
cd apps/web && npm run dev

# Terminal 3 — AI Worker
cd apps/ai-worker && npm run dev
```

---

## Pre-Flight Check

Run the automated checker before going live:

```bash
python scripts/preflight_check.py
```

This validates: GPU, CUDA, Python packages, model files, service connectivity, environment variables, disk space.

---

## Health Checks

| Service | Endpoint | Expected |
|---|---|---|
| API | `GET /health` | `200 OK` |
| AI Worker | `GET /health` | `200 OK` |
| Frontend | `GET /` | `200 OK` |
| PostgreSQL | `pg_isready` | `accepting connections` |
| Redis | `redis-cli ping` | `PONG` |

---

## Testing

```bash
# Unit / lint
npm run lint

# E2E (requires services running)
npx playwright install --with-deps
npx playwright test

# Pipeline-specific E2E
npx playwright test e2e/pipeline.spec.ts
```

---

## Storage

### Local (default)
Output files go to `apps/ai-worker/output/`. Configure `OUTPUT_DIR` in `.env`.

### S3 / R2
Set these in the AI worker environment:
```
S3_BUCKET=genesis-output
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ENDPOINT=https://....r2.cloudflarestorage.com  # for R2
```

---

## Monitoring

### Sentry (error tracking)
Add `SENTRY_DSN` to all three services' environment.

### GPU Monitoring
```bash
# Real-time GPU usage
watch -n 1 nvidia-smi

# Inside Docker
docker compose exec ai-worker nvidia-smi
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `CUDA out of memory` | Reduce batch size, use fp16, or upgrade GPU |
| `Model download fails` | Check HF_TOKEN, network. Re-run `download_models.py` |
| `Database connection refused` | Ensure PostgreSQL is running on port 5432 |
| `Redis connection failed` | Ensure Redis is running on port 6379 |
| `RIFE not available` | Normal — falls back to OpenCV optical flow |
| Docker GPU not detected | Install NVIDIA Container Toolkit, restart Docker |
| `basicsr` import error | Patch `torchvision.transforms.functional_tensor` → `functional` |

---

## Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Web App │────▶│   API    │────▶│  AI Worker   │
│ Next.js  │     │ Fastify  │     │ Python + Node│
│  :3000   │     │  :3001   │     │   :3002      │
└──────────┘     └────┬─────┘     └──────┬───────┘
                      │                   │
                 ┌────▼─────┐       ┌────▼───────┐
                 │PostgreSQL│       │   Redis    │
                 │  :5432   │       │   :6379    │
                 └──────────┘       └────────────┘
```
