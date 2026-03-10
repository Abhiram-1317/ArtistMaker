import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params;
  const body = await request.json();
  const liked = Boolean(body?.liked);

  // In production: toggle comment like in database

  return NextResponse.json({ success: true, movieId: id, commentId, liked });
}
