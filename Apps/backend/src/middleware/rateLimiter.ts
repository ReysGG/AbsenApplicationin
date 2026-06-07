/**
 * rateLimiter.ts — Reusable express-rate-limit presets.
 *
 * Two tiers:
 *   generalRateLimit    : applied globally to all /api/v1 routes (500 req / 15 min per IP)
 *   sensitiveRateLimit  : applied to sensitive endpoints like export, role management (50 req / 15 min)
 *
 * Requirements: 1.8, 17.3
 */

import rateLimit from 'express-rate-limit'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * General API rate limit — 500 requests per 15 minutes per IP.
 * Applied globally on all /api/v1 routes.
 */
export const generalRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak permintaan, coba lagi nanti.',
    },
  },
})

/**
 * Sensitive endpoint rate limit — 50 requests per 15 minutes per IP.
 * Apply to: export endpoints, role management.
 */
export const sensitiveRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak permintaan.',
    },
  },
})
