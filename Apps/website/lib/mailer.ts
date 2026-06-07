/**
 * lib/mailer.ts
 *
 * MailerService abstraction for sending transactional emails.
 *
 * Strategy:
 *  - If RESEND_API_KEY is set → send via Resend HTTP API.
 *  - Otherwise → log the link to the console (dev/local mode).
 *
 * This keeps the mailer dependency-free in dev (no extra npm package needed)
 * while allowing production email sending via Resend.
 *
 * Requirements: 1.9 (reset password email, link valid 30 minutes)
 */

/** Send a password-reset email to the given address. */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(to, resetLink);
  } else {
    // Dev-mode fallback: log the link so developers can test without email infra.
    console.log(
      `[DEV] Password reset link for ${to}: ${resetLink}`
    );
  }
}

// ---------------------------------------------------------------------------
// Resend implementation (no extra npm package — uses native fetch)
// ---------------------------------------------------------------------------

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendViaResend(to: string, resetLink: string): Promise<void> {
  const from =
    process.env.EMAIL_FROM ?? "AttendX <noreply@attendx.app>";

  const body = {
    from,
    to: [to],
    subject: "Reset Password AttendX",
    html: buildResetEmailHtml(resetLink),
    text: buildResetEmailText(resetLink),
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Log but don't throw — better-auth will still complete the reset flow;
    // the user can request a new link if the email doesn't arrive.
    console.error(
      `[mailer] Resend API error (${response.status}): ${errorText}`
    );
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function buildResetEmailHtml(resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8" /><title>Reset Password</title></head>
<body style="font-family:sans-serif;color:#111;background:#f9fafb;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <h2 style="margin-top:0;font-size:20px;">Reset Password AttendX</h2>
    <p style="color:#444;line-height:1.6;">
      Kami menerima permintaan untuk mereset password akun Anda.
      Klik tombol di bawah ini untuk melanjutkan. Tautan ini berlaku selama <strong>30 menit</strong>.
    </p>
    <a
      href="${resetLink}"
      style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;"
    >
      Reset Password
    </a>
    <p style="color:#888;font-size:12px;margin-top:24px;">
      Jika Anda tidak meminta reset password, abaikan email ini.
      Password Anda tidak akan berubah.<br/>
      Tautan: <a href="${resetLink}" style="color:#2563eb;">${resetLink}</a>
    </p>
  </div>
</body>
</html>`;
}

function buildResetEmailText(resetLink: string): string {
  return `Reset Password AttendX\n\nKami menerima permintaan untuk mereset password akun Anda.\nKlik tautan berikut untuk melanjutkan (berlaku 30 menit):\n\n${resetLink}\n\nJika Anda tidak meminta reset password, abaikan email ini.`;
}
