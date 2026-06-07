import { createHmac } from "crypto";

/**
 * Signs a payload object for BFF → Express internal user context.
 *
 * The signature scheme:
 *   contextHeader = base64(JSON.stringify(payload))
 *   sigHeader     = HMAC-SHA256(contextHeader, secret) → hex
 *
 * Express verifies by re-computing HMAC over the received contextHeader
 * and comparing it to sigHeader using a constant-time comparison.
 */
export function signContext(
  payload: object,
  secret: string
): { contextHeader: string; sigHeader: string } {
  const contextHeader = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sigHeader = createHmac("sha256", secret)
    .update(contextHeader)
    .digest("hex");
  return { contextHeader, sigHeader };
}
