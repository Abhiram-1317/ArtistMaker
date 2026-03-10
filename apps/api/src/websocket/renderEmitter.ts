// ─────────────────────────────────────────────────────────────────────────────
// Render emitter — sends Socket.io events to project rooms
// ─────────────────────────────────────────────────────────────────────────────

import {
  getRenderNamespace,
  type RenderProgressPayload,
  type RenderCompletePayload,
  type RenderErrorPayload,
  type RenderStatusPayload,
} from "./renderSocket.js";

function toRoom(projectId: string): string {
  return `project:${projectId}`;
}

export function emitRenderProgress(
  projectId: string,
  payload: RenderProgressPayload,
): void {
  getRenderNamespace()?.to(toRoom(projectId)).emit("render:progress", payload);
}

export function emitRenderComplete(
  projectId: string,
  payload: RenderCompletePayload,
): void {
  getRenderNamespace()?.to(toRoom(projectId)).emit("render:complete", payload);
}

export function emitRenderError(
  projectId: string,
  payload: RenderErrorPayload,
): void {
  getRenderNamespace()?.to(toRoom(projectId)).emit("render:error", payload);
}

export function emitRenderStatus(
  projectId: string,
  payload: RenderStatusPayload,
): void {
  getRenderNamespace()?.to(toRoom(projectId)).emit("render:status", payload);
}
