// ─────────────────────────────────────────────────────────────────────────────
// Credit routes — /api/credits
// Balance, transactions, pricing, purchase
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

// ── Credit packages ──────────────────────────────────────────────────────────

export const CREDIT_PACKAGES = [
  { id: "credits-500",   credits: 500,   price: 999,   priceDisplay: "$9.99",   bonus: 0,  label: "Starter Pack" },
  { id: "credits-1500",  credits: 1500,  price: 2499,  priceDisplay: "$24.99",  bonus: 17, label: "Creator Pack" },
  { id: "credits-3000",  credits: 3000,  price: 4499,  priceDisplay: "$44.99",  bonus: 25, label: "Pro Pack" },
  { id: "credits-10000", credits: 10000, price: 12999, priceDisplay: "$129.99", bonus: 35, label: "Studio Pack", bestValue: true },
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: "plan-free",    name: "Free",       tier: "FREE",       priceMonthly: 0,     creditsPerMonth: 50,
    features: ["50 credits/month", "720p rendering", "3 projects", "Community support"],
  },
  {
    id: "plan-starter", name: "Starter",    tier: "STARTER",    priceMonthly: 1999,  creditsPerMonth: 500,
    features: ["500 credits/month", "1080p rendering", "10 projects", "Email support", "Priority queue"],
  },
  {
    id: "plan-pro",     name: "Pro",        tier: "PRO",        priceMonthly: 4999,  creditsPerMonth: 2000,
    features: ["2,000 credits/month", "4K rendering", "Unlimited projects", "Priority support", "Custom styles", "API access"],
    recommended: true,
  },
  {
    id: "plan-enterprise", name: "Enterprise", tier: "ENTERPRISE", priceMonthly: 14999, creditsPerMonth: 10000,
    features: ["10,000 credits/month", "4K+ rendering", "Unlimited everything", "Dedicated support", "Custom models", "SLA guarantee", "Team accounts"],
  },
] as const;

// ── Zod schemas ──────────────────────────────────────────────────────────────

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["PURCHASE", "USAGE", "REFUND", "BONUS", "SUBSCRIPTION"]).optional(),
});

const purchaseSchema = z.object({
  packageId: z.string().min(1, "Package ID is required"),
});

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: "ValidationError",
    message: "Request validation failed",
    statusCode: 400,
    issues: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
  });
}

// ── Route plugin ─────────────────────────────────────────────────────────────

export async function creditRoutes(fastify: FastifyInstance): Promise<void> {
  // All credit routes require auth
  fastify.addHook("preHandler", fastify.authenticate);

  // ──────────────────────────────────────────────────────────────────────────
  // GET /balance — current credit balance
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get("/balance", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;

      try {
        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          select: { creditsBalance: true, creditsPurchased: true, creditsUsed: true, subscriptionTier: true },
        });

        if (!user) {
          return reply.status(404).send({ error: "NotFound", message: "User not found", statusCode: 404 });
        }

        // Count pending transactions
        const pendingResult = await fastify.prisma.creditTransaction.aggregate({
          where: { userId, status: "PENDING", type: "USAGE" },
          _sum: { amount: true },
        });
        const pendingCredits = Math.abs(pendingResult._sum.amount ?? 0);

        return reply.send({
          balance: user.creditsBalance,
          totalPurchased: user.creditsPurchased,
          totalUsed: user.creditsUsed,
          pendingCredits,
          availableBalance: user.creditsBalance - pendingCredits,
          tier: user.subscriptionTier,
        });
      } catch (err) {
        request.log.error(err, "Failed to fetch credit balance");
        return reply.status(500).send({ error: "InternalError", message: "Failed to fetch balance", statusCode: 500 });
      }
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /transactions — credit transaction history
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get("/transactions", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = transactionsQuerySchema.safeParse(request.query);
      if (!parsed.success) return zodError(reply, parsed.error);

      const { page, limit, type } = parsed.data;
      const skip = (page - 1) * limit;
      const userId = request.user.id;

      try {
        const where: Record<string, unknown> = { userId };
        if (type) where.type = type;

        const [transactions, total] = await Promise.all([
          fastify.prisma.creditTransaction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          fastify.prisma.creditTransaction.count({ where }),
        ]);

        return reply.send({
          transactions,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
      } catch (err) {
        request.log.error(err, "Failed to fetch transactions");
        return reply.status(500).send({ error: "InternalError", message: "Failed to fetch transactions", statusCode: 500 });
      }
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // GET /pricing — available packages and plans
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get("/pricing", {
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        packages: CREDIT_PACKAGES,
        plans: SUBSCRIPTION_PLANS,
      });
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // POST /purchase — create Stripe checkout session
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post("/purchase", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = purchaseSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      const { packageId } = parsed.data;
      const userId = request.user.id;

      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) {
        return reply.status(400).send({ error: "InvalidPackage", message: "Invalid package selected", statusCode: 400 });
      }

      try {
        // Dynamic import so the route file compiles even if stripe isn't installed
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

        // Find or create Stripe customer
        let user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, stripeCustomerId: true },
        });

        if (!user) {
          return reply.status(404).send({ error: "NotFound", message: "User not found", statusCode: 404 });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id },
          });
          customerId = customer.id;
          await fastify.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
          });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: pkg.price,
                product_data: {
                  name: `${pkg.label} — ${pkg.credits} credits`,
                  description: pkg.bonus > 0 ? `Includes ${pkg.bonus}% bonus credits` : undefined,
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId,
            packageId: pkg.id,
            credits: String(pkg.credits),
          },
          success_url: process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3000/dashboard?purchase=success",
          cancel_url: process.env.STRIPE_CANCEL_URL ?? "http://localhost:3000/dashboard?purchase=cancelled",
        });

        return reply.send({ checkoutUrl: session.url });
      } catch (err) {
        request.log.error(err, "Failed to create checkout session");
        return reply.status(500).send({ error: "InternalError", message: "Failed to create checkout session", statusCode: 500 });
      }
    },
  });
}
