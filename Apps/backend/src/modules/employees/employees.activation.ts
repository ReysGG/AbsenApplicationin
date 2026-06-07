/**
 * employees.activation.ts — Activation token management for employee account activation.
 *
 * Strategy: In-memory token store (v1).
 *   Key  : random hex token (crypto.randomBytes(32).toString('hex'))
 *   Value: { employeeId, workspaceId, email, expiresAt }
 *
 * On resend, the old token for the same employee is invalidated (R2.6).
 * Token is valid for 7 days (R2.2).
 * If a link is used after 7 days → ExpiredTokenError (R2.7).
 *
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7
 */

import crypto from 'crypto'
import { ExpiredTokenError, NotFoundError } from '../../lib/errors'
import { logger } from '../../lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivationTokenData {
  employeeId: string
  workspaceId: string
  email: string
  expiresAt: Date
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

/** token → data */
const tokenStore = new Map<string, ActivationTokenData>()

/** employeeId → token (for invalidation on resend) */
const employeeTokenIndex = new Map<string, string>()

// Token lifetime: 7 days (R2.2)
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a new activation token for the given employee.
 * If an existing token is present it is invalidated first (R2.6 — resend).
 *
 * @returns the new hex token
 */
export function generateActivationToken(data: {
  employeeId: string
  workspaceId: string
  email: string
}): string {
  // Invalidate any existing token for this employee
  invalidateEmployeeToken(data.employeeId)

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  tokenStore.set(token, {
    employeeId: data.employeeId,
    workspaceId: data.workspaceId,
    email: data.email,
    expiresAt,
  })

  employeeTokenIndex.set(data.employeeId, token)

  logger.info('Activation token generated', {
    employeeId: data.employeeId,
    expiresAt: expiresAt.toISOString(),
  })

  return token
}

/**
 * Validate an activation token.
 * Returns the token data if valid.
 * Throws ExpiredTokenError if expired, NotFoundError if not found.
 *
 * Requirements: 2.7
 */
export function validateActivationToken(token: string): ActivationTokenData {
  const data = tokenStore.get(token)

  if (!data) {
    throw new NotFoundError('Token aktivasi tidak ditemukan atau sudah digunakan')
  }

  if (data.expiresAt < new Date()) {
    // Clean up expired token
    tokenStore.delete(token)
    employeeTokenIndex.delete(data.employeeId)
    throw new ExpiredTokenError('Token aktivasi sudah kedaluwarsa. Minta resend invitation.')
  }

  return data
}

/**
 * Consume (delete) an activation token after successful activation.
 * Call this after the employee has successfully set their password.
 */
export function consumeActivationToken(token: string): void {
  const data = tokenStore.get(token)
  if (data) {
    tokenStore.delete(token)
    employeeTokenIndex.delete(data.employeeId)
    logger.info('Activation token consumed', { employeeId: data.employeeId })
  }
}

/**
 * Invalidate the current token for a given employee (used on resend — R2.6).
 */
export function invalidateEmployeeToken(employeeId: string): void {
  const existingToken = employeeTokenIndex.get(employeeId)
  if (existingToken) {
    tokenStore.delete(existingToken)
    employeeTokenIndex.delete(employeeId)
    logger.info('Previous activation token invalidated', { employeeId })
  }
}

/**
 * Build the full activation URL that will be emailed to the employee.
 * Falls back to a log-friendly string if APP_URL is not set.
 */
export function buildActivationLink(token: string): string {
  const baseUrl =
    process.env['APP_URL'] ?? process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  return `${baseUrl}/activate?token=${token}`
}

// ---------------------------------------------------------------------------
// Dev/test helpers
// ---------------------------------------------------------------------------

/** For testing: clear all tokens. */
export function _clearAllTokens(): void {
  tokenStore.clear()
  employeeTokenIndex.clear()
}

/** For testing: get token count. */
export function _tokenCount(): number {
  return tokenStore.size
}
