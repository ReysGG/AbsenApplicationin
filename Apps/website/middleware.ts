/**
 * middleware.ts
 *
 * Proteksi route untuk semua path /workspace/* dan /dashboard/*.
 *
 * - Tidak ada session → redirect ke /login?callbackUrl={currentPath}
 * - Session valid → lanjut ke halaman (pengecekan role dilakukan di layout)
 * - Route publik (/login, /forgot-password, /reset-password, /api/*) dilewati
 *
 * Catatan: Pengecekan ini hanya verifikasi cepat lewat cookie (tanpa
 * DB roundtrip). Validasi session penuh + role check dilakukan di layout
 * server component (app/workspace/layout.tsx).
 *
 * Requirements: 3.4, 19.1
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya proteksi /workspace/* dan /dashboard/*
  const isProtectedRoute =
    pathname.startsWith("/workspace") || pathname.startsWith("/dashboard");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Cek keberadaan session cookie (fast check — tanpa DB roundtrip)
  const sessionToken = getSessionCookie(request);

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspace/:path*", "/dashboard/:path*"],
};
