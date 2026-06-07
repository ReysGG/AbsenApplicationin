/**
 * auth.controller.ts — request/response handlers for auth/me endpoints.
 *
 * GET  /api/v1/me                   — profil + permissions user yang sedang login
 * GET  /api/v1/workspaces/current   — workspace aktif user
 * POST /api/v1/auth/login-event     — BFF calls after successful sign-in
 * POST /api/v1/auth/logout-event    — BFF calls before sign-out
 * POST /api/v1/auth/login-failed    — BFF calls when better-auth rejects credentials
 *
 * Requirements: 1.1, 1.7, 1.12, 1.13, 3.2, 3.3, 4.7, 14.1
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { UnauthenticatedError, ValidationError } from '../../lib/errors'
import {
  getMe,
  getCurrentWorkspace,
  recordLoginSuccess,
  recordLogout,
  recordLoginFailed,
} from './auth.service'

/**
 * GET /api/v1/me
 *
 * Protected by `authenticate` only — resolveActiveWorkspace is intentionally
 * omitted because the user may not yet have a workspace cookie set on first
 * load.
 */
export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const data = await getMe(req.user)
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/workspaces/current
 *
 * Protected by `authenticate` + `resolveActiveWorkspace`.
 * req.activeWorkspace is guaranteed to be set by the time this handler runs.
 */
export function currentWorkspaceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.activeWorkspace) {
      return next(new UnauthenticatedError('Workspace aktif tidak ditemukan'))
    }

    const data = getCurrentWorkspace(req.activeWorkspace)
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Login / Logout event handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/auth/login-event
 *
 * Called by the BFF after a successful better-auth sign-in.
 * Body: { email: string }  (used for validation; primary identity from req.user)
 * Protected by `authenticate` — the BFF only calls this after session is set.
 *
 * Requirements: 1.1, 1.13, 14.1
 */
export async function loginEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const workspaceId = req.user.workspaceId ?? req.workspaceId
    if (!workspaceId) {
      return next(new ValidationError('workspaceId diperlukan untuk login event'))
    }

    await recordLoginSuccess({
      user: req.user,
      workspaceId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, null, 'Login event dicatat')
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/auth/logout-event
 *
 * Called by the BFF before better-auth sign-out.
 * Protected by `authenticate` — the user is still logged in when called.
 *
 * Requirements: 1.12, 1.13, 14.1
 */
export async function logoutEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }

    const workspaceId = req.user.workspaceId ?? req.workspaceId
    if (!workspaceId) {
      return next(new ValidationError('workspaceId diperlukan untuk logout event'))
    }

    await recordLogout({
      user: req.user,
      workspaceId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      requestId: (req as Request & { requestId?: string }).requestId ?? null,
    })

    sendSuccess(res, null, 'Logout event dicatat')
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/auth/login-failed
 *
 * Called by the BFF when better-auth rejects a sign-in attempt (wrong credentials).
 * Body: { email: string }
 * This endpoint is NOT protected by `authenticate` — the user is not logged in yet.
 * It applies `loginGuard` to reject if already locked, then increments the counter.
 *
 * Requirements: 1.7, 1.8
 */
export function loginFailedHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const body = req.body as Record<string, unknown>
    const email = body?.email

    if (typeof email !== 'string' || !email) {
      return next(new ValidationError('email diperlukan'))
    }

    recordLoginFailed({ email })
    sendSuccess(res, null, 'Percobaan login dicatat')
  } catch (err) {
    next(err)
  }
}
