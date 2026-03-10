// ─────────────────────────────────────────────────────────────────────────────
// NextAuth.js — Configuration
// ─────────────────────────────────────────────────────────────────────────────

import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@genesis/database";

/* ── Demo user for testing without a database ───────────────────────────── */
const DEMO_USER = {
  id: "demo-user-001",
  name: "Demo Director",
  email: "demo@genesis.ai",
  image: null,
  tier: "PRO",
};
const DEMO_PASSWORD = "Demo1234!";
const isDemoMode = process.env.DEMO_MODE === "true";

export const authOptions: AuthOptions = {
  /* ────────── Providers ────────── */
  providers: [
    // Email / password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // ── Demo mode: accept test credentials without database ──
        if (isDemoMode) {
          const emailMatch = credentials.email.toLowerCase() === DEMO_USER.email;
          const passMatch = credentials.password === DEMO_PASSWORD;
          if (emailMatch && passMatch) {
            return DEMO_USER;
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash,
          );

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            name: user.displayName,
            email: user.email,
            image: user.avatarUrl,
            tier: user.subscriptionTier,
          };
        } catch (err: unknown) {
          // If DB is unreachable in demo mode, only allow demo credentials
          if (isDemoMode && err instanceof Error && err.message.includes("Can't reach database")) {
            throw new Error("Invalid email or password. Use demo@genesis.ai / Demo1234!");
          }
          throw err;
        }
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  /* ────────── Session strategy ────────── */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /* ────────── JWT ────────── */
  secret: process.env.NEXTAUTH_SECRET,

  /* ────────── Pages ────────── */
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },

  /* ────────── Callbacks ────────── */
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth: upsert user in database
      if (account?.provider !== "credentials" && user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          if (!existing) {
            const created = await prisma.user.create({
              data: {
                email: user.email.toLowerCase(),
                username: user.email.toLowerCase().split("@")[0] + "_" + Date.now().toString(36),
                displayName: user.name ?? user.email.split("@")[0],
                avatarUrl: user.image,
                subscriptionTier: "FREE",
              },
            });
            user.id = created.id;
            user.tier = created.subscriptionTier;
          } else {
            user.id = existing.id;
            user.tier = existing.subscriptionTier;
            // Update avatar if changed
            if (user.image && user.image !== existing.avatarUrl) {
              await prisma.user.update({
                where: { id: existing.id },
                data: { avatarUrl: user.image },
              });
            }
          }
        } catch {
          // DB unreachable — allow sign-in with defaults in demo mode
          if (isDemoMode) {
            user.id = user.id || "demo-oauth-user";
            user.tier = "PRO";
          } else {
            return false;
          }
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = user.tier;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.tier = token.tier;
      }
      return session;
    },
  },
};
