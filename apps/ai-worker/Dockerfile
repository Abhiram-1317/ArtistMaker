# ─────────────────────────────────────────────────────────────────────────────
# Project Genesis AI Worker — GPU-enabled Docker image
# Base: NVIDIA CUDA 12.1 + Python 3.12 + Node.js 20
# ─────────────────────────────────────────────────────────────────────────────

FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04 AS base

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system deps + Python 3.12 + Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common curl ca-certificates git \
    && add-apt-repository ppa:deadsnakes/ppa \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends \
    python3.12 python3.12-venv python3.12-dev python3-pip \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Make python3.12 the default python
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.12 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1

WORKDIR /app

# ── Python dependencies ──────────────────────────────────────────────────────

COPY requirements.txt .
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

# ── Node.js dependencies ─────────────────────────────────────────────────────

COPY package.json .
RUN npm install --omit=dev

# ── Application code ─────────────────────────────────────────────────────────

COPY tsconfig.json .
COPY src/ src/
COPY scripts/ scripts/

# Build TypeScript
RUN npx tsc

# ── Runtime config ────────────────────────────────────────────────────────────

ENV NODE_ENV=production
ENV WORKER_PORT=3002
ENV WORKER_HOST=0.0.0.0
ENV PYTHON_PATH=python
ENV MODELS_DIR=/app/models
ENV OUTPUT_DIR=/app/output

# Models directory (mount or download at runtime)
RUN mkdir -p /app/models /app/output

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

CMD ["node", "dist/server.js"]
