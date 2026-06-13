/**
 * platform.routes.ts — platform-admin console API, mounted at /api/v1/platform.
 *
 * Auth: web `authenticate` (HMAC BFF) → `requirePlatformAdmin` (globalRole gate).
 * NOT workspace-scoped — these endpoints span all tenants.
 *
 *   GET   /platform/tenants
 *   POST  /platform/tenants
 *   PATCH /platform/tenants/:id/status
 *   GET   /platform/invoices
 *   POST  /platform/invoices
 *   PATCH /platform/invoices/:id/status
 *   GET   /platform/admin-users
 *   POST  /platform/admin-users/invite
 *   POST  /platform/admin-users/:id/deactivate
 *   GET   /platform/tickets
 *   POST  /platform/tickets/:id/reply
 *   PATCH /platform/tickets/:id/status
 */

import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { requirePlatformAdmin } from '../../middleware/requirePlatformAdmin'
import {
  listTenantsHandler,
  createTenantHandler,
  updateTenantStatusHandler,
  listInvoicesHandler,
  createInvoiceHandler,
  updateInvoiceStatusHandler,
  listAdminUsersHandler,
  inviteAdminUserHandler,
  deactivateAdminUserHandler,
  listTicketsHandler,
  replyTicketHandler,
  setTicketStatusHandler,
  platformMetricsHandler,
  platformRegistrationsHandler,
  platformTopTenantsHandler,
} from './platform.controller'

const router = Router()
const guard = [authenticate, requirePlatformAdmin()]

// Dashboard metrics (real cross-tenant aggregates)
router.get('/platform/metrics', ...guard, platformMetricsHandler)
router.get('/platform/registrations', ...guard, platformRegistrationsHandler)
router.get('/platform/top-tenants', ...guard, platformTopTenantsHandler)

// Tenants
router.get('/platform/tenants', ...guard, listTenantsHandler)
router.post('/platform/tenants', ...guard, createTenantHandler)
router.patch('/platform/tenants/:id/status', ...guard, updateTenantStatusHandler)

// Invoices
router.get('/platform/invoices', ...guard, listInvoicesHandler)
router.post('/platform/invoices', ...guard, createInvoiceHandler)
router.patch('/platform/invoices/:id/status', ...guard, updateInvoiceStatusHandler)

// Admin users
router.get('/platform/admin-users', ...guard, listAdminUsersHandler)
router.post('/platform/admin-users/invite', ...guard, inviteAdminUserHandler)
router.post('/platform/admin-users/:id/deactivate', ...guard, deactivateAdminUserHandler)

// Support tickets
router.get('/platform/tickets', ...guard, listTicketsHandler)
router.post('/platform/tickets/:id/reply', ...guard, replyTicketHandler)
router.patch('/platform/tickets/:id/status', ...guard, setTicketStatusHandler)

export default router
