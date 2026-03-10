// ─────────────────────────────────────────────────────────────────────────────
// Shared API utilities — pagination, caching, etc.
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyReply } from "fastify";
import crypto from "node:crypto";

/**
 * Build a standard pagination response envelope.
 */
export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/**
 * Set an ETag header and handle conditional requests (If-None-Match).
 * Returns true if a 304 was sent (caller should return early).
 */
export function handleETag(
  reply: FastifyReply,
  request: { headers: Record<string, string | string[] | undefined> },
  data: unknown,
): boolean {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(data))
    .digest("hex");
  const etag = `"${hash}"`;

  reply.header("ETag", etag);

  const ifNoneMatch = request.headers["if-none-match"];
  if (ifNoneMatch === etag) {
    reply.status(304).send();
    return true;
  }
  return false;
}

/**
 * Set cache-control headers for short-lived API responses.
 */
export function setCacheHeaders(
  reply: FastifyReply,
  maxAge: number = 60,
  staleWhileRevalidate: number = 120,
) {
  reply.header(
    "Cache-Control",
    `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
}
