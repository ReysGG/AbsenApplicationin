/**
 * hmac.ts — HMAC-SHA256 utilities for signing and verifying internal
 * user context forwarded from the Next.js BFF to the Express backend.
 *
 * The BFF encodes the user context as a base64 JSON string and attaches
 * an HMAC-SHA256 signature in a separate header.  The `authenticate`
 * middleware calls `verifyContext` before trusting any header value.
 *
 * Requirements: 17.1, 17.2
 */

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Create an HMAC-SHA256 hex digest for `payload` using `secret`.
 *
 * @param payload  The raw string to sign (base64-encoded user context).
 * @param secret   Shared secret (`INTERNAL_JWT_SECRET`).
 * @returns        Lowercase hex digest string.
 */
export function signContext(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Constant-time comparison of expected HMAC against the provided signature.
 *
 * Constant-time comparison prevents timing-based signature-oracle attacks.
 *
 * @param payload    The raw string that was signed.
 * @param signature  Hex digest received in the request header.
 * @param secret     Shared secret used to re-derive the expected digest.
 * @returns          `true` if the signature is valid; `false` otherwise.
 */
export function verifyContext(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signContext(payload, secret)
  try {
    const expectedBuf = Buffer.from(expected, 'hex')
    const receivedBuf = Buffer.from(signature, 'hex')
    // Lengths must match for timingSafeEqual; if not it means an obviously
    // malformed signature — reject immediately (still no timing leak because
    // the mismatch is on length, not content).
    if (expectedBuf.length !== receivedBuf.length) return false
    return timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}
