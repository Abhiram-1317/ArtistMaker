import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // ── CSRF protection for mutating API routes ─────────────────────────────
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse("CSRF validation failed", { status: 403 });
        }
      } catch {
        return new NextResponse("Invalid origin", { status: 403 });
      }
    }
  }

  // ── Protected routes ────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/projects")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Auth pages: redirect authenticated users to dashboard ───────────────
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();

  // ── Secure cookie attributes ────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/login", "/register", "/api/:path*"],
};
