// ─────────────────────────────────────────────────────────────────────────────
// Credit deduction service — handles credit reservation, confirmation, refund
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient, Prisma } from "@prisma/client";

export class CreditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Reserve credits before starting a generation.
   * Creates a PENDING transaction and checks sufficient balance.
   * Returns the transaction ID for later confirmation/refund.
   */
  async reserveCredits(
    userId: string,
    amount: number,
    description: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<{ transactionId: string }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true },
      });

      if (!user) {
        throw new InsufficientCreditsError("User not found");
      }

      // Check pending reservations
      const pendingResult = await tx.creditTransaction.aggregate({
        where: { userId, status: "PENDING", type: "USAGE" },
        _sum: { amount: true },
      });
      const pendingAmount = Math.abs(pendingResult._sum.amount ?? 0);
      const available = user.creditsBalance - pendingAmount;

      if (available < amount) {
        throw new InsufficientCreditsError(
          `Insufficient credits. Need ${amount}, available ${available.toFixed(1)}`,
        );
      }

      // Create pending deduction (stored as negative)
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: "USAGE",
          status: "PENDING",
          description,
          metadata: metadata ?? undefined,
        },
      });

      return { transactionId: transaction.id };
    });
  }

  /**
   * Confirm a pending credit reservation after generation completes.
   * Adjusts to actual cost if different from estimated.
   */
  async confirmDeduction(
    transactionId: string,
    actualCost?: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction || transaction.status !== "PENDING") {
        throw new Error(`Transaction ${transactionId} not found or not pending`);
      }

      const estimatedCost = Math.abs(transaction.amount);
      const finalCost = actualCost ?? estimatedCost;

      // Update transaction to confirmed with final cost
      await tx.creditTransaction.update({
        where: { id: transactionId },
        data: {
          amount: -finalCost,
          status: "CONFIRMED",
        },
      });

      // Deduct from user balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          creditsBalance: { decrement: finalCost },
          creditsUsed: { increment: finalCost },
        },
      });
    });
  }

  /**
   * Refund a pending or confirmed credit transaction.
   * Used when generation fails.
   */
  async refundCredits(
    transactionId: string,
    reason?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      if (transaction.status === "REFUNDED") {
        return; // Already refunded
      }

      const refundAmount = Math.abs(transaction.amount);

      // Mark original as refunded
      await tx.creditTransaction.update({
        where: { id: transactionId },
        data: { status: "REFUNDED" },
      });

      // Create refund record
      await tx.creditTransaction.create({
        data: {
          userId: transaction.userId,
          amount: refundAmount,
          type: "REFUND",
          status: "CONFIRMED",
          description: reason ?? `Refund for: ${transaction.description}`,
          metadata: { originalTransactionId: transactionId },
        },
      });

      // Restore balance only if original was confirmed (actual deduction happened)
      if (transaction.status === "CONFIRMED") {
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            creditsBalance: { increment: refundAmount },
            creditsUsed: { decrement: refundAmount },
          },
        });
      }
    });
  }

  /**
   * Check if user has enough credits for an operation.
   */
  async checkBalance(userId: string, requiredCredits: number): Promise<{
    sufficient: boolean;
    balance: number;
    available: number;
    deficit: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditsBalance: true },
    });

    if (!user) {
      return { sufficient: false, balance: 0, available: 0, deficit: requiredCredits };
    }

    const pendingResult = await this.prisma.creditTransaction.aggregate({
      where: { userId, status: "PENDING", type: "USAGE" },
      _sum: { amount: true },
    });
    const pendingAmount = Math.abs(pendingResult._sum.amount ?? 0);
    const available = user.creditsBalance - pendingAmount;

    return {
      sufficient: available >= requiredCredits,
      balance: user.creditsBalance,
      available,
      deficit: Math.max(0, requiredCredits - available),
    };
  }
}

/**
 * Error thrown when user doesn't have enough credits.
 */
export class InsufficientCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}
