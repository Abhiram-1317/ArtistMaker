# Deploying Project Genesis AI Worker

## Deployment Options (GitHub Student Pack)

| Option | Credits | GPU | Cost/hr | Hours Available | Setup Difficulty |
|--------|---------|-----|---------|-----------------|------------------|
| **Google Cloud** | **$300** | T4 16GB | ~$0.35 | **~857 hrs** | Easy (recommended) |
| **Azure for Students** | $100 | T4 16GB | ~$0.53 | ~188 hrs | Easy |
| **DigitalOcean** | $200 | H100/A100 | ~$2-3 | ~70-100 hrs | Needs access request |
| **HuggingFace API** | Free | N/A | $0 | Unlimited | Already working |

> **Recommendation**: Use **Google Cloud** — most credits ($300), cheapest GPU ($0.35/hr), ~857 hours.
> The HF API fallback already works for images + Ken Burns video on your laptop.

---

# Option A: Google Cloud (Recommended — $300 Free Credits)

## Prerequisites

- Google Cloud account with **$300 free trial** (90 days, no student pack needed)
- Sign up at [cloud.google.com/free](https://cloud.google.com/free)
- Install [gcloud CLI](https://cloud.google.com/sdk/docs/install)

## Step 1: Set up gcloud CLI

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Step 2: Request GPU quota (one-time, ~5 min approval)

1. Go to [IAM Quotas page](https://console.cloud.google.com/iam-admin/quotas)
2. Filter: **"NVIDIA T4"** + region **"us-central1"**
3. Select it → **Edit Quotas** → Request limit **1**
4. Usually approved within minutes

## Step 3: Create the GPU VM (one command)

```bash
bash scripts/create-gcp-vm.sh
```

Creates **n1-standard-4 + T4 16GB GPU** for ~$0.35/hr. $300 = **~857 hours**.

## Step 4: SSH in and deploy

```bash
gcloud compute ssh genesis-gpu --zone=us-central1-a
curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-gcp.sh | bash
```

## Step 5: Add your HF token

```bash
cd ~/genesis-ai-worker/apps/ai-worker
nano .env
# Add: HF_TOKEN=hf_your_token_here
docker compose restart ai-worker
```

## Step 6: Verify

```bash
curl http://localhost:3002/health
nvidia-smi
```

## Step 7: Connect your web app

```env
# In apps/api/.env on your laptop:
AI_WORKER_URL=http://YOUR_VM_IP:3002
```

## Save Credits!

```bash
# STOP the VM when not using (saves money, keeps disk):
gcloud compute instances stop genesis-gpu --zone=us-central1-a

# START it again later:
gcloud compute instances start genesis-gpu --zone=us-central1-a

# DELETE everything when done:
gcloud compute instances delete genesis-gpu --zone=us-central1-a --quiet
```

> $300 at $0.35/hr = **~857 hours** of GPU time. Always stop when not in use!

---

# Option B: Azure for Students

## Prerequisites

- **GitHub Student Developer Pack** → $100 Azure credits
- Sign up at [Azure for Students](https://azure.microsoft.com/en-us/free/students/) using your edu email
- Install [Azure CLI](https://aka.ms/installazurecli)

## Step 1: Create the GPU VM (one command)

```bash
az login
bash scripts/create-azure-vm.sh
```

This creates a **Standard_NC4as_T4_v3** VM (T4 16GB GPU, 4 vCPUs, 28GB RAM) for ~$0.53/hr.

## Step 2: SSH in and deploy

```bash
ssh azureuser@YOUR_VM_IP
curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-azure.sh | bash
```

## Step 3: Add your HF token

```bash
cd ~/genesis-ai-worker/apps/ai-worker
nano .env
# Add: HF_TOKEN=hf_your_token_here
docker compose restart ai-worker
```

## Step 4: Verify

```bash
curl http://localhost:3002/health
nvidia-smi
```

## Step 5: Connect your web app

```env
# In apps/api/.env on your laptop:
AI_WORKER_URL=http://YOUR_VM_IP:3002
```

## Save Credits!

```bash
# STOP the VM when not using (saves money, keeps disk):
az vm deallocate -g genesis-ai-rg -n genesis-gpu

# START it again later:
az vm start -g genesis-ai-rg -n genesis-gpu

# DELETE everything when done:
az group delete -n genesis-ai-rg --yes
```

> $100 at $0.53/hr = **~188 hours** of GPU time. Always deallocate when not in use!

---

# Option C: DigitalOcean GPU Droplet

## Prerequisites

- **GitHub Student Developer Pack** → $200 DigitalOcean credits
- DigitalOcean account linked to GitHub Student Pack
- **Note**: GPU Droplets may require requesting access first

---

## Step 1: Create a GPU Droplet

1. Go to [DigitalOcean Cloud Console](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Choose **GPU Droplets** (under "Choose a plan")
4. Recommended config:
   - **GPU**: NVIDIA H100 (1x GPU) — or cheapest GPU option available
   - **Region**: Closest to you
   - **Image**: Ubuntu 22.04 LTS
   - **Auth**: SSH key (recommended) or password
5. Click **Create Droplet**

> **Cost**: GPU Droplets are ~$2-3/hour. With $200 credits, you get ~70-100 hours.
> **Tip**: Destroy the droplet when not in use to save credits!

---

## Step 2: SSH into the Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

---

## Step 3: One-Command Setup

```bash
curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-droplet.sh | bash
```

Or manually:

```bash
git clone https://github.com/Abhiram-1317/ArtistMaker.git /opt/genesis-ai-worker
cd /opt/genesis-ai-worker/apps/ai-worker
bash scripts/setup-droplet.sh
```

---

## Step 4: Download AI Models

```bash
cd /opt/genesis-ai-worker/apps/ai-worker
docker compose exec ai-worker python scripts/download_models.py
```

This downloads SD-Turbo (~2.5GB). On a GPU Droplet with fast internet, this takes ~1-2 minutes.

---

## Step 5: Verify It's Running

```bash
# Check health
curl http://localhost:3002/health

# View logs
docker compose logs -f ai-worker
```

---

## Step 6: Connect Your Web App

Update your local `apps/api/.env` to point to the droplet:

```env
AI_WORKER_URL=http://YOUR_DROPLET_IP:3002
```

Or if using a domain/firewall, set up an SSH tunnel:

```bash
ssh -L 3002:localhost:3002 root@YOUR_DROPLET_IP
```

---

## Managing the Droplet

```bash
# Stop (saves credits!)
docker compose down

# Start again
docker compose up -d

# Rebuild after code changes
git pull
docker compose up -d --build

# Check GPU status
nvidia-smi
```

---

## Important: Save Credits!

- **Destroy** the droplet when not actively using it
- Models are stored in Docker volumes — they persist across restarts
- If you destroy the droplet, you'll need to re-download models (~2 min)

---

## Architecture

```
Your Laptop (apps/web + apps/api)
        │
        │  HTTP :3002
        ▼
DigitalOcean GPU Droplet
├── Docker
│   ├── ai-worker (Node.js + Python + CUDA)
│   │   ├── Fastify server (:3002)
│   │   ├── Bull queue worker
│   │   ├── SD-Turbo model
│   │   └── Python inference scripts
│   └── redis (job queue)
└── NVIDIA GPU (H100/A100)
```

---

# Option D: HuggingFace API (Free, Already Working)

No credits needed. Already set up and tested on your laptop.

- **Images**: FLUX.1-schnell → 1024x1024 PNG (~9s)
- **Video**: Keyframe generation + Ken Burns cinematic motion (~30s)
- **Limitations**: No true AI video generation (AnimateDiff/SVD need GPU)

```bash
# Test image generation
cd apps/ai-worker
npx tsx src/test.ts --api

# Test video generation
npx tsx src/test.ts --video

# Test image-to-video
npx tsx src/test.ts --i2v output/images/your_image.png
```

---

# Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Your Laptop                                            │
│  ├── apps/web (Next.js :3333)                           │
│  ├── apps/api (Fastify :3001)                           │
│  └── apps/ai-worker (Fastify :3002)                     │
│       ├── HF API mode (current, no GPU needed)          │
│       │    ├── hf_image_generator.py → FLUX.1-schnell   │
│       │    └── hf_video_generator.py → Ken Burns motion │
│       └── Local GPU mode (for cloud deployment)         │
│            ├── image_generator.py → SD-Turbo            │
│            ├── video_generator.py → AnimateDiff          │
│            └── svd_generator.py → SVD (image-to-video)  │
└────────────────────┬────────────────────────────────────┘
                     │  (optional: point to cloud GPU)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Google Cloud / Azure / DigitalOcean (GPU)               │
│  ├── Docker                                             │
│  │   ├── ai-worker + CUDA + Python                      │
│  │   └── Redis (job queue)                              │
│  └── NVIDIA T4/V100/H100 GPU                            │
└─────────────────────────────────────────────────────────┘
```
