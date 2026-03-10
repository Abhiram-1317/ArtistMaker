import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const liked = Boolean(body?.liked);

  // In production: toggle like in database
  // await prisma.like.upsert({ where: { userId_projectId: { userId, projectId: id } }, ... })

  return NextResponse.json({ success: true, movieId: id, liked });
}
