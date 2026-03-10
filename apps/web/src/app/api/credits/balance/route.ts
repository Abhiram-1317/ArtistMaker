import { NextResponse } from "next/server";
import type { CreditBalance } from "@/lib/credits-data";

export async function GET() {
  // In production: forward to backend API with user's auth token
  // const session = await getServerSession(authOptions);
  // const res = await fetch(`${API_URL}/api/credits/balance`, { headers: { Authorization: ... } });

  const mockBalance: CreditBalance = {
    balance: 1250,
    totalPurchased: 3500,
    totalUsed: 2250,
    pendingCredits: 0,
    availableBalance: 1250,
    tier: "PRO",
  };

  return NextResponse.json(mockBalance);
}
