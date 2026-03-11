#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis — Create Azure GPU VM using Azure CLI
# Run this locally after installing Azure CLI (az login first)
#
# Prerequisites:
#   1. Azure for Students account ($100 credits via GitHub Student Pack)
#   2. Azure CLI installed: https://aka.ms/installazurecli
#   3. Run: az login
#
# Usage: bash scripts/create-azure-vm.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── Configuration ─────────────────────────────────────────────────────────────

RESOURCE_GROUP="genesis-ai-rg"
VM_NAME="genesis-gpu"
LOCATION="eastus"
# NC6s_v3 = 1x V100 16GB, 6 vCPUs, 112GB RAM (~$0.90/hr)
# NC4as_T4_v3 = 1x T4 16GB, 4 vCPUs, 28GB RAM (~$0.53/hr) ← cheapest GPU
VM_SIZE="Standard_NC4as_T4_v3"
IMAGE="Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest"
ADMIN_USER="azureuser"

echo "=============================================="
echo "  Project Genesis — Azure GPU VM Creator"
echo "=============================================="
echo ""
echo "  VM Size: $VM_SIZE (T4 16GB GPU)"
echo "  Cost:    ~\$0.53/hour"
echo "  Credits: \$100 = ~188 hours"
echo "  Region:  $LOCATION"
echo ""

# ── 1. Create Resource Group ─────────────────────────────────────────────────

echo "[1/4] Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# ── 2. Create the VM ─────────────────────────────────────────────────────────

echo "[2/4] Creating GPU VM (this takes 2-5 minutes)..."
az vm create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --size "$VM_SIZE" \
    --image "$IMAGE" \
    --admin-username "$ADMIN_USER" \
    --generate-ssh-keys \
    --public-ip-sku Standard \
    --output table

# ── 3. Open port 3002 ────────────────────────────────────────────────────────

echo "[3/4] Opening port 3002..."
az vm open-port \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --port 3002 \
    --output none

# ── 4. Get IP and show next steps ────────────────────────────────────────────

echo "[4/4] Getting VM IP address..."
VM_IP=$(az vm show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --show-details \
    --query publicIps \
    --output tsv)

echo ""
echo "=============================================="
echo "  ✅ Azure GPU VM Created!"
echo "=============================================="
echo ""
echo "  IP Address: $VM_IP"
echo "  SSH:        ssh $ADMIN_USER@$VM_IP"
echo ""
echo "  Next steps:"
echo "  1. SSH in:  ssh $ADMIN_USER@$VM_IP"
echo "  2. Run setup:"
echo "     curl -sSL https://raw.githubusercontent.com/Abhiram-1317/ArtistMaker/main/apps/ai-worker/scripts/setup-azure.sh | bash"
echo ""
echo "  To STOP the VM (saves credits!):"
echo "     az vm deallocate -g $RESOURCE_GROUP -n $VM_NAME"
echo ""
echo "  To START it again:"
echo "     az vm start -g $RESOURCE_GROUP -n $VM_NAME"
echo ""
echo "  To DELETE everything:"
echo "     az group delete -n $RESOURCE_GROUP --yes"
echo ""
