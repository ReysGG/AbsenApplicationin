/**
 * auth.routes.ts — route definitions for auth/me endpoints.
 *
 * GET  /me                     → authenticate only
 * GET  /workspaces/current     → authenticate + resolveActiveWorkspace
 * POST /auth/login-event       → authenticate (BFF: after successful sign-in)
 * POST /auth/logout-event      → authenticate (BFF: before sign-out)
 * POST /auth/login-failed      → loginGuard + open (BFF: after failed sign-in)
 *
 * Requirements: 1.1, 1.7, 1.12, 1.13, 3.2, 3.3, 4.7, 14.1
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { resolveActiveWorkspace } from '../../middleware/resolveActiveWorkspace'
import { loginGuard } from '../../middleware/loginGuard'
import {
  meHandler,
  currentWorkspaceHandler,
  loginEventHandler,
  logoutEventHandler,
  loginFailedHandler,
} from './auth.controller'

const router = Router()

/**
 * GET /api/v1/me
 * Returns the authenticated user's profile + permissions.
 * resolveActiveWorkspace is not applied here — the user may not have a
 * workspace cookie yet when the dashboard first loads.
 */
router.get('/me', authenticate, meHandler)

/**
 * GET /api/v1/workspaces/current
 * Returns the active workspace configuration.
 */
router.get('/workspaces/current', authenticate, resolveActiveWorkspace, currentWorkspaceHandler)

/**
 * POST /api/v1/auth/login-event
 * BFF calls this after a successful better-auth sign-in.
 * Records login_success audit entry + updates last_login_at.
 */
router.post('/auth/login-event', authenticate, loginEventHandler)

/**
 * POST /api/v1/auth/logout-event
 * BFF calls this before better-auth sign-out.
 * Records logout audit entry.
 */
router.post('/auth/logout-event', authenticate, logoutEventHandler)

/**
 * POST /api/v1/auth/login-failed
 * BFF calls this when better-auth rejects credentials.
 * Applies loginGuard (lockout check) then increments the attempt counter.
 * Returns 423 if already locked, 200 otherwise.
 */
router.post('/auth/login-failed', loginGuard, loginFailedHandler)

export default router
