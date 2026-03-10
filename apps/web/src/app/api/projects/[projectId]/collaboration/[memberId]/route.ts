import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> },
) {
  const { memberId } = await params;
  const body = await request.json();

  // In production: forward to backend API
  return NextResponse.json({
    ok: true,
    memberId,
    updated: body,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> },
) {
  const { memberId } = await params;

  // In production: forward to backend API
  return NextResponse.json({ ok: true, memberId });
}
