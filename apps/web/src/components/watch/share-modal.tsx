"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════════ */

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  movieTitle: string;
  movieId: string;
  isPro?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Icons
 * ══════════════════════════════════════════════════════════════════════════════ */

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════════
 *  Component
 * ══════════════════════════════════════════════════════════════════════════════ */

export default function ShareModal({
  open,
  onClose,
  movieTitle,
  movieId,
  isPro = false,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/watch/${encodeURIComponent(movieId)}`
    : `/watch/${encodeURIComponent(movieId)}`;

  const embedCode = `<iframe src="${shareUrl}?embed=1" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(movieTitle);

  const socialLinks = [
    {
      name: "Twitter",
      color: "#1DA1F2",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      color: "#4267B2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
        </svg>
      ),
    },
    {
      name: "Reddit",
      color: "#FF5700",
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M14.238 15.348c.085.084.085.221 0 .306-.465.462-1.194.687-2.231.687l-.008-.002-.008.002c-1.036 0-1.766-.225-2.231-.688-.085-.084-.085-.221 0-.305.084-.084.222-.084.307 0 .379.377 1.008.561 1.924.561l.008.002.008-.002c.915 0 1.544-.184 1.924-.561.085-.084.223-.084.307 0zm-3.44-2.418c0-.507-.414-.919-.922-.919-.509 0-.922.412-.922.919 0 .506.414.918.922.918.508.001.922-.411.922-.918zm4.326-.919c-.508 0-.922.412-.922.919 0 .506.414.918.922.918.509 0 .922-.412.922-.918 0-.507-.413-.919-.922-.919zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.8 11.33c.02.14.03.29.03.44 0 2.24-2.61 4.06-5.83 4.06s-5.83-1.82-5.83-4.06c0-.15.01-.3.03-.44-.51-.23-.86-.74-.86-1.33 0-.83.67-1.5 1.5-1.5.39 0 .74.15 1.01.39 1-.7 2.36-1.12 3.85-1.18l.72-3.37.01-.01c.03-.14.16-.24.3-.22l2.38.49c.17-.36.55-.61.98-.61.61 0 1.11.5 1.11 1.11 0 .61-.5 1.11-1.11 1.11-.6 0-1.09-.49-1.11-1.09l-2.14-.45-.64 3.01c1.46.07 2.79.5 3.78 1.18.27-.24.63-.39 1.01-.39.83 0 1.5.67 1.5 1.5 0 .59-.35 1.1-.86 1.33z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      color: "#0077B5",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
  ];

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [shareUrl]);

  const copyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [embedCode]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm sm:max-w-md bg-surface-raised border border-surface-border rounded-2xl shadow-2xl p-4 xs:p-5 sm:p-6 space-y-4 sm:space-y-5 mx-3 xs:mx-4 sm:mx-auto animate-fade-in-up"
        role="dialog"
        aria-label="Share movie"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-bold text-white">Share</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Share link */}
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
                className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-white/80 truncate"
            />
            <button
              onClick={copyLink}
              className="px-3 py-2 rounded-lg bg-genesis-600 hover:bg-genesis-500 transition-colors text-white text-sm flex items-center gap-1.5"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Social buttons */}
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
            Share on Social Media
          </label>
          <div className="grid grid-cols-4 gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </div>
                <span className="text-[10px] text-white/50">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Embed code (Pro only) */}
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            Embed Code
            {!isPro && (
              <span className="px-1.5 py-0.5 rounded bg-genesis-900/50 text-genesis-400 text-[9px] font-bold uppercase">
                Pro
              </span>
            )}
          </label>
          {isPro ? (
            <div className="flex gap-2">
              <textarea
                readOnly
                value={embedCode}
                rows={2}
                className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-xs text-white/60 font-mono resize-none"
              />
              <button
                onClick={copyEmbed}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 text-sm self-start"
              >
                {embedCopied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          ) : (
            <div className="bg-surface-overlay border border-surface-border rounded-lg p-3 text-center">
              <p className="text-xs text-white/40">
                Upgrade to Pro to get embeddable player code
              </p>
            </div>
          )}
        </div>

        {/* QR Code placeholder */}
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
            QR Code
          </label>
          <div className="bg-white rounded-xl p-4 w-fit mx-auto">
            <div className="w-32 h-32 bg-black/5 rounded-lg flex items-center justify-center">
              {/* QR rendered as a stylized placeholder — in production use a QR library */}
              <svg viewBox="0 0 100 100" className="w-28 h-28">
                <rect x="10" y="10" width="25" height="25" fill="#111" />
                <rect x="65" y="10" width="25" height="25" fill="#111" />
                <rect x="10" y="65" width="25" height="25" fill="#111" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="19" y="19" width="7" height="7" fill="#111" />
                <rect x="74" y="19" width="7" height="7" fill="#111" />
                <rect x="19" y="74" width="7" height="7" fill="#111" />
                <rect x="40" y="10" width="5" height="5" fill="#111" />
                <rect x="50" y="10" width="5" height="5" fill="#111" />
                <rect x="40" y="20" width="5" height="5" fill="#111" />
                <rect x="45" y="25" width="5" height="5" fill="#111" />
                <rect x="10" y="40" width="5" height="5" fill="#111" />
                <rect x="20" y="45" width="5" height="5" fill="#111" />
                <rect x="40" y="40" width="5" height="5" fill="#111" />
                <rect x="50" y="40" width="5" height="5" fill="#111" />
                <rect x="60" y="40" width="5" height="5" fill="#111" />
                <rect x="45" y="50" width="5" height="5" fill="#111" />
                <rect x="55" y="50" width="5" height="5" fill="#111" />
                <rect x="45" y="60" width="5" height="5" fill="#111" />
                <rect x="60" y="60" width="5" height="5" fill="#111" />
                <rect x="70" y="50" width="5" height="5" fill="#111" />
                <rect x="80" y="60" width="5" height="5" fill="#111" />
                <rect x="65" y="70" width="5" height="5" fill="#111" />
                <rect x="75" y="75" width="5" height="5" fill="#111" />
                <rect x="85" y="70" width="5" height="5" fill="#111" />
                <rect x="80" y="80" width="5" height="5" fill="#111" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-white/30 text-center mt-1.5">
            Scan to watch on mobile
          </p>
        </div>
      </div>
    </div>
  );
}
