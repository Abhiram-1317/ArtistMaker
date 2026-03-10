"use client";

import { useRef, useCallback, useEffect } from "react";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type TrackEventType = "play" | "progress" | "ended";

interface TrackPayload {
  projectId: string;
  sessionId: string;
  event: TrackEventType;
  currentTime: number;
  duration: number;
  deviceType: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function detectDeviceType(): string {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android.*mobile/i.test(ua)) return "mobile";
  return "desktop";
}

async function sendTrackEvent(payload: TrackPayload) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: payload.event,
        projectId: payload.projectId,
        data: {
          sessionId: payload.sessionId,
          currentTime: payload.currentTime,
          duration: payload.duration,
          deviceType: payload.deviceType,
        },
      }),
    });
  } catch {
    // Silently fail — analytics should never break playback
  }
}

/* ── Hook ──────────────────────────────────────────────────────────────────── */

/**
 * Tracks video player events (play, progress every 5 s, ended)
 * and posts them to the analytics API.
 *
 * Usage:
 *   const { onTimeUpdate, onPlay, onEnded } = useAnalyticsTracking(projectId);
 *   <VideoPlayer onTimeUpdate={onTimeUpdate} ... />
 *
 * The `onTimeUpdate` callback is compatible with VideoPlayer's
 * `onTimeUpdate?: (currentTime: number, duration: number) => void` prop.
 */
export function useAnalyticsTracking(projectId: string) {
  const sessionIdRef = useRef<string>(generateSessionId());
  const deviceTypeRef = useRef<string>("desktop");
  const lastProgressRef = useRef<number>(0);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    deviceTypeRef.current = detectDeviceType();
  }, []);

  const track = useCallback(
    (event: TrackEventType, currentTime: number, duration: number) => {
      sendTrackEvent({
        projectId,
        sessionId: sessionIdRef.current,
        event,
        currentTime,
        duration,
        deviceType: deviceTypeRef.current,
      });
    },
    [projectId],
  );

  /** Call on play start */
  const onPlay = useCallback(
    (currentTime: number, duration: number) => {
      if (!hasPlayedRef.current) {
        hasPlayedRef.current = true;
        track("play", currentTime, duration);
      }
    },
    [track],
  );

  /** Call from VideoPlayer's onTimeUpdate — fires progress every 5 s */
  const onTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      // Fire play event on first update if not yet tracked
      if (!hasPlayedRef.current) {
        hasPlayedRef.current = true;
        track("play", currentTime, duration);
      }

      // Progress every 5 seconds
      if (currentTime - lastProgressRef.current >= 5) {
        lastProgressRef.current = currentTime;
        track("progress", currentTime, duration);
      }
    },
    [track],
  );

  /** Call when video ends */
  const onEnded = useCallback(
    (duration: number) => {
      track("ended", duration, duration);
    },
    [track],
  );

  /** Reset session (e.g. when switching videos) */
  const resetSession = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    lastProgressRef.current = 0;
    hasPlayedRef.current = false;
  }, []);

  return { onTimeUpdate, onPlay, onEnded, resetSession };
}
