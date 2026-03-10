"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useAuth — Type-safe hook for authentication state & actions
// ─────────────────────────────────────────────────────────────────────────────

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useMemo } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  tier: string;
}

export interface UseAuthReturn {
  /** The authenticated user, or null */
  user: AuthUser | null;
  /** Whether the session is currently loading */
  isLoading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Sign in with credentials (email/password) */
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  /** Sign in with a social provider */
  loginWithProvider: (provider: "google" | "github") => Promise<void>;
  /** Sign out and redirect to home */
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      tier: session.user.tier,
    };
  }, [session]);

  const loginWithCredentials = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        return { ok: false, error: result.error };
      }

      return { ok: true };
    },
    [],
  );

  const loginWithProvider = useCallback(
    async (provider: "google" | "github") => {
      await signIn(provider, { callbackUrl: "/dashboard" });
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    loginWithCredentials,
    loginWithProvider,
    logout,
  };
}
