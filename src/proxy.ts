import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Network-level guard for the admin console.
 *
 * This gives unauthenticated visitors a real HTTP 307 to `/admin/login`
 * (instead of a soft, 200-status inline redirect) and skips the Prisma lookup
 * entirely for anonymous traffic.
 *
 * IMPORTANT: proxy only proves token integrity. Per the Next.js data-security
 * guide, Server Functions are reachable by direct POST and can be excluded by a
 * matcher, so *every* action in `src/actions/admin.ts` still calls
 * `assertAdmin()` itself. Role revocation is also enforced page-side by
 * `requireAdmin()`, which re-reads the user row — deliberately not here, so a
 * page bounce to `/admin/login` can never loop with a proxy redirect.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  // Signed token present -> let the request through; pages/actions re-check the role.
  if (payload?.sub) {
    return NextResponse.next();
  }

  // No (or invalid) token: /admin/login is the destination, everything else bounces.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
