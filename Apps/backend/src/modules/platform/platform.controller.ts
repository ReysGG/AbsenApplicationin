/**
 * platform.controller.ts — request handlers for the platform-admin console.
 * All handlers run behind authenticate + requirePlatformAdmin (see routes).
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ValidationError } from '../../lib/errors'
import * as service from './platform.service'

// ── Tenants ────────────────────────────────────────────────────────────────

export async function listTenantsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.listTenants(new Date()))
  } catch (err) {
    next(err)
  }
}

export async function createTenantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>
    const data = await service.createTenant({
      name: typeof b.name === 'string' ? b.name : '',
      slug: typeof b.slug === 'string' ? b.slug : undefined,
      plan: typeof b.plan === 'string' ? b.plan : undefined,
    })
    sendSuccess(res, data, 'Tenant dibuat', 201)
  } catch (err) {
    next(err)
  }
}

export async function updateTenantStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id)
    const status = String((req.body as { status?: unknown })?.status ?? '')
    if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
      throw new ValidationError('Status tenant tidak valid')
    }
    await service.updateTenantStatus(id, status as 'Active' | 'Suspended' | 'Inactive')
    sendSuccess(res, null, 'Status tenant diperbarui')
  } catch (err) {
    next(err)
  }
}

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function platformMetricsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getPlatformMetrics(new Date()))
  } catch (err) {
    next(err)
  }
}

export async function platformRegistrationsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getRecentRegistrations(new Date()))
  } catch (err) {
    next(err)
  }
}

export async function platformTopTenantsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getTopTenants())
  } catch (err) {
    next(err)
  }
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export async function listInvoicesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.listInvoices())
  } catch (err) {
    next(err)
  }
}

export async function createInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>
    if (typeof b.tenantId !== 'string' || typeof b.plan !== 'string') {
      throw new ValidationError('tenantId dan plan diperlukan')
    }
    const data = await service.createInvoice({
      tenantId: b.tenantId,
      plan: b.plan,
      amount: Number(b.amount),
      dueDate: typeof b.dueDate === 'string' ? b.dueDate : undefined,
    })
    sendSuccess(res, data, 'Invoice dibuat', 201)
  } catch (err) {
    next(err)
  }
}

export async function updateInvoiceStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id)
    const status = String((req.body as { status?: unknown })?.status ?? '')
    if (!['Paid', 'Pending', 'Overdue'].includes(status)) {
      throw new ValidationError('Status invoice tidak valid')
    }
    const data = await service.updateInvoiceStatus(id, status as 'Paid' | 'Pending' | 'Overdue')
    sendSuccess(res, data, 'Status invoice diperbarui')
  } catch (err) {
    next(err)
  }
}

// ── Admin users ──────────────────────────────────────────────────────────────

export async function listAdminUsersHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.listAdminUsers(new Date()))
  } catch (err) {
    next(err)
  }
}

export async function inviteAdminUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>
    if (typeof b.email !== 'string') throw new ValidationError('Email diperlukan')
    const data = await service.inviteAdminUser({
      email: b.email,
      role: typeof b.role === 'string' ? b.role : 'Platform Admin',
    })
    sendSuccess(res, data, 'Admin diundang', 201)
  } catch (err) {
    next(err)
  }
}

export async function deactivateAdminUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deactivateAdminUser(String(req.params.id))
    sendSuccess(res, null, 'Akses admin dicabut')
  } catch (err) {
    next(err)
  }
}

// ── Tickets ──────────────────────────────────────────────────────────────────

export async function listTicketsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.listTickets(new Date()))
  } catch (err) {
    next(err)
  }
}

export async function replyTicketHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id)
    const b = (req.body ?? {}) as Record<string, unknown>
    if (typeof b.message !== 'string') throw new ValidationError('Pesan diperlukan')
    const senderName = req.user?.fullName ?? 'Support'
    const data = await service.replyTicket(id, { senderName, message: b.message }, new Date())
    sendSuccess(res, data, 'Balasan terkirim', 201)
  } catch (err) {
    next(err)
  }
}

export async function setTicketStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id)
    const status = String((req.body as { status?: unknown })?.status ?? '')
    if (!['Open', 'In Progress', 'Closed'].includes(status)) {
      throw new ValidationError('Status tiket tidak valid')
    }
    const data = await service.setTicketStatus(
      id,
      status as 'Open' | 'In Progress' | 'Closed',
      new Date(),
    )
    sendSuccess(res, data, 'Status tiket diperbarui')
  } catch (err) {
    next(err)
  }
}
