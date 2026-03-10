// ─────────────────────────────────────────────────────────────────────────────
// GPU information and health check utilities
// ─────────────────────────────────────────────────────────────────────────────

import { execSync } from "child_process";

export interface GpuInfo {
  available: boolean;
  name: string;
  vramTotal: string;
  vramUsed: string;
  vramFree: string;
  temperature: string;
  cudaVersion: string;
}

export function getGpuInfo(): GpuInfo {
  try {
    const output = execSync(
      "nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,temperature.gpu --format=csv,noheader,nounits",
      { encoding: "utf-8", timeout: 10_000 }
    ).trim();

    const [name, total, used, free, temp] = output.split(", ");

    let cudaVersion = "unknown";
    try {
      const nvccOutput = execSync("nvcc --version", {
        encoding: "utf-8",
        timeout: 5_000,
      });
      const match = nvccOutput.match(/release (\d+\.\d+)/);
      if (match) cudaVersion = match[1];
    } catch {
      // nvcc not found — try from nvidia-smi
      try {
        const smiOutput = execSync("nvidia-smi", {
          encoding: "utf-8",
          timeout: 5_000,
        });
        const match = smiOutput.match(/CUDA Version:\s+([\d.]+)/);
        if (match) cudaVersion = match[1];
      } catch {
        /* ignore */
      }
    }

    return {
      available: true,
      name: name?.trim() ?? "Unknown",
      vramTotal: `${total?.trim()} MiB`,
      vramUsed: `${used?.trim()} MiB`,
      vramFree: `${free?.trim()} MiB`,
      temperature: `${temp?.trim()}°C`,
      cudaVersion,
    };
  } catch {
    return {
      available: false,
      name: "No NVIDIA GPU detected",
      vramTotal: "0 MiB",
      vramUsed: "0 MiB",
      vramFree: "0 MiB",
      temperature: "N/A",
      cudaVersion: "N/A",
    };
  }
}

export function checkPythonAvailable(pythonPath: string): boolean {
  try {
    execSync(`${pythonPath} --version`, {
      encoding: "utf-8",
      timeout: 5_000,
    });
    return true;
  } catch {
    return false;
  }
}

export function checkPyTorchCuda(pythonPath: string): boolean {
  try {
    const result = execSync(
      `${pythonPath} -c "import torch; print(torch.cuda.is_available())"`,
      { encoding: "utf-8", timeout: 15_000 }
    ).trim();
    return result === "True";
  } catch {
    return false;
  }
}
