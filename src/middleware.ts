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

function getUserSport(username: string): "football" | "volleyball" | "basketball" {
  const u = username.toLowerCase();
  if (u.includes("volleyball")) return "volleyball";
  if (u.includes("basketball")) return "basketball";
  return "football";
}

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
        const targetSport = session.role === "ADMIN" ? "football" : getUserSport(session.username);
        return NextResponse.redirect(new URL(`/${targetSport}`, request.url));
      }
    }
    return NextResponse.next();
  }

  // Root redirect to user's assigned sport channel or login
  if (pathname === "/") {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const targetSport = session.role === "ADMIN" ? "football" : getUserSport(session.username);
    return NextResponse.redirect(new URL(`/${targetSport}`, request.url));
  }

  // Check authentication for protected routes
  const sessionToken = request.cookies.get("session_token")?.value;
  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(sessionToken);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Invalid session" }, { status: 401 });
      response.cookies.delete("session_token");
      return response;
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("session_token");
    return response;
  }

  // Check admin role guard
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    const targetSport = getUserSport(session.username);
    return NextResponse.redirect(new URL(`/${targetSport}`, request.url));
  }

  // ================= STRICT CHANNEL ISOLATION GUARD =================
  // Non-admin coaches and players are strictly isolated to their assigned sport channel.
  if (session.role !== "ADMIN" && !pathname.startsWith("/api/") && !pathname.startsWith("/profile")) {
    const userSport = getUserSport(session.username);
    const sportsList = ["football", "volleyball", "basketball"] as const;

    for (const otherSport of sportsList) {
      if (otherSport !== userSport && pathname.startsWith(`/${otherSport}`)) {
        const redirectedPath = pathname.replace(`/${otherSport}`, `/${userSport}`);
        return NextResponse.redirect(new URL(redirectedPath, request.url));
      }
    }
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
