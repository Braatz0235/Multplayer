import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Fast, edge-safe presence check. Full JWT verification happens in the
// admin layout (server component) and in each /api/admin route handler,
// both of which run on the Node.js runtime.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicAdminPaths = ["/admin/login", "/admin/setup"];

  if (pathname.startsWith("/admin") && !publicAdminPaths.includes(pathname)) {
    const hasCookie = request.cookies.has(SESSION_COOKIE);
    if (!hasCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
