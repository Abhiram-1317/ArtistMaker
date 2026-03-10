"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
} from "react";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════════ */

interface VideoPlayerProps {
  src: string | null;
  poster?: string | null;
  title: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;
type Quality = "720p" | "1080p" | "4K";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];
const QUALITIES: Quality[] = ["720p", "1080p", "4K"];

/* ══════════════════════════════════════════════════════════════════════════════
 *  Helpers
 * ══════════════════════════════════════════════════════════════════════════════ */

function fmt(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Icons (inline SVGs for zero-dep player)
 * ══════════════════════════════════════════════════════════════════════════════ */

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const VolumeUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);
const VolumeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);
const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);
const FullscreenExitIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);
const TheaterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

const LargePlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════════
 *  VideoPlayer Component
 * ══════════════════════════════════════════════════════════════════════════════ */

export default function VideoPlayer({
  src,
  poster,
  title,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [quality, setQuality] = useState<Quality>("1080p");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [showBigPlay, setShowBigPlay] = useState(true);
  const [seeking, setSeeking] = useState(false);

  /* ── Video event handlers ─────────────────────────────────────────────── */

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
      setShowBigPlay(false);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) {
      c.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const changeSpeed = useCallback((s: PlaybackSpeed) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }, []);

  const changeQuality = useCallback((q: Quality) => {
    setQuality(q);
    setShowQualityMenu(false);
    // In production, switch HLS stream quality here
  }, []);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, v.duration || 0));
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }, []);

  /* ── Controls visibility ──────────────────────────────────────────────── */

  const showControlsBriefly = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }
    }, 3000);
  }, []);

  /* ── Seek bar interaction ─────────────────────────────────────────────── */

  const handleSeekBarMouse = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const bar = seekBarRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(fraction * duration);
      setHoverX(e.clientX - rect.left);

      if (seeking) {
        seek(fraction * duration);
      }
    },
    [duration, seek, seeking],
  );

  const handleSeekDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const bar = seekBarRef.current;
      if (!bar || !duration) return;
      setSeeking(true);
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(fraction * duration);
    },
    [duration, seek],
  );

  /* ── Video events ─────────────────────────────────────────────────────── */

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdateInner = () => {
      setCurrentTime(v.currentTime);
      onTimeUpdate?.(v.currentTime, v.duration);
    };
    const onDurationChange = () => setDuration(v.duration);
    const onProgress = () => {
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
    };
    const onPlay = () => { setPlaying(true); setShowBigPlay(false); };
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setShowControls(true); };
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);

    v.addEventListener("timeupdate", onTimeUpdateInner);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onProgress);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdateInner);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [onTimeUpdate]);

  /* ── Mouse-up for seeking ─────────────────────────────────────────────── */

  useEffect(() => {
    const onMouseUp = () => setSeeking(false);
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  /* ── Keyboard shortcuts ───────────────────────────────────────────────── */

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          showControlsBriefly();
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(currentTime + 10);
          showControlsBriefly();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(currentTime - 10);
          showControlsBriefly();
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          showControlsBriefly();
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          showControlsBriefly();
          break;
        case "m":
        case "M":
          toggleMute();
          showControlsBriefly();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    togglePlay,
    seek,
    currentTime,
    volume,
    handleVolumeChange,
    toggleMute,
    toggleFullscreen,
    showControlsBriefly,
  ]);

  /* ── Auto-play (muted) ────────────────────────────────────────────────── */

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    v.muted = true;
    setMuted(true);
    v.play().catch(() => {
      // browser blocked autoplay — show big play button
      setShowBigPlay(true);
    });
  }, [src]);

  /* ── Click / double-click on video ────────────────────────────────────── */

  const handleVideoClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      toggleFullscreen();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        togglePlay();
        showControlsBriefly();
      }, 250);
    }
  }, [togglePlay, toggleFullscreen, showControlsBriefly]);

  /* ── Progress ratio ───────────────────────────────────────────────────── */

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  /* ── No source fallback ───────────────────────────────────────────────── */

  if (!src) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center">
            <PlayIcon />
          </div>
          <p className="text-white/60 text-sm">Video not available</p>
          <p className="text-white/40 text-xs">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden group select-none ${
        isFullscreen ? "rounded-none" : ""
      }`}
      onMouseMove={showControlsBriefly}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
        setHoverTime(null);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }}
    >
      {/* ── Video element ─────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
      />

      {/* ── Big play button overlay ───────────────────────────────── */}
      {showBigPlay && !playing && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <LargePlayIcon />
          </div>
        </button>
      )}

      {/* ── Controls overlay ──────────────────────────────────────── */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* ── Seek bar ────────────────────────────────────────────── */}
        <div
          ref={seekBarRef}
          className="relative h-1.5 rounded-full bg-white/20 cursor-pointer mb-3 group/seek hover:h-2.5 transition-all"
          onMouseDown={handleSeekDown}
          onMouseMove={handleSeekBarMouse}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-white/20"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-genesis-500"
            style={{ width: `${progress}%` }}
          />
          {/* Seek thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-genesis-400 shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
          {/* Hover timestamp */}
          {hoverTime !== null && (
            <div
              className="absolute -top-9 bg-surface-overlay text-white text-xs px-2 py-1 rounded pointer-events-none"
              style={{ left: `${hoverX}px`, transform: "translateX(-50%)" }}
            >
              {fmt(hoverTime)}
            </div>
          )}
        </div>

        {/* ── Bottom controls row ─────────────────────────────────── */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-genesis-400 h-1 cursor-pointer hidden sm:block"
              />
            </div>

            {/* Time display */}
            <span className="hidden xs:inline text-xs text-white/70 font-mono tabular-nums ml-1">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>

          {/* Right controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Speed menu */}
            <div className="relative">
              <button
                onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                className="px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-xs font-medium"
                aria-label="Playback speed"
              >
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 sm:right-0 mb-2 bg-surface-overlay border border-surface-border rounded-lg py-1 min-w-[80px] shadow-xl z-50">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`w-full px-3 py-2 sm:py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${
                        speed === s ? "text-genesis-400" : "text-white/80"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality menu */}
            <div className="relative">
              <button
                onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Quality settings"
              >
                <SettingsIcon />
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 sm:right-0 mb-2 bg-surface-overlay border border-surface-border rounded-lg py-1 min-w-[100px] shadow-xl z-50">
                  <div className="px-3 py-1 text-[10px] text-white/40 uppercase tracking-wider">Quality</div>
                  {QUALITIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => changeQuality(q)}
                      className={`w-full px-3 py-2 sm:py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${
                        quality === q ? "text-genesis-400" : "text-white/80"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater toggle — hidden on mobile */}
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className="hidden sm:block p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Theater mode"
            >
              <TheaterIcon />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Title overlay (top) ───────────────────────────────────── */}
      <div
        className={`absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-sm font-medium text-white/80 truncate">{title}</h2>
      </div>
    </div>
  );
}
