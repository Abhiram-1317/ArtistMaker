// ─────────────────────────────────────────────────────────────────────────────
// Credit system — types and data fetching for the frontend
// ─────────────────────────────────────────────────────────────────────────────

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  priceDisplay: string;
  bonus: number;
  label: string;
  bestValue?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  creditsPerMonth: number;
  features: string[];
  recommended?: boolean;
}

export interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  pendingCredits: number;
  availableBalance: number;
  tier: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: "PURCHASE" | "USAGE" | "REFUND" | "BONUS" | "SUBSCRIPTION";
  status: "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";
  description: string;
  createdAt: string;
}

/* ── Static data (matches backend) ────────────────────────────────────────── */

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "credits-500",   credits: 500,   price: 999,   priceDisplay: "$9.99",   bonus: 0,  label: "Starter Pack" },
  { id: "credits-1500",  credits: 1500,  price: 2499,  priceDisplay: "$24.99",  bonus: 17, label: "Creator Pack" },
  { id: "credits-3000",  credits: 3000,  price: 4499,  priceDisplay: "$44.99",  bonus: 25, label: "Pro Pack" },
  { id: "credits-10000", credits: 10000, price: 12999, priceDisplay: "$129.99", bonus: 35, label: "Studio Pack", bestValue: true },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
];

/* ── Mock fallback data ───────────────────────────────────────────────────── */

const MOCK_BALANCE: CreditBalance = {
  balance: 1250,
  totalPurchased: 3500,
  totalUsed: 2250,
  pendingCredits: 0,
  availableBalance: 1250,
  tier: "PRO",
};

const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: "tx-1", amount: 2000, type: "PURCHASE", status: "CONFIRMED", description: "Purchased Pro Pack (2,000 credits)", createdAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { id: "tx-2", amount: -45, type: "USAGE", status: "CONFIRMED", description: "Render: Neon Horizon — Scene 3", createdAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
  { id: "tx-3", amount: -120, type: "USAGE", status: "CONFIRMED", description: "Render: Neon Horizon — Final export", createdAt: new Date(Date.now() - 4 * 86400_000).toISOString() },
  { id: "tx-4", amount: 1500, type: "PURCHASE", status: "CONFIRMED", description: "Purchased Creator Pack (1,500 credits)", createdAt: new Date(Date.now() - 10 * 86400_000).toISOString() },
  { id: "tx-5", amount: -85, type: "USAGE", status: "CONFIRMED", description: "Render: Enchanted Realms — Scene 1-5", createdAt: new Date(Date.now() - 12 * 86400_000).toISOString() },
  { id: "tx-6", amount: 50, type: "REFUND", status: "CONFIRMED", description: "Refund: Failed render — Enchanted Realms Scene 4", createdAt: new Date(Date.now() - 13 * 86400_000).toISOString() },
  { id: "tx-7", amount: 100, type: "BONUS", status: "CONFIRMED", description: "Welcome bonus credits", createdAt: new Date(Date.now() - 30 * 86400_000).toISOString() },
  { id: "tx-8", amount: -200, type: "USAGE", status: "CONFIRMED", description: "Render: Street Kings — Full movie", createdAt: new Date(Date.now() - 15 * 86400_000).toISOString() },
];

/* ── API fetchers ─────────────────────────────────────────────────────────── */

export async function getCreditBalance(): Promise<CreditBalance> {
  try {
    const res = await fetch("/api/credits/balance");
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return MOCK_BALANCE;
}

export async function getCreditTransactions(
  page = 1,
  limit = 20,
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  try {
    const res = await fetch(`/api/credits/transactions?page=${page}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      return { transactions: data.transactions, total: data.pagination.total };
    }
  } catch { /* fallback */ }
  return { transactions: MOCK_TRANSACTIONS, total: MOCK_TRANSACTIONS.length };
}

export async function purchaseCredits(packageId: string): Promise<{ checkoutUrl: string } | { error: string }> {
  try {
    const res = await fetch("/api/credits/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    return res.json();
  } catch {
    return { error: "Network error" };
  }
}
