import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // In production: increment view count in database
  // await prisma.project.update({ where: { id }, data: { views: { increment: 1 } } })

  return NextResponse.json({ success: true, movieId: id });
}
