import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1");

  // In production: fetch from database with pagination
  // const comments = await prisma.comment.findMany({ where: { projectId: id }, skip: (page - 1) * 10, take: 11 })

  return NextResponse.json({
    comments: [],
    hasMore: false,
    movieId: id,
    page,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const parentId = typeof body?.parentId === "string" ? body.parentId : null;

  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Comment text must be 1-2000 characters" },
      { status: 400 },
    );
  }

  // In production: create comment in database
  // await prisma.comment.create({ data: { projectId: id, userId, text, parentId } })

  const comment = {
    id: `comment-${Date.now()}`,
    text,
    parentId,
    createdAt: new Date().toISOString(),
    movieId: id,
  };

  return NextResponse.json(comment, { status: 201 });
}
