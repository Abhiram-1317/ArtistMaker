// ─────────────────────────────────────────────────────────────────────────────
// Route registration — aggregates all route modules
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { projectRoutes } from "./projects.js";
import {
  projectCharacterRoutes,
  characterRoutes,
} from "./characters.js";
import {
  projectSceneRoutes,
  sceneShotRoutes,
  shotRoutes,
} from "./scenes.js";
import { adminRoutes } from "./admin.js";
import { creditRoutes } from "./credits.js";
import { stripeWebhookRoutes } from "./webhooks.js";
import { collaborationRoutes } from "./collaboration.js";
import { templateRoutes } from "./templates.js";
import { analyticsRoutes } from "./analytics.js";

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // System routes (health check, ping)
  await fastify.register(healthRoutes);

  // Project CRUD routes
  await fastify.register(projectRoutes, { prefix: "/api/projects" });

  // Character routes (nested under projects + top-level)
  await fastify.register(projectCharacterRoutes, {
    prefix: "/api/projects/:projectId/characters",
  });
  await fastify.register(characterRoutes, { prefix: "/api/characters" });

  // Scene routes (nested under projects) + shot routes
  await fastify.register(projectSceneRoutes, {
    prefix: "/api/projects/:projectId/scenes",
  });
  await fastify.register(sceneShotRoutes, {
    prefix: "/api/scenes/:id/shots",
  });
  await fastify.register(shotRoutes, { prefix: "/api/shots" });

  // Collaboration routes (nested under projects)
  await fastify.register(collaborationRoutes, {
    prefix: "/api/projects/:projectId/collaboration",
  });

  // Credit management routes
  await fastify.register(creditRoutes, { prefix: "/api/credits" });

  // Template routes (browsing + creation)
  await fastify.register(templateRoutes, { prefix: "/api/templates" });

  // Analytics routes (tracking + dashboards)
  await fastify.register(analyticsRoutes, { prefix: "/api/analytics" });

  // Stripe webhook (no auth — verified by signature)
  await fastify.register(stripeWebhookRoutes, { prefix: "/api/webhooks/stripe" });

  // Admin routes (queue monitoring)
  await fastify.register(adminRoutes, { prefix: "/api/admin" });
}
