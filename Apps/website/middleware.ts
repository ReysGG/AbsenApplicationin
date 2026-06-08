import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware — auth guard + route protection.
 *
 * Strategi:
 * - Middleware berjalan di edge runtime, tidak bisa pakai Prisma.
 * - Session better-auth disimpan sebagai cookie `better-auth.session_token`.
 * - Cukup cek keberadaan cookie sebagai gate awal; validasi penuh terjadi di
 *   layout server component (auth.api.getSession) dan di BFF proxy.
 * - Untuk proteksi yang cukup di edge: kalau tidak ada session cookie →
 *   redirect ke /login. Kalau ada → lanjut (layout akan verifikasi ulang).
 *
 * Route groups:
 *   /workspace/*  → protected (butuh session)
 *   /admin/*      → protected (butuh session)
 *   /login        → public, redirect ke /workspace/overview jika sudah login
 *   /sign-in      → public (redirect alias)
 *   /sign-up      → public
 *   /(auth)/*     → public (login, forgot-password, reset-password, activate)
 *   /api/*        → BFF proxy, session divalidasi di handler
 *   /             → public (landing page)
 *
 * Requirements: 1.6, 1.14, 3.4, 4.1
 */

// Nama cookie session better-auth (default)
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

// Route yang membutuhkan autentikasi
const PROTECTED_PREFIXES = ["/workspace", "/admin"];

// Route publik yang harus di-redirect jika sudah login
const AUTH_REDIRECT_PATHS = ["/login", "/sign-in"];

// Route yang selalu publik (tidak perlu cek sama sekali)
const ALWAYS_PUBLIC_PREFIXES = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/sign-up",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Route yang selalu publik — lewati tanpa cek
  if (ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Route auth publik (forgot-password, reset-password, activate) — selalu publik
  if (pathname.startsWith("/(auth)") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password") || pathname.startsWith("/activate")) {
    return NextResponse.next();
  }

  const isLoggedIn = hasSessionCookie(req);

  // 3. Halaman login — redirect ke dashboard jika sudah login
  if (AUTH_REDIRECT_PATHS.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/workspace/overview", req.url));
    }
    return NextResponse.next();
  }

  // 4. Protected routes — redirect ke login jika belum ada session cookie
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      // Simpan halaman tujuan untuk redirect setelah login (R1.6)
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 5. Semua route lain — lewati
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
