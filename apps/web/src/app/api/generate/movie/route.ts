import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

// Cache the API JWT to avoid re-authenticating on every request
let cachedApiToken: string | null = null;

async function getApiToken(apiUrl: string): Promise<string> {
  if (cachedApiToken) return cachedApiToken;

  const email = "system@genesis.ai";
  const password = "SystemPass1!";

  // Try login first
  const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (loginRes.ok) {
    const { token } = await loginRes.json();
    cachedApiToken = token;
    return token;
  }

  // If login fails, register the service user
  const registerRes = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      username: "system",
      displayName: "System User",
    }),
  });

  if (!registerRes.ok) {
    throw new Error("Failed to authenticate with API server");
  }

  const { token } = await registerRes.json();
  cachedApiToken = token;
  return token;
}

/**
 * POST /api/generate/movie
 * Creates a project with a scene/shot from the prompt, then queues
 * a real AI movie generation job via the API server → Bull → AI Worker.
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, style = "cinematic" } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "A prompt of at least 3 characters is required." },
        { status: 400 },
      );
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");
    const token = await getApiToken(apiBase);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    // 1. Create a project via the API server
    const createRes = await fetch(`${apiBase}/api/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: prompt.trim().slice(0, 100),
        description: prompt.trim(),
        genre: "OTHER",
        style,
        duration: 15,
        resolution: "1080p",
        frameRate: 24,
        characters: [
          {
            name: "Subject",
            description: "Main subject of the scene",
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || "Failed to create project" },
        { status: createRes.status },
      );
    }

    const { data: project } = await createRes.json();

    // 2. Queue movie generation via the projects generate endpoint
    const generateRes = await fetch(
      `${apiBase}/api/projects/${project.id}/generate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!generateRes.ok) {
      const err = await generateRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || err.error || "Failed to queue generation" },
        { status: generateRes.status },
      );
    }

    const result = await generateRes.json();

    return NextResponse.json({
      success: true,
      projectId: project.id,
      jobId: result.jobId,
      status: result.status,
      estimatedTime: result.estimatedTime,
      message: "AI movie generation queued",
    });
  } catch (error) {
    console.error("[MOVIE_GEN] Error:", error);
    return NextResponse.json(
      { error: "Failed to start movie generation. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/generate/movie?projectId=xxx
 * Polls the render status of a queued movie job.
 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");
  const token = await getApiToken(apiBase);

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
  };

  try {
    const res = await fetch(
      `${apiBase}/api/projects/${projectId}/render-status`,
      { headers },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch render status" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to check render status" },
      { status: 500 },
    );
  }
}
