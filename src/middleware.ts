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

  // Public paths that do not require authentication
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  ) {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (sessionToken && pathname === "/login") {
      const session = await verifySessionToken(sessionToken);
      if (session) {
        return NextResponse.redirect(new URL("/football", request.url));
      }
    }
    return NextResponse.next();
  }

  // Root redirect to default football channel or login
  if (pathname === "/") {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/football", request.url));
  }

  // Check authentication for protected routes
  const sessionToken = request.cookies.get("session_token")?.value;
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(sessionToken);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("session_token");
    return response;
  }

  // Check admin role guard
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/football", request.url));
  }

  // Forward user information in request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-user-role", session.role);
  requestHeaders.set("x-user-username", session.username);
  requestHeaders.set("x-user-name-en", encodeURIComponent(session.nameEn));
  requestHeaders.set("x-user-name-zh", encodeURIComponent(session.nameZh));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
