#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis — Create Google Cloud GPU VM
# Run this locally after installing gcloud CLI
#
# Prerequisites:
#   1. Google Cloud account with $300 free trial credits
#   2. gcloud CLI: https://cloud.google.com/sdk/docs/install
#   3. Run: gcloud auth login && gcloud config set project YOUR_PROJECT_ID
#
# Usage: bash scripts/create-gcp-vm.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── Configuration ─────────────────────────────────────────────────────────────

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
VM_NAME="genesis-gpu"
ZONE="us-central1-a"
# n1-standard-4 + T4 GPU = ~$0.35/hr (cheapest NVIDIA GPU on GCP)
MACHINE_TYPE="n1-standard-4"
ACCELERATOR="type=nvidia-tesla-t4,count=1"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
BOOT_DISK_SIZE="100GB"

echo "=============================================="
echo "  Project Genesis — Google Cloud GPU VM"
echo "=============================================="
echo ""
echo "  Project:  $PROJECT_ID"
echo "  VM:       $VM_NAME"
echo "  Zone:     $ZONE"
echo "  Machine:  $MACHINE_TYPE + T4 GPU"
echo "  Cost:     ~\$0.35/hour"
echo "  Credits:  \$300 = ~857 hours"
echo ""

if [ -z "$PROJECT_ID" ]; then
    echo "ERROR: No project set. Run:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# ── 1. Enable required APIs ──────────────────────────────────────────────────

echo "[1/4] Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com --quiet

# ── 2. Request GPU quota (if needed) ─────────────────────────────────────────

echo "[2/4] Checking GPU quota..."
GPU_QUOTA=$(gcloud compute regions describe us-central1 \
    --format="value(quotas[name=NVIDIA_T4_GPUS].limit)" 2>/dev/null || echo "0")

if [ "$GPU_QUOTA" = "0" ]; then
    echo ""
    echo "⚠️  GPU quota is 0. You need to request quota increase:"
    echo "  1. Go to: https://console.cloud.google.com/iam-admin/quotas"
    echo "  2. Filter for 'NVIDIA T4' in region 'us-central1'"
    echo "  3. Select it and click 'Edit Quotas'"
    echo "  4. Request limit of 1 (usually approved within minutes for free trial)"
    echo ""
    echo "After quota is approved, run this script again."
    exit 1
fi

# ── 3. Create the VM ─────────────────────────────────────────────────────────

echo "[3/4] Creating GPU VM (this takes 1-3 minutes)..."
gcloud compute instances create "$VM_NAME" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --accelerator="$ACCELERATOR" \
    --maintenance-policy=TERMINATE \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --boot-disk-size="$BOOT_DISK_SIZE" \
    --boot-disk-type="pd-ssd" \
    --metadata=startup-script='#!/bin/bash
# Install NVIDIA drivers on first boot
if ! command -v nvidia-smi &> /dev/null; then
    apt-get update
    apt-get install -y linux-headers-$(uname -r)
    curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb -o /tmp/cuda-keyring.deb
    dpkg -i /tmp/cuda-keyring.deb
    apt-get update
    apt-get install -y cuda-drivers
fi'

# ── 4. Open firewall for port 3002 ───────────────────────────────────────────

echo "[4/4] Configuring firewall..."
gcloud compute firewall-rules create genesis-ai-worker \
    --allow=tcp:3002 \
    --target-tags=genesis-gpu \
    --description="Allow AI worker traffic" \
    --quiet 2>/dev/null || true

gcloud compute instances add-tags "$VM_NAME" \
    --zone="$ZONE" \
    --tags=genesis-gpu \
    --quiet

# ── Get IP ────────────────────────────────────────────────────────────────────

VM_IP=$(gcloud compute instances describe "$VM_NAME" \
    --zone="$ZONE" \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

echo ""
echo "=============================================="
echo "  ✅ Google Cloud GPU VM Created!"
echo "=============================================="
echo ""
echo "  IP Address: $VM_IP"
echo "  SSH:        gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "  Next steps:"
echo "  1. Wait ~2 min for NVIDIA drivers to install (first boot)"
echo "  2. SSH in:"
echo "     gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  3. Run setup:"
echo "     curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-gcp.sh | bash"
echo ""
echo "  To STOP the VM (saves credits!):"
echo "     gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo ""
echo "  To START it again:"
echo "     gcloud compute instances start $VM_NAME --zone=$ZONE"
echo ""
echo "  To DELETE everything:"
echo "     gcloud compute instances delete $VM_NAME --zone=$ZONE --quiet"
echo ""
