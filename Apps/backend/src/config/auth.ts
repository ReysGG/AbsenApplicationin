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
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { bearer } from 'better-auth/plugins'
import { prisma } from './prisma'
import { env } from './env'

// Use the Prisma adapter (same as Apps/website) so the backend talks to the
// shared better-auth tables through the same Prisma client used by the rest of
// the app. The kysely-pg path (`{ type: 'postgresql', url }`) failed to
// initialise the adapter in this environment.
//
// Backend's Prisma schema names the auth models AuthUser/AuthSession/...
// (mapped to the shared `user`/`session`/... tables). Better-auth looks up
// models by Prisma model name, so we override modelName to point at the
// AuthX names.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  user: { modelName: 'AuthUser' },
  session: {
    modelName: 'AuthSession',
    expiresIn: 60 * 60 * 24, // 24h
    rememberMeExpiresIn: 60 * 60 * 24 * 7, // 7d
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  account: { modelName: 'AuthAccount' },
  verification: { modelName: 'AuthVerification' },

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  // The bearer plugin lets the mobile app authenticate with
  // `Authorization: Bearer <session-token>` instead of cookies. The web BFF
  // keeps using HMAC-signed context headers; mobile uses this path.
  plugins: [bearer()],

  emailAndPassword: {
    enabled: true,
  },
})
