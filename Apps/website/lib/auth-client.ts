/**
 * lib/auth-client.ts
 *
 * better-auth client instance for use in Client Components.
 *
 * Exports:
 *  - authClient       — the full better-auth client instance
 *  - signIn           — sign-in helper (email/password)
 *  - signUp           — sign-up helper
 *  - signOut          — sign-out helper (clears session cookie)
 *  - useSession       — React hook for reading the current session
 *  - forgetPassword   — trigger a password-reset email (R1.9)
 *  - resetPassword    — complete reset with token from email link (R1.10, R1.11)
 *
 * For server-side session access (Server Components / API routes) use
 * `auth.api.getSession({ headers })` from `@/lib/auth` directly.
 *
 * Note on forgetPassword / resetPassword:
 *   better-auth exposes these via a dynamic Proxy at runtime.
 *   We re-export them as bound wrappers so consumers get stable typed references
 *   without needing to call authClient.forgetPassword directly.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.9, 1.10, 1.11, 18.7
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  /** Must match BETTER_AUTH_URL / the Next.js origin */
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Trigger a password-reset email for the given address.
 *
 * Usage:
 *   await forgetPassword({ email: "user@example.com", redirectTo: "/reset-password" })
 *
 * better-auth sends a reset link to the email. The link embeds a one-time token
 * that is valid for 30 minutes (configured via `resetPasswordTokenExpiresIn` in
 * lib/auth.ts). If no email provider is configured the reset link is logged to
 * the server console (dev mode).
 *
 * Requirement: 1.9
 */
export async function forgetPassword(params: {
  email: string;
  redirectTo?: string;
}): Promise<{ data: unknown; error: { message?: string; status?: number } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (authClient as any).forgetPassword(params);
}

/**
 * Complete the reset flow by setting a new password using the token
 * received in the reset-password email link.
 *
 * Usage:
 *   await resetPassword({ newPassword: "NewPass123!", token: searchParams.get("token") })
 *
 * better-auth validates the token (expiry + single-use), updates the password,
 * and revokes all existing sessions for that user so no previously authenticated
 * device retains access after the reset.
 *
 * Requirements: 1.10, 1.11
 */
export async function resetPassword(params: {
  newPassword: string;
  token: string;
}): Promise<{ data: unknown; error: { message?: string; status?: number } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (authClient as any).resetPassword(params);
}
