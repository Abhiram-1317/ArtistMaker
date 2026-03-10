import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { displayName, username, bio, avatarUrl } = body as {
      displayName?: string;
      username?: string;
      bio?: string;
      avatarUrl?: string | null;
    };

    if (!displayName?.trim() || !username?.trim()) {
      return NextResponse.json(
        { error: "Display name and username are required" },
        { status: 400 }
      );
    }

    if (username.length > 30 || displayName.length > 50) {
      return NextResponse.json(
        { error: "Field length exceeded" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 200) {
      return NextResponse.json(
        { error: "Bio must be 200 characters or less" },
        { status: 400 }
      );
    }

    // In production: validate session, update DB
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // await prisma.user.update({ where: { id: session.user.id }, data: { displayName, username, bio, avatarUrl } });

    return NextResponse.json({
      success: true,
      displayName,
      username,
      bio: bio ?? null,
      avatarUrl: avatarUrl ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
