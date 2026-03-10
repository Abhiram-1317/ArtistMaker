import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let watchTime = 0;
  try {
    const body = await request.json();
    watchTime = typeof body?.watchTime === "number" ? body.watchTime : 0;
  } catch {
    // sendBeacon may send empty body
  }

  // In production: store analytics event
  // await prisma.analyticsEvent.create({ data: { projectId: id, type: 'WATCH_TIME', value: watchTime } })

  return NextResponse.json({ success: true, movieId: id, watchTime });
}
