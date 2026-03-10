// ─────────────────────────────────────────────────────────────────────────────
// WebSocket collaboration namespace — real-time editing via Socket.io
// Namespace: /collaboration
// ─────────────────────────────────────────────────────────────────────────────

import type { Server, Namespace, Socket } from "socket.io";
import { createVerifier } from "fast-jwt";
import { env } from "../config/env.js";
import type { JwtPayload } from "../types/index.js";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Event payload types
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface CollabUser {
  id: string;
  email: string;
  displayName?: string;
  color: string;
}

export interface CursorMovePayload {
  userId: string;
  x: number;
  y: number;
  element?: string;
}

export interface SelectionChangePayload {
  userId: string;
  elementId: string | null;
  elementType: string | null;
}

export interface EditLockPayload {
  userId: string;
  elementId: string;
  elementType: "script" | "scene" | "character" | "shot";
  displayName: string;
}

export interface EditUnlockPayload {
  userId: string;
  elementId: string;
}

export interface ScriptChangePayload {
  userId: string;
  content: string;
  cursorPosition?: number;
  version: number;
}

export interface SceneChangePayload {
  userId: string;
  sceneId: string;
  changes: Record<string, unknown>;
  version: number;
}

export interface CharacterChangePayload {
  userId: string;
  characterId: string;
  changes: Record<string, unknown>;
  version: number;
}

