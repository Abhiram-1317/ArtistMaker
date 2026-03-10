"use client";

import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";

export function DashboardUserMenu() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-2 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-2.5 w-28 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="flex items-center gap-3 px-2 group">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ?? "User"}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-genesis-700/40"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-genesis-600/20 text-sm font-medium ring-1 ring-genesis-700/40 text-genesis-300">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user.name ?? "User"}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
      <button
        onClick={logout}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-surface-overlay text-gray-500 hover:text-white"
        title="Sign out"
        aria-label="Sign out"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      </button>
    </div>
  );
}
