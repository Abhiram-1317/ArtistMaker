import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId } = body as { packageId?: string };

    if (!packageId) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 });
    }

    const validIds = ["credits-500", "credits-1500", "credits-3000", "credits-10000"];
    if (!validIds.includes(packageId)) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // In production: create Stripe Checkout session via backend API
    // For now, return a mock success
    return NextResponse.json({
      checkoutUrl: null,
      message: "Stripe not configured — in test mode. Credits would be added after payment.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
