"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NextAuth.js — SessionProvider wrapper (client component)
// ─────────────────────────────────────────────────────────────────────────────

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
