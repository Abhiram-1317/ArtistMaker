// ─────────────────────────────────────────────────────────────────────────────
// Collaboration routes — /api/projects/:projectId/collaboration
// Members, invitations, permissions
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username required"),
  role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
});

const updateMemberSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]).optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canShare: z.boolean().optional(),
});

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: "ValidationError",
    message: "Request validation failed",
    statusCode: 400,
    issues: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
  });
}

// ── Permission defaults per role ─────────────────────────────────────────────

function permissionsForRole(role: "EDITOR" | "VIEWER") {
  if (role === "EDITOR") return { canEdit: true, canDelete: false, canShare: false };
  return { canEdit: false, canDelete: false, canShare: false };
}

// ── Route plugin ─────────────────────────────────────────────────────────────

export async function collaborationRoutes(fastify: FastifyInstance): Promise<void> {
  // All collaboration routes require auth
  fastify.addHook("preHandler", fastify.authenticate);

  // ──────────────────────────────────────────────────────────────────────────
  // GET / — List all members of a project
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get("/", {
    handler: async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
      const { projectId } = request.params;
      const userId = request.user.id;

      try {
        // Verify user has access to this project
        const project = await fastify.prisma.project.findUnique({
          where: { id: projectId },
          select: { userId: true },
        });

        if (!project) {
          return reply.status(404).send({ error: "NotFound", message: "Project not found", statusCode: 404 });
        }

        const isOwner = project.userId === userId;
        const membership = await fastify.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
        });

        if (!isOwner && !membership) {
          return reply.status(403).send({ error: "Forbidden", message: "Not a member of this project", statusCode: 403 });
        }

        // Fetch owner + all members
        const [owner, members] = await Promise.all([
          fastify.prisma.user.findUnique({
            where: { id: project.userId },
            select: { id: true, username: true, displayName: true, avatarUrl: true, email: true },
          }),
          fastify.prisma.projectMember.findMany({
            where: { projectId },
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
              invitedBy: { select: { id: true, username: true, displayName: true } },
            },
            orderBy: { invitedAt: "asc" },
          }),
        ]);

        return reply.send({
          owner: owner ? { ...owner, role: "OWNER" } : null,
          members: members.map((m) => ({
            id: m.id,
            user: m.user,
            role: m.role,
            status: m.status,
            canEdit: m.canEdit,
            canDelete: m.canDelete,
            canShare: m.canShare,
            invitedBy: m.invitedBy,
            invitedAt: m.invitedAt,
            acceptedAt: m.acceptedAt,
          })),
        });
      } catch (err) {
        request.log.error(err, "Failed to fetch project members");
        return reply.status(500).send({ error: "InternalError", message: "Failed to fetch members", statusCode: 500 });
      }
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // POST /invite — Invite user to project
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post("/invite", {
    handler: async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
      const { projectId } = request.params;
      const userId = request.user.id;
      const parsed = inviteSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      const { emailOrUsername, role } = parsed.data;

      try {
        // Verify caller is owner or has share permission
        const project = await fastify.prisma.project.findUnique({
          where: { id: projectId },
          select: { userId: true, title: true },
        });

        if (!project) {
          return reply.status(404).send({ error: "NotFound", message: "Project not found", statusCode: 404 });
        }

        const isOwner = project.userId === userId;
        if (!isOwner) {
          const callerMembership = await fastify.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
          });
          if (!callerMembership || !callerMembership.canShare) {
            return reply.status(403).send({ error: "Forbidden", message: "You don't have permission to invite members", statusCode: 403 });
          }
        }

        // Find the target user by email or username
        const targetUser = await fastify.prisma.user.findFirst({
          where: {
            OR: [
              { email: emailOrUsername },
              { username: emailOrUsername },
            ],
          },
          select: { id: true, username: true, displayName: true, avatarUrl: true, email: true },
        });

        if (!targetUser) {
          return reply.status(404).send({ error: "NotFound", message: "User not found", statusCode: 404 });
        }

        if (targetUser.id === project.userId) {
          return reply.status(400).send({ error: "BadRequest", message: "Cannot invite the project owner", statusCode: 400 });
        }

        // Check for existing membership
        const existing = await fastify.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: targetUser.id } },
        });

        if (existing) {
          if (existing.status === "ACCEPTED") {
            return reply.status(409).send({ error: "Conflict", message: "User is already a member", statusCode: 409 });
          }
          if (existing.status === "PENDING") {
            return reply.status(409).send({ error: "Conflict", message: "Invitation already pending", statusCode: 409 });
          }
        }

        const permissions = permissionsForRole(role);
        const invitation = await fastify.prisma.projectMember.upsert({
          where: { projectId_userId: { projectId, userId: targetUser.id } },
          update: {
            role,
            status: "PENDING",
            invitedById: userId,
            invitedAt: new Date(),
            acceptedAt: null,
            ...permissions,
          },
          create: {
            projectId,
            userId: targetUser.id,
            role,
            status: "PENDING",
            invitedById: userId,
            ...permissions,
          },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
          },
        });

        // In production, send email notification here
        request.log.info(`Invitation sent to ${targetUser.email} for project ${projectId}`);

        return reply.status(201).send({
          invitation: {
            id: invitation.id,
            user: invitation.user,
            role: invitation.role,
            status: invitation.status,
            canEdit: invitation.canEdit,
            canDelete: invitation.canDelete,
            canShare: invitation.canShare,
            invitedAt: invitation.invitedAt,
          },
        });
      } catch (err) {
        request.log.error(err, "Failed to invite user");
        return reply.status(500).send({ error: "InternalError", message: "Failed to send invitation", statusCode: 500 });
      }
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // POST /members/:memberId/accept — Accept invitation
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post("/members/:memberId/accept", {
    handler: async (
      request: FastifyRequest<{ Params: { projectId: string; memberId: string } }>,
      reply: FastifyReply,
    ) => {
      const { projectId, memberId } = request.params;
      const userId = request.user.id;

      try {
        const membership = await fastify.prisma.projectMember.findUnique({
          where: { id: memberId },
        });

        if (!membership || membership.projectId !== projectId) {
          return reply.status(404).send({ error: "NotFound", message: "Invitation not found", statusCode: 404 });
        }

        if (membership.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden", message: "This invitation is not for you", statusCode: 403 });
        }

        if (membership.status === "ACCEPTED") {
          return reply.status(200).send({ message: "Already accepted" });
        }

        if (membership.status !== "PENDING") {
          return reply.status(400).send({ error: "BadRequest", message: "Invitation is no longer valid", statusCode: 400 });
        }

        const updated = await fastify.prisma.projectMember.update({
          where: { id: memberId },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        });

        return reply.send({
          member: {
            id: updated.id,
            user: updated.user,
            role: updated.role,
            canEdit: updated.canEdit,
            canDelete: updated.canDelete,
            canShare: updated.canShare,
            acceptedAt: updated.acceptedAt,
          },
        });
      } catch (err) {
        request.log.error(err, "Failed to accept invitation");
        return reply.status(500).send({ error: "InternalError", message: "Failed to accept invitation", statusCode: 500 });
      }
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE /members/:memberId — Remove member
  // ──────────────────────────────────────────────────────────────────────────

  fastify.delete("/members/:memberId", {
    handler: async (
      request: FastifyRequest<{ Params: { projectId: string; memberId: string } }>,
      reply: FastifyReply,
    ) => {
      const { projectId, memberId } = request.params;
      const userId = request.user.id;

      try {
        const project = await fastify.prisma.project.findUnique({
          where: { id: projectId },
          select: { userId: true },
        });

        if (!project) {
          return reply.status(404).send({ error: "NotFound", message: "Project not found", statusCode: 404 });
        }

        // Only owner can remove members, or user can remove themselves
        const membership = await fastify.prisma.projectMember.findUnique({
          where: { id: memberId },
        });

        if (!membership || membership.projectId !== projectId) {
          return reply.status(404).send({ error: "NotFound", message: "Member not found", statusCode: 404 });
        }

        const isOwner = project.userId === userId;
        const isSelf = membership.userId === userId;

        if (!isOwner && !isSelf) {
          return reply.status(403).send({ error: "Forbidden", message: "Only the owner can remove members", statusCode: 403 });
        }

        await fastify.prisma.projectMember.delete({ where: { id: memberId } });

        return reply.status(204).send();
      } catch (err) {
        request.log.error(err, "Failed to remove member");
        return reply.status(500).send({ error: "InternalError", message: "Failed to remove member", statusCode: 500 });
      }
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PATCH /members/:memberId — Update member role/permissions
  // ──────────────────────────────────────────────────────────────────────────

  fastify.patch("/members/:memberId", {
    handler: async (
      request: FastifyRequest<{ Params: { projectId: string; memberId: string } }>,
      reply: FastifyReply,
    ) => {
      const { projectId, memberId } = request.params;
      const userId = request.user.id;
      const parsed = updateMemberSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      try {
        const project = await fastify.prisma.project.findUnique({
          where: { id: projectId },
          select: { userId: true },
        });

        if (!project || project.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden", message: "Only the owner can update member permissions", statusCode: 403 });
        }

        const membership = await fastify.prisma.projectMember.findUnique({
          where: { id: memberId },
        });

        if (!membership || membership.projectId !== projectId) {
          return reply.status(404).send({ error: "NotFound", message: "Member not found", statusCode: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (parsed.data.role !== undefined) {
          updateData.role = parsed.data.role;
          // Update default permissions for the new role
          const perms = permissionsForRole(parsed.data.role);
          updateData.canEdit = parsed.data.canEdit ?? perms.canEdit;
          updateData.canDelete = parsed.data.canDelete ?? perms.canDelete;
          updateData.canShare = parsed.data.canShare ?? perms.canShare;
        } else {
          if (parsed.data.canEdit !== undefined) updateData.canEdit = parsed.data.canEdit;
          if (parsed.data.canDelete !== undefined) updateData.canDelete = parsed.data.canDelete;
          if (parsed.data.canShare !== undefined) updateData.canShare = parsed.data.canShare;
        }

        const updated = await fastify.prisma.projectMember.update({
          where: { id: memberId },
          data: updateData,
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        });

        return reply.send({
          member: {
            id: updated.id,
            user: updated.user,
            role: updated.role,
            canEdit: updated.canEdit,
            canDelete: updated.canDelete,
            canShare: updated.canShare,
          },
        });
      } catch (err) {
        request.log.error(err, "Failed to update member");
        return reply.status(500).send({ error: "InternalError", message: "Failed to update member", statusCode: 500 });
      }
    },
  });
}
