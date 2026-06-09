/**
 * better-auth server instance for Apps/backend.
 *
 * This mirrors the session configuration in Apps/website so that the backend
 * can verify session tokens that were issued by the website. Both share the
 * same BETTER_AUTH_SECRET.
 *
 * IMPORTANT: The backend authenticate middleware uses HMAC-signed context
 * headers (not direct session verification). This auth instance is used
 * only for:
 *   1. authVerify.ts (session cookie verification — rarely called)
 *   2. employees.service.ts (signUpEmail for account activation)
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 17.4
 */
import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { env } from './env'

// better-auth with PostgreSQL via connection string (Prisma-less mode)
// This avoids the need for the backend Prisma schema to have auth tables
export const auth = betterAuth({
  database: {
    type: 'postgresql',
    url: env.DATABASE_URL,
  },

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  // The bearer plugin lets the mobile app authenticate with
  // `Authorization: Bearer <session-token>` instead of cookies. The web BFF
  // keeps using HMAC-signed context headers; mobile uses this path.
  plugins: [bearer()],

  emailAndPassword: {
    enabled: true,
  },

  session: {
    /** Must match Apps/website session config */
    expiresIn: 60 * 60 * 24,               // 24 hours
    rememberMeExpiresIn: 60 * 60 * 24 * 7, // 7 days (remember-me)
    updateAge: 60 * 60 * 24,               // auto-extend daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
})
