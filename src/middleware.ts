import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/jwt";

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static and auth endpoints
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/draco/")
  ) {
    return NextResponse.next();
  }

  // 2. Read session token if present
  const sessionToken = request.cookies.get("session_token")?.value;
  let session = null;
  if (sessionToken) {
    try {
      session = await verifySessionToken(sessionToken);
    } catch {
      session = null;
    }
  }

  // 3. Admin routes require active ADMIN session
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Profile route requires logged in user
  if (pathname.startsWith("/profile")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Forward user info in request headers if authenticated
  const requestHeaders = new Headers(request.headers);
  if (session) {
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-username", session.username);
    requestHeaders.set("x-user-name-en", encodeURIComponent(session.nameEn));
    requestHeaders.set("x-user-name-zh", encodeURIComponent(session.nameZh));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
