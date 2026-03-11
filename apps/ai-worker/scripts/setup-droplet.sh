#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis — DigitalOcean GPU Droplet Setup Script
# Run this on a fresh GPU Droplet to deploy the AI Worker
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "=============================================="
echo "  Project Genesis — AI Worker Setup"
echo "=============================================="

# ── 1. Install Docker + NVIDIA Container Toolkit ─────────────────────────────

echo "[1/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

echo "[2/5] Installing NVIDIA Container Toolkit..."
if ! command -v nvidia-ctk &> /dev/null; then
    distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -s -L "https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list" | \
        sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
        tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
    apt-get update
    apt-get install -y nvidia-container-toolkit
    nvidia-ctk runtime configure --runtime=docker
    systemctl restart docker
fi

# ── 2. Clone the repo ────────────────────────────────────────────────────────

echo "[3/5] Cloning Project Genesis..."
REPO_DIR="/opt/genesis-ai-worker"
if [ -d "$REPO_DIR" ]; then
    cd "$REPO_DIR"
    git pull
else
    git clone https://github.com/Abhiram-1317/ArtistMaker.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

cd apps/ai-worker

# ── 3. Create .env ────────────────────────────────────────────────────────────

echo "[4/5] Configuring environment..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
NODE_ENV=production
WORKER_PORT=3002
WORKER_HOST=0.0.0.0
REDIS_URL=redis://redis:6379
MODELS_DIR=/app/models
OUTPUT_DIR=/app/output
PYTHON_PATH=python
CUDA_VISIBLE_DEVICES=0
WORKER_CONCURRENCY=1
HF_TOKEN=
API_URL=http://YOUR_WEB_APP_URL:3001
EOF
    echo "  → Created .env — edit API_URL and HF_TOKEN if needed"
fi

# ── 4. Build & Start ─────────────────────────────────────────────────────────

echo "[5/5] Building and starting AI Worker..."
docker compose up -d --build

echo ""
echo "=============================================="
echo "  AI Worker is starting!"
echo "  Health check: curl http://localhost:3002/health"
echo ""
echo "  Download models inside container:"
echo "  docker compose exec ai-worker python scripts/download_models.py"
echo ""
echo "  View logs:"
echo "  docker compose logs -f ai-worker"
echo "=============================================="
