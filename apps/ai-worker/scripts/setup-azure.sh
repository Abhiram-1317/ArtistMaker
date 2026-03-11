#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis — Azure GPU VM Setup Script
# Works with Azure for Students ($100 free credits via GitHub Student Pack)
#
# Usage: ssh into your Azure VM, then:
#   curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-azure.sh | bash
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "=============================================="
echo "  Project Genesis — Azure GPU VM Setup"
echo "=============================================="

# ── 1. Install Docker + NVIDIA drivers ───────────────────────────────────────

echo "[1/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
fi

echo "[2/6] Installing NVIDIA drivers..."
if ! command -v nvidia-smi &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y linux-headers-$(uname -r)
    distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
    
    # Install NVIDIA CUDA drivers
    sudo apt-get install -y ubuntu-drivers-common
    sudo ubuntu-drivers autoinstall
    
    echo "NVIDIA drivers installed. A reboot may be required."
    echo "After reboot, run this script again to continue setup."
fi

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

# ── 2. Clone the repo ────────────────────────────────────────────────────────

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

# ── 3. Create .env ────────────────────────────────────────────────────────────

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

# ── 4. Start services ────────────────────────────────────────────────────────

echo "[6/6] Starting AI Worker..."
docker compose up -d --build

echo ""
echo "=============================================="
echo "  ✅ Setup Complete!"
echo "=============================================="
echo ""
echo "  GPU Status:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo "  (nvidia-smi not available — reboot may be needed)"
echo ""
echo "  Services:"
echo "    AI Worker: http://$(hostname -I | awk '{print $1}'):3002"
echo "    Redis:     localhost:6379"
echo ""
echo "  Commands:"
echo "    View logs:     docker compose logs -f ai-worker"
echo "    Check health:  curl http://localhost:3002/health"
echo "    Stop:          docker compose down"
echo "    GPU status:    nvidia-smi"
echo ""
echo "  💰 Azure tip: STOP the VM when not in use to save credits!"
echo "     az vm deallocate --name <vm-name> --resource-group <rg>"
echo ""
