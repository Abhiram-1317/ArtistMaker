// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook handler — /api/webhooks/stripe
// Processes Stripe events for credit purchases and subscriptions
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { CREDIT_PACKAGES } from "./credits.js";

export async function stripeWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  // Raw body parsing for signature verification
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => {
      done(null, body);
    },
  );

  fastify.post("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const sig = request.headers["stripe-signature"];
      if (!sig) {
        return reply.status(400).send({ error: "Missing stripe-signature header" });
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret || webhookSecret === "whsec_placeholder") {
        request.log.warn("Stripe webhook secret not configured — skipping webhook");
        return reply.status(200).send({ received: true, note: "webhook secret not configured" });
      }

      let event;
      try {
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
        event = stripe.webhooks.constructEvent(
          request.body as Buffer,
          sig as string,
          webhookSecret,
        );
      } catch (err) {
        request.log.error(err, "Webhook signature verification failed");
        return reply.status(400).send({ error: "Webhook signature verification failed" });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            await handleCheckoutComplete(fastify, event.data.object as unknown as CheckoutSession);
            break;
          }
          case "invoice.paid": {
            await handleInvoicePaid(fastify, event.data.object as unknown as Invoice);
            break;
          }
          case "invoice.payment_failed": {
            await handlePaymentFailed(fastify, event.data.object as unknown as Invoice);
            break;
          }
          default:
            request.log.info(`Unhandled Stripe event: ${event.type}`);
        }
      } catch (err) {
        request.log.error(err, `Error processing webhook event: ${event.type}`);
        return reply.status(500).send({ error: "Webhook processing failed" });
      }

      return reply.status(200).send({ received: true });
    },
  });
}

// ── Handlers ─────────────────────────────────────────────────────────────────

interface CheckoutSession {
  metadata?: Record<string, string> | null;
  customer?: string | { id: string } | null;
}

async function handleCheckoutComplete(fastify: FastifyInstance, session: CheckoutSession) {
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;
  const credits = Number(session.metadata?.credits ?? 0);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  if (!userId || !credits) {
    fastify.log.warn("Checkout session missing metadata");
    return;
  }

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  const description = pkg ? `Purchased ${pkg.label} (${pkg.credits} credits)` : `Purchased ${credits} credits`;

  // Add credits via transaction
  await fastify.prisma.$transaction([
    fastify.prisma.user.update({
      where: { id: userId },
      data: {
        creditsBalance: { increment: credits },
        creditsPurchased: { increment: credits },
      },
    }),
    fastify.prisma.creditTransaction.create({
      data: {
        userId,
        amount: credits,
        type: "PURCHASE",
        status: "CONFIRMED",
        description,
        metadata: { packageId, stripeCustomer: customerId },
      },
    }),
  ]);

  fastify.log.info(`Added ${credits} credits to user ${userId}`);
}

interface Invoice {
  customer?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
}

async function handleInvoicePaid(fastify: FastifyInstance, invoice: Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
  if (!customerId) return;

  const user = await fastify.prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, subscriptionTier: true },
  });

  if (!user) {
    fastify.log.warn(`No user for Stripe customer ${customerId}`);
    return;
  }

  // Determine credits based on tier
  const tierCredits: Record<string, number> = {
    STARTER: 500,
    PRO: 2000,
    ENTERPRISE: 10000,
  };
  const credits = tierCredits[user.subscriptionTier] ?? 0;
  if (!credits) return;

  await fastify.prisma.$transaction([
    fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        creditsBalance: { increment: credits },
        creditsPurchased: { increment: credits },
      },
    }),
    fastify.prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: credits,
        type: "SUBSCRIPTION",
        status: "CONFIRMED",
        description: `Monthly ${user.subscriptionTier} subscription — ${credits} credits`,
        metadata: { stripeCustomer: customerId, subscriptionId: typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id ?? null },
      },
    }),
  ]);

  fastify.log.info(`Subscription renewal: ${credits} credits for user ${user.id}`);
}

async function handlePaymentFailed(fastify: FastifyInstance, invoice: Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
  if (!customerId) return;

  const user = await fastify.prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) return;

  // Downgrade to FREE tier on payment failure
  await fastify.prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: "FREE" },
  });

  fastify.log.warn(`Payment failed for user ${user.id} — downgraded to FREE`);
}
