/**
 * express.d.ts — module augmentation to extend Express's Request interface.
 *
 * Adds application-specific fields that are attached by middleware during
 * the request lifecycle (requestId, authenticated user, workspace context,
 * scope filter).
 *
 * Requirements: 18.4, 3.10, 4.2
 */

import type { Workspace } from '@prisma/client'
import type { AuthenticatedUser, ScopeFilter, MobileEmployee, PlatformActor } from './auth'

declare global {
  namespace Express {
    interface Request {
      /** UUID assigned to every request by requestIdMiddleware */
      requestId: string
      /** Authenticated user context — set by the `authenticate` middleware */
      user?: AuthenticatedUser
      /** Active workspace id — set by `resolveActiveWorkspace` middleware */
      workspaceId?: string
      /** Full Workspace record — set by `resolveActiveWorkspace` middleware */
      activeWorkspace?: Workspace
      /** Platform-admin actor context — set by `requirePlatformAdmin` middleware */
      platformActor?: PlatformActor
      /**
       * The Employee record for the authenticated mobile user — set by the
       * `authenticateMobile` middleware. Mobile endpoints are scoped to this
       * employee's own data.
       */
      employee?: MobileEmployee
      /**
       * Scope filter — set by `enforceScope` middleware.
       * `undefined` for Stakeholders (full workspace access).
       * Populated for Support Admins (OR of dept/location scopes).
       */
      scopeFilter?: ScopeFilter
    }
  }
}
