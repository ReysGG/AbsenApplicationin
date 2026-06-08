/**
 * proxy.ts  (Next.js 16+ — pengganti middleware.ts)
 *
 * Route protection untuk semua protected routes.
 *
 * Strategi:
 * 1. Cek keberadaan session cookie (fast check, tanpa DB roundtrip).
 * 2. Tidak ada cookie → redirect ke /login?callbackUrl={path}.
 * 3. Ada cookie → lanjutkan request (validasi penuh di layout server component).
 *
 * Protected routes:
 *   /workspace/*  — HR dashboard (stakeholder, support_admin)
 *   /admin/*      — Platform admin
 *
 * Public routes (dilewati):
 *   /login, /sign-in, /sign-up, /forgot-password, /reset-password
 *   /api/auth/*   — better-auth endpoints
 *   /_next/*      — Next.js internals
 *
 * Requirements: 1.6, 1.7, 3.4, 19.1
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// ---------------------------------------------------------------------------
// Route matchers
// ---------------------------------------------------------------------------

const PROTECTED_PREFIXES = ["/workspace", "/admin"];

const PUBLIC_PREFIXES = [
  "/login",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Proxy handler (Next.js 16 convention)
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati semua public routes dan static assets
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Cek hanya protected routes
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Fast cookie check — tidak butuh DB roundtrip di edge
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Tidak ada session → redirect ke login dengan callbackUrl
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Ada session cookie → lanjutkan dengan security headers
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return response;
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
