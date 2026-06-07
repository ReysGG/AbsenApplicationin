/**
 * mailer.ts — Email sending abstraction for AttendX.
 *
 * Behavior:
 *   - Dev mode (RESEND_API_KEY not set): log the link to console/structured logger.
 *   - Production (RESEND_API_KEY set): send via Resend.
 *
 * This keeps the rest of the app decoupled from the email provider.
 *
 * Requirements: 2.2, 1.9
 */

import { logger } from './logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MailOptions {
  to: string
  subject: string
  html: string
}

// ---------------------------------------------------------------------------
// Internal send helper
// ---------------------------------------------------------------------------

async function sendMail(options: MailOptions): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY']

  if (!apiKey) {
    // Dev / staging mode — log email content for manual sharing
    logger.info('[MAILER DEV MODE] Email not sent (RESEND_API_KEY not configured)', {
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return
  }

  // Production — send via Resend API
  const fromAddress = process.env['MAIL_FROM'] ?? 'noreply@attendx.app'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    logger.error('Failed to send email via Resend', {
      to: options.to,
      subject: options.subject,
      status: response.status,
      body,
    })
    // Do not throw — email failure should not block the main flow
    return
  }

  logger.info('Email sent successfully', { to: options.to, subject: options.subject })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an account activation email to a new employee.
 * Contains the activation link valid for 7 days (R2.2).
 */
export async function sendActivationEmail(to: string, activationLink: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Aktivasi Akun AttendX Anda',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Selamat Datang di AttendX!</h2>
        <p>Akun karyawan Anda telah dibuat. Klik tautan di bawah untuk mengaktifkan akun dan membuat password Anda.</p>
        <p>
          <a href="${activationLink}" style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">
            Aktifkan Akun
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Tautan ini berlaku selama <strong>7 hari</strong>. Jika Anda tidak merasa mendaftar, abaikan email ini.
        </p>
        <p style="color: #9ca3af; font-size: 12px;">Atau salin tautan ini: ${activationLink}</p>
      </div>
    `,
  })
}

/**
 * Send a password reset email.
 * Contains the reset link valid for 30 minutes (R1.9).
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Reset Password AttendX',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Password</h2>
        <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
        <p>
          <a href="${resetLink}" style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Tautan ini berlaku selama <strong>30 menit</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
        <p style="color: #9ca3af; font-size: 12px;">Atau salin tautan ini: ${resetLink}</p>
      </div>
    `,
  })
}
