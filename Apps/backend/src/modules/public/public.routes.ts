/**
 * public.routes.ts — unauthenticated, public-facing endpoints.
 *
 * POST /public/trial-request — "uji coba" lead form from the marketing site (#15).
 *   The website forwards this without a session (see BFF PUBLIC_BACKEND_PATHS).
 */

import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { sendTrialRequestEmail } from '../../lib/mailer'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import { authRateLimit } from '../../middleware/rateLimiter'

const router = Router()

const trialRequestSchema = z.object({
  name: z.string().trim().min(2, 'Nama wajib diisi').max(120),
  email: z.string().email('Format email tidak valid').toLowerCase().trim(),
  company: z.string().trim().max(160).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
})

async function trialRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = trialRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(new ValidationError('Input tidak valid', parsed.error.flatten()))
    }
    const { name, email, company, message } = parsed.data

    const inbox =
      process.env['TRIAL_INBOX'] ||
      process.env['MAIL_FROM'] ||
      process.env['SMTP_USER'] ||
      ''

    if (inbox) {
      // Non-blocking — a mail failure should still return success to the user;
      // the attempt is logged inside the mailer.
      void sendTrialRequestEmail({ inbox, name, email, company, message })
    }

    sendSuccess(
      res,
      null,
      'Permintaan uji coba terkirim. Tim kami akan menghubungi Anda via email.',
    )
  } catch (err) {
    next(err)
  }
}

// Rate-limited to deter spam/abuse on the public form.
router.post('/public/trial-request', authRateLimit, trialRequestHandler)

export default router
