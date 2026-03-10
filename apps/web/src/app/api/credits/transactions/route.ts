import { NextResponse } from "next/server";

const MOCK_TRANSACTIONS = [
  { id: "tx-1", amount: 2000, type: "PURCHASE", status: "CONFIRMED", description: "Purchased Pro Pack (2,000 credits)", createdAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { id: "tx-2", amount: -45, type: "USAGE", status: "CONFIRMED", description: "Render: Neon Horizon — Scene 3", createdAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
  { id: "tx-3", amount: -120, type: "USAGE", status: "CONFIRMED", description: "Render: Neon Horizon — Final export", createdAt: new Date(Date.now() - 4 * 86400_000).toISOString() },
  { id: "tx-4", amount: 1500, type: "PURCHASE", status: "CONFIRMED", description: "Purchased Creator Pack (1,500 credits)", createdAt: new Date(Date.now() - 10 * 86400_000).toISOString() },
  { id: "tx-5", amount: -85, type: "USAGE", status: "CONFIRMED", description: "Render: Enchanted Realms — Scene 1-5", createdAt: new Date(Date.now() - 12 * 86400_000).toISOString() },
  { id: "tx-6", amount: 50, type: "REFUND", status: "CONFIRMED", description: "Refund: Failed render — Enchanted Realms Scene 4", createdAt: new Date(Date.now() - 13 * 86400_000).toISOString() },
  { id: "tx-7", amount: 100, type: "BONUS", status: "CONFIRMED", description: "Welcome bonus credits", createdAt: new Date(Date.now() - 30 * 86400_000).toISOString() },
  { id: "tx-8", amount: -200, type: "USAGE", status: "CONFIRMED", description: "Render: Street Kings — Full movie", createdAt: new Date(Date.now() - 15 * 86400_000).toISOString() },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const start = (page - 1) * limit;
  const paged = MOCK_TRANSACTIONS.slice(start, start + limit);

  return NextResponse.json({
    transactions: paged,
    pagination: { page, limit, total: MOCK_TRANSACTIONS.length, totalPages: Math.ceil(MOCK_TRANSACTIONS.length / limit) },
  });
}
