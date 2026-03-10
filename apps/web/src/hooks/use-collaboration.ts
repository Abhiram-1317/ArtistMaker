"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface CollabUser {
  id: string;
  email: string;
  displayName?: string;
  color: string;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  element?: string;
}

export interface EditLock {
  elementId: string;
  userId: string;
  displayName: string;
  elementType: string;
}

export interface CollaborationState {
  isConnected: boolean;
  activeUsers: CollabUser[];
  cursors: Map<string, CursorPosition>;
  editLocks: Map<string, EditLock>;
  error: string | null;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Hook
 * ══════════════════════════════════════════════════════════════════════════════ */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function useCollaboration(projectId: string | null, token: string | null) {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    activeUsers: [],
    cursors: new Map(),
    editLocks: new Map(),
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const projectIdRef = useRef(projectId);

  // Keep ref in sync
  projectIdRef.current = projectId;

  // ── Connect / Disconnect ────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId || !token) return;

    const socket = io(`${WS_URL}/collaboration`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setState((s) => ({ ...s, isConnected: true, error: null }));

      socket.emit(
        "join:project",
        { projectId },
        (res: { ok: boolean; error?: string; users?: CollabUser[]; locks?: EditLock[] }) => {
          if (res.ok) {
            setState((s) => {
              const lockMap = new Map<string, EditLock>();
              for (const lock of res.locks ?? []) {
                lockMap.set(lock.elementId, lock);
              }
              return {
                ...s,
                activeUsers: res.users ?? [],
                editLocks: lockMap,
              };
            });
          } else {
            setState((s) => ({ ...s, error: res.error ?? "Failed to join project" }));
          }
        },
      );
    });

    socket.on("disconnect", () => {
      setState((s) => ({ ...s, isConnected: false }));
    });

    socket.on("connect_error", (err) => {
      setState((s) => ({ ...s, error: err.message, isConnected: false }));
    });

    // ── Incoming events ─────────────────────────────────────────────────

    socket.on("user:joined", (user: CollabUser) => {
      setState((s) => {
        if (s.activeUsers.some((u) => u.id === user.id)) return s;
        return { ...s, activeUsers: [...s.activeUsers, user] };
      });
    });

    socket.on("user:left", (data: { userId: string }) => {
      setState((s) => {
        const cursors = new Map(s.cursors);
        cursors.delete(data.userId);
        const locks = new Map(s.editLocks);
        for (const [key, lock] of locks) {
          if (lock.userId === data.userId) locks.delete(key);
        }
        return {
          ...s,
          activeUsers: s.activeUsers.filter((u) => u.id !== data.userId),
          cursors,
          editLocks: locks,
        };
      });
    });

    socket.on("cursor:move", (data: CursorPosition) => {
      setState((s) => {
        const cursors = new Map(s.cursors);
        cursors.set(data.userId, data);
        return { ...s, cursors };
      });
    });

    socket.on("edit:start", (data: EditLock) => {
      setState((s) => {
        const locks = new Map(s.editLocks);
        locks.set(data.elementId, data);
        return { ...s, editLocks: locks };
      });
    });

    socket.on("edit:end", (data: { userId: string; elementId: string }) => {
      setState((s) => {
        const locks = new Map(s.editLocks);
        locks.delete(data.elementId);
        return { ...s, editLocks: locks };
      });
    });

    socket.on("selection:change", (data: { userId: string; elementId: string | null; elementType: string | null }) => {
      setState((s) => {
        const cursors = new Map(s.cursors);
        if (data.elementId) {
          cursors.set(data.userId, {
            userId: data.userId,
            x: 0,
            y: 0,
            element: data.elementId,
          });
        }
        return { ...s, cursors };
      });
    });

    return () => {
      socket.emit("leave:project", { projectId });
      socket.disconnect();
      socketRef.current = null;
      setState({
        isConnected: false,
        activeUsers: [],
        cursors: new Map(),
        editLocks: new Map(),
        error: null,
      });
    };
  }, [projectId, token]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const moveCursor = useCallback((x: number, y: number, element?: string) => {
    socketRef.current?.emit("cursor:move", { x, y, element });
  }, []);

  const changeSelection = useCallback((elementId: string | null, elementType: string | null) => {
    socketRef.current?.emit("selection:change", { elementId, elementType });
  }, []);

  const startEdit = useCallback(
    (elementId: string, elementType: "script" | "scene" | "character" | "shot"): Promise<{ ok: boolean; error?: string; lockedBy?: string }> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          resolve({ ok: false, error: "Not connected" });
          return;
        }
        socketRef.current.emit(
          "edit:start",
          { elementId, elementType },
          (res: { ok: boolean; error?: string; lockedBy?: string }) => {
            resolve(res);
          },
        );
      });
    },
    [],
  );

  const endEdit = useCallback((elementId: string) => {
    socketRef.current?.emit("edit:end", { elementId });
    setState((s) => {
      const locks = new Map(s.editLocks);
      locks.delete(elementId);
      return { ...s, editLocks: locks };
    });
  }, []);

  const broadcastScriptChange = useCallback((content: string, cursorPosition?: number, version?: number) => {
    socketRef.current?.emit("change:script", { content, cursorPosition, version: version ?? 1 });
  }, []);

  const broadcastSceneChange = useCallback((sceneId: string, changes: Record<string, unknown>, version?: number) => {
    socketRef.current?.emit("change:scene", { sceneId, changes, version: version ?? 1 });
  }, []);

  const broadcastCharacterChange = useCallback((characterId: string, changes: Record<string, unknown>, version?: number) => {
    socketRef.current?.emit("change:character", { characterId, changes, version: version ?? 1 });
  }, []);

  const syncPlayhead = useCallback((position: number) => {
    socketRef.current?.emit("playhead:sync", { position });
  }, []);

  // ── Script / scene / character change listeners ─────────────────────────

  const onScriptChange = useCallback((handler: (data: { userId: string; content: string; cursorPosition?: number; version: number }) => void) => {
    socketRef.current?.on("change:script", handler);
    return () => { socketRef.current?.off("change:script", handler); };
  }, []);

  const onSceneChange = useCallback((handler: (data: { userId: string; sceneId: string; changes: Record<string, unknown>; version: number }) => void) => {
    socketRef.current?.on("change:scene", handler);
    return () => { socketRef.current?.off("change:scene", handler); };
  }, []);

  const onCharacterChange = useCallback((handler: (data: { userId: string; characterId: string; changes: Record<string, unknown>; version: number }) => void) => {
    socketRef.current?.on("change:character", handler);
    return () => { socketRef.current?.off("change:character", handler); };
  }, []);

  const onPlayheadSync = useCallback((handler: (data: { userId: string; position: number }) => void) => {
    socketRef.current?.on("playhead:sync", handler);
    return () => { socketRef.current?.off("playhead:sync", handler); };
  }, []);

  const onSelectionChange = useCallback((handler: (data: { userId: string; elementId: string | null; elementType: string | null }) => void) => {
    socketRef.current?.on("selection:change", handler);
    return () => { socketRef.current?.off("selection:change", handler); };
  }, []);

  return {
    ...state,
    moveCursor,
    changeSelection,
    startEdit,
    endEdit,
    broadcastScriptChange,
    broadcastSceneChange,
    broadcastCharacterChange,
    syncPlayhead,
    onScriptChange,
    onSceneChange,
    onCharacterChange,
    onPlayheadSync,
    onSelectionChange,
  };
}
