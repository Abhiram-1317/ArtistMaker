import { NextRequest, NextResponse } from "next/server";

interface MemberData {
  id: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  user: { id: string; email: string; name: string | null };
}

// Mock collaboration members
const MOCK_MEMBERS: MemberData[] = [
  {
    id: "pm-1",
    userId: "user-1",
    role: "OWNER",
    canEdit: true,
    canDelete: true,
    canShare: true,
    status: "ACCEPTED",
    user: { id: "user-1", email: "creator@genesis.ai", name: "Project Creator" },
  },
  {
    id: "pm-2",
    userId: "user-2",
    role: "EDITOR",
    canEdit: true,
    canDelete: false,
    canShare: false,
    status: "ACCEPTED",
    user: { id: "user-2", email: "editor@genesis.ai", name: "Alex Editor" },
  },
  {
    id: "pm-3",
    userId: "user-3",
    role: "VIEWER",
    canEdit: false,
    canDelete: false,
    canShare: false,
    status: "PENDING",
    user: { id: "user-3", email: "viewer@genesis.ai", name: "Sam Viewer" },
  },
];

export async function GET() {
  // In production: forward to backend API
  return NextResponse.json({ members: MOCK_MEMBERS });
}

export async function POST(request: NextRequest) {
  // Handle invite
  const body = await request.json();
  const { emailOrUsername, role } = body as { emailOrUsername: string; role: string };

  if (!emailOrUsername || !role) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  // Mock: return success
  return NextResponse.json({
    ok: true,
    member: {
      id: `pm-${Date.now()}`,
      userId: `user-${Date.now()}`,
      role,
      canEdit: role === "EDITOR",
      canDelete: false,
      canShare: false,
      status: "PENDING",
      user: { id: `user-${Date.now()}`, email: emailOrUsername, name: null },
    },
  });
}
