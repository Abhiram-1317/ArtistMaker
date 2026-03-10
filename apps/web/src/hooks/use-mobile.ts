"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════════════
 *  useIsMobile — detect mobile viewport
 * ══════════════════════════════════════════════════════════════════════════ */

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  useSwipe — detect horizontal/vertical swipe gestures
 * ══════════════════════════════════════════════════════════════════════════ */

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // min px to register swipe (default 50)
  preventDefault?: boolean;
}

export function useSwipe(
  ref: React.RefObject<HTMLElement | null>,
  handlers: SwipeHandlers,
  options: SwipeOptions = {},
) {
  const { threshold = 50, preventDefault = false } = options;
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!startRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = touch.clientY - startRef.current.y;
      startRef.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < threshold && absDy < threshold) return;

      if (preventDefault) e.preventDefault();

      if (absDx > absDy) {
        // horizontal
        if (dx > 0) handlers.onSwipeRight?.();
        else handlers.onSwipeLeft?.();
      } else {
        // vertical
        if (dy > 0) handlers.onSwipeDown?.();
        else handlers.onSwipeUp?.();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: !preventDefault });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, handlers, threshold, preventDefault]);
}

/* ══════════════════════════════════════════════════════════════════════════
 *  useLongPress — detect long press (tap and hold)
 * ══════════════════════════════════════════════════════════════════════════ */

export function useLongPress(
  callback: () => void,
  { delay = 500 }: { delay?: number } = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, delay);
  }, [callback, delay]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
 *  useShare — native Web Share API with fallback
 * ══════════════════════════════════════════════════════════════════════════ */

interface ShareData {
  title: string;
  text?: string;
  url?: string;
}

export function useShare() {
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    if (canShare) {
      try {
        await navigator.share(data);
        return true;
      } catch {
        // User cancelled or error
        return false;
      }
    }
    // Fallback: copy URL to clipboard
    const url = data.url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [canShare]);

  return { canShare, share };
}
