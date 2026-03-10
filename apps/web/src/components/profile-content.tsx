"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProfileData } from "@/lib/profile-data";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const TIER_STYLES: Record<string, { label: string; cls: string }> = {
  FREE: { label: "Free", cls: "bg-surface-700 text-surface-300" },
  STARTER: { label: "Starter", cls: "bg-blue-900/60 text-blue-300" },
  PRO: { label: "Pro", cls: "bg-genesis-900/60 text-genesis-300" },
  ENTERPRISE: { label: "Enterprise", cls: "bg-yellow-900/60 text-yellow-300" },
};

/* ── SVG Icons ────────────────────────────────────────────────────────────── */

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

/* ── Edit Modal ───────────────────────────────────────────────────────────── */

function EditProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: ProfileData["user"];
  onClose: () => void;
  onSaved: (updated: ProfileData["user"]) => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, bio, avatarUrl: avatarUrl || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
        return;
      }
      const updated = { ...user, displayName, username, bio, avatarUrl: avatarUrl || null };
      onSaved(updated);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit Profile">
      <div className="glass w-full max-w-sm sm:max-w-lg mx-3 xs:mx-4 sm:mx-auto rounded-2xl p-4 xs:p-5 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-surface-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-300 text-sm rounded-lg p-3">{error}</div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-surface-300 mb-1 block">Display Name</span>
            <input
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-genesis-500 transition-colors"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          </label>
          <label className="block">
            <span className="text-sm text-surface-300 mb-1 block">Username</span>
            <input
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-genesis-500 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
            />
          </label>
          <label className="block">
            <span className="text-sm text-surface-300 mb-1 block">Bio</span>
            <textarea
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-genesis-500 transition-colors resize-none"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
            />
          </label>
          <label className="block">
            <span className="text-sm text-surface-300 mb-1 block">Avatar URL</span>
            <input
              className="w-full bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-genesis-500 transition-colors"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim() || !username.trim()}
            className="flex-1 bg-genesis-600 hover:bg-genesis-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-surface-700 hover:bg-surface-600 text-surface-300 font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Movie Card ───────────────────────────────────────────────────────────── */

function MovieCard({ movie }: { movie: ProfileData["movies"][number] }) {
  return (
    <Link href={`/watch/${movie.id}`} className="group block">
      <div className="glass-hover rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
        <div className="aspect-video bg-surface-800 relative">
          {movie.thumbnailUrl ? (
            <Image src={movie.thumbnailUrl} alt={movie.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-genesis-900/40 to-surface-900 flex items-center justify-center">
              <FilmIcon />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5 text-xs text-surface-300">
            {Math.floor(movie.totalDuration / 60)}:{(movie.totalDuration % 60).toString().padStart(2, "0")}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-white truncate">{movie.title}</h3>
          <p className="text-sm text-surface-400 mt-1 line-clamp-2">{movie.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
            <span>{fmtNumber(movie.views)} views</span>
            <span>{fmtNumber(movie.likes)} likes</span>
            <span>{movie.scenesCount} scenes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function ProfileContent({ data }: { data: ProfileData }) {
  const [user, setUser] = useState(data.user);
  const [editing, setEditing] = useState(false);

  const tier = TIER_STYLES[user.subscriptionTier] ?? TIER_STYLES.FREE;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-genesis-500 to-neon-500 flex items-center justify-center text-2xl sm:text-3xl font-heading font-bold text-white shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.displayName} fill sizes="96px" className="rounded-full object-cover" />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-heading font-bold text-white">{user.displayName}</h1>
              <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${tier.cls}`}>
                {tier.label}
              </span>
            </div>
            <p className="text-surface-400 mt-0.5">@{user.username}</p>
            {user.bio && <p className="text-surface-300 mt-2 max-w-xl">{user.bio}</p>}
            <p className="text-surface-500 text-sm mt-2">Joined {fmtDate(user.createdAt)}</p>

            {data.isOwnProfile && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="text-sm text-surface-300">
                  <span className="text-white font-medium">{user.creditsBalance.toLocaleString()}</span> credits
                </span>
                <span className="text-surface-600">•</span>
                <span className="text-sm text-surface-300">{user.email}</span>
              </div>
            )}
          </div>

          {/* Edit button */}
          {data.isOwnProfile && (
            <button
              onClick={() => setEditing(true)}
              className="glass-hover rounded-lg px-4 py-2 text-sm text-surface-300 hover:text-white transition-colors flex items-center gap-2 shrink-0"
            >
              <PencilIcon />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <FilmIcon />, label: "Movies", value: user.projectCount },
          { icon: <EyeIcon />, label: "Total Views", value: user.totalViews },
          { icon: <HeartIcon />, label: "Total Likes", value: user.totalLikes },
          { icon: <UsersIcon />, label: "Subscribers", value: user.subscriberCount },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <div className="flex justify-center text-genesis-400 mb-2">{stat.icon}</div>
            <p className="text-xl font-heading font-bold text-white">{fmtNumber(stat.value)}</p>
            <p className="text-sm text-surface-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Movies */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-white mb-4">
          {data.isOwnProfile ? "Your Movies" : "Movies"}
        </h2>
        {data.movies.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <FilmIcon />
            <p className="text-surface-400 mt-4">No movies yet</p>
            {data.isOwnProfile && (
              <Link
                href="/dashboard/projects"
                className="mt-4 inline-block bg-genesis-600 hover:bg-genesis-500 text-white rounded-lg px-4 py-2 text-sm transition-colors"
              >
                Create Your First Movie
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditProfileModal
          user={user}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setUser(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-surface-700" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 bg-surface-700 rounded" />
            <div className="h-4 w-32 bg-surface-700 rounded" />
            <div className="h-4 w-64 bg-surface-700 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2">
            <div className="h-5 w-5 bg-surface-700 rounded mx-auto" />
            <div className="h-6 w-16 bg-surface-700 rounded mx-auto" />
            <div className="h-4 w-20 bg-surface-700 rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 w-32 bg-surface-700 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <div className="aspect-video bg-surface-700" />
              <div className="p-3 space-y-2">
                <div className="h-5 w-3/4 bg-surface-700 rounded" />
                <div className="h-4 w-full bg-surface-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
