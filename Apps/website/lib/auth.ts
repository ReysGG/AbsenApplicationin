import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  emailAndPassword: {
    enabled: true,

    /**
     * Hook invoked by better-auth when a password-reset email should be sent.
     * The `url` param is the full reset link including the token.
     * Token expiry (30 minutes) is enforced by better-auth's built-in
     * `resetPasswordTokenExpiresIn` default (1800 seconds).
     *
     * Requirements: 1.9, 1.10, 1.11
     */
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },

    /**
     * Reset token validity: 30 minutes (1800 seconds).
     * If used after this window better-auth rejects it with EXPIRED_TOKEN.
     *
     * Requirement: 1.11
     */
    resetPasswordTokenExpiresIn: 60 * 30, // 1800s — 30 minutes
  },

  session: {
    /**
     * Default session lifetime: 24 hours (86400 seconds).
     * When the user selects "remember me" at sign-in, better-auth overrides
     * this with the value from `rememberMeExpiresIn` (7 days).
     *
     * Requirements: 1.3, 1.4, 1.5
     */
    expiresIn: 60 * 60 * 24, // 86400s — 24 hours

    /**
     * Remember-me extended lifetime: 7 days (604800 seconds).
     * Activated by passing `rememberMe: true` in signIn.email() on the client.
     */
    rememberMeExpiresIn: 60 * 60 * 24 * 7, // 604800s — 7 days

    /**
     * Auto-extend: re-issue the session expiry whenever the session is used
     * and more than half the remaining lifetime has elapsed (updateAge).
     * This keeps active users logged in indefinitely.
     *
     * Requirement: 1.5
     */
    updateAge: 60 * 60 * 24, // extend daily if session is still being used

    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5-minute client-side cookie cache to reduce DB reads
    },
  },

  plugins: [nextCookies()],
});
