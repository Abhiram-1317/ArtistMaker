"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

/* ── Event payload types (mirror API definitions) ──────────────────────── */

export interface RenderProgressPayload {
  stage: string;
  progress: number;
  shotId?: string;
  message: string;
}

export interface RenderCompletePayload {
  shotId: string;
  videoUrl: string;
  thumbnailUrl: string;
}

export interface RenderErrorPayload {
  shotId?: string;
  error: string;
  message: string;
}

export interface RenderStatusPayload {
  projectStatus: string;
  overallProgress: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: "progress" | "complete" | "error" | "status" | "info";
  message: string;
}

export interface ShotState {
  shotId: string;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface UseRenderSocketReturn {
  isConnected: boolean;
  overallProgress: number;
  currentStage: string;
  projectStatus: string;
  shots: Map<string, ShotState>;
  activityLog: ActivityLogEntry[];
  eta: string | null;
  error: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function generateLogId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useRenderSocket(
  projectId: string,
  token: string | null,
): UseRenderSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Initializing");
  const [projectStatus, setProjectStatus] = useState("waiting");
  const [shots, setShots] = useState<Map<string, ShotState>>(new Map());
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [eta, setEta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const addLog = useCallback(
    (type: ActivityLogEntry["type"], message: string) => {
      setActivityLog((prev) => [
        ...prev,
        { id: generateLogId(), timestamp: new Date(), type, message },
      ]);
    },
    [],
  );

  const updateEta = useCallback((progress: number) => {
    if (progress <= 0 || progress >= 100) {
      setEta(null);
      return;
    }
    const elapsed = Date.now() - startTimeRef.current;
    const totalEstimated = elapsed / (progress / 100);
    const remaining = Math.max(0, totalEstimated - elapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    setEta(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
  }, []);

  useEffect(() => {
    if (!projectId || !token) return;

    startTimeRef.current = Date.now();
    addLog("info", "Connecting to render server...");

    const socket = io(`${API_URL}/render`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      addLog("info", "Connected to render server");
      socket.emit("join:project", projectId);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      addLog("info", `Disconnected: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      setError(err.message);
      addLog("error", `Connection error: ${err.message}`);
    });

    socket.on("render:progress", (data: RenderProgressPayload) => {
      setCurrentStage(data.stage);
      setOverallProgress(data.progress);
      updateEta(data.progress);

      if (data.shotId) {
        setShots((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.shotId!) || {
            shotId: data.shotId!,
            status: "pending" as const,
            progress: 0,
          };
          next.set(data.shotId!, {
            ...existing,
            status: "processing",
            progress: data.progress,
          });
          return next;
        });
      }

      addLog("progress", data.message);
    });

    socket.on("render:complete", (data: RenderCompletePayload) => {
      setShots((prev) => {
        const next = new Map(prev);
        next.set(data.shotId, {
          shotId: data.shotId,
          status: "complete",
          progress: 100,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
        });
        return next;
      });

      addLog("complete", `Shot ${data.shotId} rendered successfully`);
    });

    socket.on("render:error", (data: RenderErrorPayload) => {
      setError(data.message);

      if (data.shotId) {
        setShots((prev) => {
          const next = new Map(prev);
          next.set(data.shotId!, {
            shotId: data.shotId!,
            status: "error",
            progress: 0,
            error: data.error,
          });
          return next;
        });
      }

      addLog("error", data.message);
    });

    socket.on("render:status", (data: RenderStatusPayload) => {
      setProjectStatus(data.projectStatus);
      setOverallProgress(data.overallProgress);
      updateEta(data.overallProgress);
      addLog("status", `Project status: ${data.projectStatus} (${data.overallProgress}%)`);
    });

    return () => {
      socket.emit("leave:project", projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, token, addLog, updateEta]);

  return {
    isConnected,
    overallProgress,
    currentStage,
    projectStatus,
    shots,
    activityLog,
    eta,
    error,
  };
}