export interface PlayheadPayload {
  userId: string;
  position: number;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Collaboration state — in-memory (per-room)
 * ══════════════════════════════════════════════════════════════════════════════ */

/** Active users per project room */
const activeUsers = new Map<string, Map<string, CollabUser>>();

/** Edit locks: projectId → elementId → userId */
const editLocks = new Map<string, Map<string, { userId: string; displayName: string; elementType: string; lockedAt: number }>>();

/** Assign distinct colors to users */
const USER_COLORS = [
  "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#a855f7",
];

function getUserColor(projectId: string): string {
  const room = activeUsers.get(projectId);
  const usedColors = room ? Array.from(room.values()).map((u) => u.color) : [];
  return USER_COLORS.find((c) => !usedColors.includes(c)) ?? USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function getRoomId(projectId: string): string {
  return `collab:${projectId}`;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Lock management helpers
 * ══════════════════════════════════════════════════════════════════════════════ */

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function acquireLock(
  projectId: string,
  elementId: string,
  userId: string,
  displayName: string,
  elementType: string,
): boolean {
  let projectLocks = editLocks.get(projectId);
  if (!projectLocks) {
    projectLocks = new Map();
    editLocks.set(projectId, projectLocks);
  }

  const existing = projectLocks.get(elementId);
  if (existing && existing.userId !== userId) {
    // Check if lock has expired
    if (Date.now() - existing.lockedAt < LOCK_TIMEOUT_MS) {
      return false; // Lock held by another user
    }
  }

  projectLocks.set(elementId, { userId, displayName, elementType, lockedAt: Date.now() });
  return true;
}

function releaseLock(projectId: string, elementId: string, userId: string): boolean {
  const projectLocks = editLocks.get(projectId);
  if (!projectLocks) return false;

  const lock = projectLocks.get(elementId);
  if (!lock || lock.userId !== userId) return false;

  projectLocks.delete(elementId);
  if (projectLocks.size === 0) editLocks.delete(projectId);
  return true;
}

function releaseAllLocks(projectId: string, userId: string): string[] {
  const projectLocks = editLocks.get(projectId);
  if (!projectLocks) return [];

  const released: string[] = [];
  for (const [elementId, lock] of projectLocks) {
    if (lock.userId === userId) {
      projectLocks.delete(elementId);
      released.push(elementId);
    }
  }
  if (projectLocks.size === 0) editLocks.delete(projectId);
  return released;
}

function getLocksForProject(projectId: string): Array<{ elementId: string; userId: string; displayName: string; elementType: string }> {
  const projectLocks = editLocks.get(projectId);
  if (!projectLocks) return [];
  return Array.from(projectLocks.entries()).map(([elementId, lock]) => ({
    elementId,
    userId: lock.userId,
    displayName: lock.displayName,
    elementType: lock.elementType,
  }));
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Socket auth data
 * ══════════════════════════════════════════════════════════════════════════════ */

interface AuthenticatedCollabSocket extends Socket {
  data: {
    user: JwtPayload;
    projectId?: string;
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  /collaboration namespace setup
 * ══════════════════════════════════════════════════════════════════════════════ */

let collabNamespace: Namespace | null = null;

export function getCollabNamespace(): Namespace | null {
  return collabNamespace;
}

export function setupCollaborationSocket(io: Server): Namespace {
  const nsp = io.of("/collaboration");
  collabNamespace = nsp;

  // ── JWT authentication middleware ────────────────────────────────────────
  const verify = createVerifier({ key: env.JWT_SECRET });

  nsp.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verify(token) as JwtPayload;
      (socket as AuthenticatedCollabSocket).data.user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection handler ──────────────────────────────────────────────────
  nsp.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedCollabSocket;
    const user = authSocket.data.user;

    console.log(`🤝 [Collab] User ${user.id} connected`);

    // ── join:project — subscribe to collaboration room ───────────────────
    socket.on(
      "join:project",
      (data: { projectId: string }, ack?: (res: { ok: boolean; error?: string; users?: CollabUser[]; locks?: ReturnType<typeof getLocksForProject> }) => void) => {
        const { projectId } = data;
        if (!projectId || typeof projectId !== "string") {
          ack?.({ ok: false, error: "projectId is required" });
          return;
        }

        const room = getRoomId(projectId);
        socket.join(room);
        authSocket.data.projectId = projectId;

        // NOTE: In production, verify the user has access to this project
        // by checking project ownership or ProjectMember table. For now,
        // the JWT already proves identity and REST routes enforce membership.

        // Register active user
        if (!activeUsers.has(projectId)) {
          activeUsers.set(projectId, new Map());
        }

        const collabUser: CollabUser = {
          id: user.id,
          email: user.email,
          displayName: user.email.split("@")[0],
          color: getUserColor(projectId),
        };

        activeUsers.get(projectId)!.set(user.id, collabUser);

        // Broadcast to others in the room
        socket.to(room).emit("user:joined", collabUser);

        // Send current state to the joining user
        const currentUsers = Array.from(activeUsers.get(projectId)!.values());
        const currentLocks = getLocksForProject(projectId);

        ack?.({ ok: true, users: currentUsers, locks: currentLocks });

        console.log(`🤝 [Collab] User ${user.id} joined project ${projectId} (${currentUsers.length} active)`);
      },
    );

    // ── leave:project — unsubscribe from collaboration room ──────────────
    socket.on("leave:project", (data: { projectId: string }) => {
      handleLeaveProject(socket, authSocket, data.projectId);
    });

    // ── cursor:move — broadcast cursor position ──────────────────────────
    socket.on("cursor:move", (data: { x: number; y: number; element?: string }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      const payload: CursorMovePayload = {
        userId: user.id,
        x: data.x,
        y: data.y,
        element: data.element,
      };

      socket.to(getRoomId(projectId)).emit("cursor:move", payload);
    });

    // ── selection:change — broadcast selection ───────────────────────────
    socket.on("selection:change", (data: { elementId: string | null; elementType: string | null }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      const payload: SelectionChangePayload = {
        userId: user.id,
        elementId: data.elementId,
        elementType: data.elementType,
      };

      socket.to(getRoomId(projectId)).emit("selection:change", payload);
    });

    // ── edit:start — request lock on an element ──────────────────────────
    socket.on(
      "edit:start",
      (
        data: { elementId: string; elementType: "script" | "scene" | "character" | "shot" },
        ack?: (res: { ok: boolean; error?: string; lockedBy?: string }) => void,
      ) => {
        const projectId = authSocket.data.projectId;
        if (!projectId) {
          ack?.({ ok: false, error: "Not in a project room" });
          return;
        }

        const displayName = user.email.split("@")[0];
        const acquired = acquireLock(projectId, data.elementId, user.id, displayName, data.elementType);

        if (!acquired) {
          const lockHolder = editLocks.get(projectId)?.get(data.elementId);
          ack?.({ ok: false, error: "Element is locked", lockedBy: lockHolder?.displayName });
          return;
        }

        const payload: EditLockPayload = {
          userId: user.id,
          elementId: data.elementId,
          elementType: data.elementType,
          displayName,
        };

        socket.to(getRoomId(projectId)).emit("edit:start", payload);
        ack?.({ ok: true });
      },
    );

    // ── edit:end — release lock on an element ────────────────────────────
    socket.on("edit:end", (data: { elementId: string }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      const released = releaseLock(projectId, data.elementId, user.id);
      if (released) {
        const payload: EditUnlockPayload = { userId: user.id, elementId: data.elementId };
        socket.to(getRoomId(projectId)).emit("edit:end", payload);
      }
    });

    // ── change:script — broadcast script changes ─────────────────────────
    socket.on("change:script", (data: { content: string; cursorPosition?: number; version: number }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      // Verify the sender holds the script lock
      const projectLocks = editLocks.get(projectId);
      const scriptLock = projectLocks?.get("script");
      if (!scriptLock || scriptLock.userId !== user.id) {
        // Allow broadcast if no lock system is in use for scripts (lock is optional)
        // but log a warning for debugging
        console.warn(`[Collab] User ${user.id} broadcasting script change without lock`);
      }

      const payload: ScriptChangePayload = {
        userId: user.id,
        content: data.content,
        cursorPosition: data.cursorPosition,
        version: data.version,
      };

      socket.to(getRoomId(projectId)).emit("change:script", payload);
    });

    // ── change:scene — broadcast scene changes ───────────────────────────
    socket.on("change:scene", (data: { sceneId: string; changes: Record<string, unknown>; version: number }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      const payload: SceneChangePayload = {
        userId: user.id,
        sceneId: data.sceneId,
        changes: data.changes,
        version: data.version,
      };

      socket.to(getRoomId(projectId)).emit("change:scene", payload);
    });

    // ── change:character — broadcast character changes ────────────────────
    socket.on("change:character", (data: { characterId: string; changes: Record<string, unknown>; version: number }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      const payload: CharacterChangePayload = {
        userId: user.id,
        characterId: data.characterId,
        changes: data.changes,
        version: data.version,
      };

      socket.to(getRoomId(projectId)).emit("change:character", payload);
    });

    // ── playhead:sync — broadcast playhead position ──────────────────────
    socket.on("playhead:sync", (data: { position: number }) => {
      const projectId = authSocket.data.projectId;
      if (!projectId) return;

      const payload: PlayheadPayload = { userId: user.id, position: data.position };
      socket.to(getRoomId(projectId)).emit("playhead:sync", payload);
    });

    // ── disconnect — cleanup ─────────────────────────────────────────────
    socket.on("disconnect", () => {
      const projectId = authSocket.data.projectId;
      if (projectId) {
        handleLeaveProject(socket, authSocket, projectId);
      }
      console.log(`🤝 [Collab] User ${user.id} disconnected`);
    });
  });

  return nsp;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function handleLeaveProject(socket: Socket, authSocket: AuthenticatedCollabSocket, projectId: string) {
  const room = getRoomId(projectId);
  const userId = authSocket.data.user.id;

  socket.leave(room);

  // Release all edit locks
  const releasedElements = releaseAllLocks(projectId, userId);
  for (const elementId of releasedElements) {
    socket.to(room).emit("edit:end", { userId, elementId });
  }

  // Remove from active users
  const projectUsers = activeUsers.get(projectId);
  if (projectUsers) {
    projectUsers.delete(userId);
    if (projectUsers.size === 0) {
      activeUsers.delete(projectId);
    }
  }

  // Broadcast departure
  socket.to(room).emit("user:left", { userId });

  authSocket.data.projectId = undefined;
}
