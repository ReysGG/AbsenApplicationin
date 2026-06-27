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
import nodemailer, { type Transporter } from 'nodemailer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

// ---------------------------------------------------------------------------
// SMTP transport (lazy singleton)
// ---------------------------------------------------------------------------

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter | null {
  const user = process.env['SMTP_USER']
  const pass = process.env['SMTP_PASS']
  if (!user || !pass) return null

  if (!cachedTransporter) {
    const host = process.env['SMTP_HOST'] ?? 'smtp.gmail.com'
    const port = Number(process.env['SMTP_PORT'] ?? 587)
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user, pass },
    })
  }
  return cachedTransporter
}

// ---------------------------------------------------------------------------
// Internal send helper
// ---------------------------------------------------------------------------

async function sendMail(options: MailOptions): Promise<void> {
  // Preferred: SMTP (e.g. Gmail) when credentials are configured.
  const transporter = getTransporter()
  if (transporter) {
    const fromAddress =
      process.env['MAIL_FROM'] || process.env['SMTP_USER'] || 'noreply@attendx.app'
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      })
      logger.info('Email sent successfully (SMTP)', {
        to: options.to,
        subject: options.subject,
      })
    } catch (err) {
      logger.error('Failed to send email via SMTP', {
        to: options.to,
        subject: options.subject,
        error: (err as Error).message,
      })
      // Do not throw — email failure should not block the main flow.
    }
    return
  }

  // Legacy fallback: Resend HTTP API when RESEND_API_KEY is set.
  const apiKey = process.env['RESEND_API_KEY']

  if (!apiKey) {
    // Dev / staging mode — log email content for manual sharing
    logger.info('[MAILER DEV MODE] Email not sent (no SMTP/RESEND configured)', {
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
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
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

/**
 * Send login credentials to a newly created employee whose account was
 * provisioned with a system-generated temporary password (#10).
 * The employee should change this password after first login.
 */
export async function sendNewAccountCredentialsEmail(
  to: string,
  params: { fullName: string; password: string; loginUrl: string },
): Promise<void> {
  await sendMail({
    to,
    subject: 'Akun AttendX Anda Telah Dibuat',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Selamat Datang di AttendX, ${params.fullName}!</h2>
        <p>Akun karyawan Anda telah dibuat. Berikut kredensial untuk login:</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 6px 12px; color: #6b7280;">Email</td>
            <td style="padding: 6px 12px; font-weight: bold;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; color: #6b7280;">Kata Sandi Sementara</td>
            <td style="padding: 6px 12px; font-weight: bold; font-family: monospace;">${params.password}</td>
          </tr>
        </table>
        <p>
          <a href="${params.loginUrl}" style="
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">
            Masuk Sekarang
          </a>
        </p>
        <p style="color: #b45309; font-size: 14px;">
          <strong>Penting:</strong> demi keamanan, segera ganti kata sandi ini
          setelah login pertama melalui menu <em>Ganti Kata Sandi</em>.
        </p>
      </div>
    `,
  })
}

/**
 * Notify the sales/owner inbox of a new "uji coba" (trial) request submitted
 * from the public website (#15), and (best-effort) confirm to the requester.
 */
export async function sendTrialRequestEmail(params: {
  inbox: string
  name: string
  email: string
  company?: string | null
  message?: string | null
}): Promise<void> {
  const { inbox, name, email, company, message } = params
  await sendMail({
    to: inbox,
    replyTo: email,
    subject: `Permintaan Uji Coba AttendX — ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Permintaan Uji Coba Baru</h2>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:6px 12px;color:#6b7280;">Nama</td><td style="padding:6px 12px;font-weight:bold;">${name}</td></tr>
          <tr><td style="padding:6px 12px;color:#6b7280;">Email</td><td style="padding:6px 12px;">${email}</td></tr>
          <tr><td style="padding:6px 12px;color:#6b7280;">Perusahaan</td><td style="padding:6px 12px;">${company ?? '—'}</td></tr>
        </table>
        ${message ? `<p style="color:#374151;">${message}</p>` : ''}
        <p style="color:#9ca3af;font-size:12px;">Balas email ini untuk langsung menghubungi pemohon.</p>
      </div>
    `,
  })
}
