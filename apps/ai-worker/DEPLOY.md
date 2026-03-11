# Deploying AI Worker on DigitalOcean GPU Droplet

## Prerequisites

- **GitHub Student Developer Pack** → $200 DigitalOcean credits
- DigitalOcean account linked to GitHub Student Pack

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
