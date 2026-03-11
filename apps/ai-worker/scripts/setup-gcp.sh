#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis — Google Cloud GPU VM Setup Script
# Run this after SSHing into your GCP VM:
#   gcloud compute ssh genesis-gpu --zone=us-central1-a
#   curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-gcp.sh | bash
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "=============================================="
echo "  Project Genesis — GCP GPU VM Setup"
echo "=============================================="

# ── 1. Install Docker ────────────────────────────────────────────────────────

echo "[1/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
fi

# ── 2. Wait for NVIDIA drivers ───────────────────────────────────────────────

echo "[2/6] Checking NVIDIA drivers..."
RETRIES=0
while ! command -v nvidia-smi &> /dev/null && [ $RETRIES -lt 12 ]; do
    echo "  Waiting for NVIDIA drivers to install (attempt $((RETRIES+1))/12)..."
    sleep 10
    RETRIES=$((RETRIES+1))
done

if command -v nvidia-smi &> /dev/null; then
    echo "  GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "  WARNING: nvidia-smi not found. Drivers may still be installing."
    echo "  Try rebooting: sudo reboot"
    echo "  Then run this script again."
fi

# ── 3. Install NVIDIA Container Toolkit ──────────────────────────────────────

echo "[3/6] Installing NVIDIA Container Toolkit..."
if ! command -v nvidia-ctk &> /dev/null; then
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
        sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -s -L "https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list" | \
        sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
        sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
    sudo apt-get update
    sudo apt-get install -y nvidia-container-toolkit
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
fi

# ── 4. Clone the repo ────────────────────────────────────────────────────────

echo "[4/6] Cloning Project Genesis..."
REPO_DIR="$HOME/genesis-ai-worker"
if [ -d "$REPO_DIR" ]; then
    cd "$REPO_DIR"
    git pull
else
    git clone https://github.com/Abhiram-1317/ArtistMaker.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

cd apps/ai-worker

# ── 5. Create .env ────────────────────────────────────────────────────────────

echo "[5/6] Configuring environment..."
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
# Add your HuggingFace token below:
HF_TOKEN=
EOF
    echo ""
    echo "⚠️  Edit .env to add your HF_TOKEN:"
    echo "    nano $REPO_DIR/apps/ai-worker/.env"
    echo ""
fi

# ── 6. Start services ────────────────────────────────────────────────────────

echo "[6/6] Starting AI Worker..."
docker compose up -d --build

echo ""
echo "=============================================="
echo "  ✅ Setup Complete!"
echo "=============================================="
echo ""
echo "  GPU Status:"
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader 2>/dev/null || echo "  (GPU not ready — try: sudo reboot, then re-run)"
echo ""
echo "  Services:"
EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || hostname -I | awk '{print $1}')
echo "    AI Worker: http://${EXTERNAL_IP}:3002"
echo "    Redis:     localhost:6379"
echo ""
echo "  Commands:"
echo "    View logs:     docker compose logs -f ai-worker"
echo "    Check health:  curl http://localhost:3002/health"
echo "    Stop:          docker compose down"
echo "    GPU status:    nvidia-smi"
echo ""
echo "  💰 GCP tip: STOP the VM when not in use to save credits!"
echo "     gcloud compute instances stop genesis-gpu --zone=us-central1-a"
echo ""
