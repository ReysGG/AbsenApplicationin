/**
 * platform.service.ts — business logic for the platform-admin console.
 *
 * Cross-tenant: these functions are NOT workspace-scoped. They power the
 * /admin console (tenants, billing/invoices, admin-users, support tickets) and
 * are reachable only behind requirePlatformAdmin.
 *
 * DTO shapes mirror the frontend types in Apps/website/app/admin/*.
 */

import { prisma } from '../../config/prisma'
import { NotFoundError, ValidationError } from '../../lib/errors'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "2 hours ago" style relative time — frontend shows lastActive/updatedAt. */
function relativeTime(date: Date | null, now: Date): string {
  if (!date) return '—'
  const diffMs = now.getTime() - date.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min} min${min > 1 ? 's' : ''} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`
  const d = Math.floor(hr / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

// ---------------------------------------------------------------------------
// Tenants
// ---------------------------------------------------------------------------

export interface TenantDto {
  id: string
  name: string
  domain: string
  plan: string
  users: number
  status: string // Active | Suspended | Inactive
  lastActive: string
  mrr: number
}

const PLAN_MRR: Record<string, number> = { Enterprise: 499, Pro: 199, Basic: 49 }

export async function listTenants(now: Date): Promise<TenantDto[]> {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      workspaces: {
        select: {
          id: true,
          updatedAt: true,
          _count: { select: { employees: true } },
        },
      },
    },
  })

  return tenants.map((t) => {
    const users = t.workspaces.reduce(
      (sum, w) => sum + ((w as { _count?: { employees: number } })._count?.employees ?? 0),
      0,
    )
    const lastWs = t.workspaces
      .map((w) => w.updatedAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? t.updatedAt
    const plan = t.plan ?? 'Basic'
    return {
      id: t.id,
      name: t.name,
      domain: `${t.slug}.attendx.io`,
      plan,
      users,
      status: t.status as string,
      lastActive: relativeTime(lastWs, now),
      mrr: PLAN_MRR[plan] ?? 0,
    }
  })
}

export async function createTenant(input: {
  name: string
  slug?: string
  plan?: string
}): Promise<TenantDto> {
  const name = input.name?.trim()
  if (!name) throw new ValidationError('Nama tenant diperlukan')
  const slug =
    (input.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) ||
    'tenant'

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) throw new ValidationError('Slug tenant sudah dipakai')

  const plan = input.plan ?? 'Basic'
  const t = await prisma.tenant.create({
    data: { name, slug, plan, status: 'Active' },
  })
  return {
    id: t.id,
    name: t.name,
    domain: `${t.slug}.attendx.io`,
    plan,
    users: 0,
    status: t.status as string,
    lastActive: 'Just now',
    mrr: PLAN_MRR[plan] ?? 0,
  }
}

export async function updateTenantStatus(
  id: string,
  status: 'Active' | 'Suspended' | 'Inactive',
): Promise<void> {
  const t = await prisma.tenant.findUnique({ where: { id } })
  if (!t) throw new NotFoundError('Tenant')
  await prisma.tenant.update({ where: { id }, data: { status } })
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export interface InvoiceDto {
  id: string
  tenant: string
  plan: string
  amount: number
  status: string // Paid | Pending | Overdue
  dueDate: string
  issuedDate: string
}

interface InvoiceRow {
  id: string
  plan: string
  amountCents: number
  status: string
  issuedDate: Date
  dueDate: Date
  tenant?: { name: string } | null
}

function toInvoiceDto(row: InvoiceRow): InvoiceDto {
  return {
    id: row.id,
    tenant: row.tenant?.name ?? '—',
    plan: row.plan,
    amount: Math.round(row.amountCents / 100),
    status: row.status,
    dueDate: row.dueDate.toISOString().slice(0, 10),
    issuedDate: row.issuedDate.toISOString().slice(0, 10),
  }
}

export async function listInvoices(): Promise<InvoiceDto[]> {
  const rows = (await prisma.invoice.findMany({
    orderBy: { issuedDate: 'desc' },
    include: { tenant: { select: { name: true } } },
  })) as InvoiceRow[]
  return rows.map(toInvoiceDto)
}

export async function createInvoice(input: {
  tenantId: string
  plan: string
  amount: number
  dueDate?: string
}): Promise<InvoiceDto> {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } })
  if (!tenant) throw new NotFoundError('Tenant')
  if (!input.plan) throw new ValidationError('Plan diperlukan')
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    throw new ValidationError('Jumlah tidak valid')
  }
  const issued = new Date()
  const due = input.dueDate ? new Date(input.dueDate) : new Date(issued.getTime() + 14 * 86400000)
  const row = (await prisma.invoice.create({
    data: {
      tenantId: input.tenantId,
      plan: input.plan,
      amountCents: Math.round(input.amount * 100),
      status: 'Pending',
      issuedDate: issued,
      dueDate: due,
    },
    include: { tenant: { select: { name: true } } },
  })) as InvoiceRow
  return toInvoiceDto(row)
}

export async function updateInvoiceStatus(
  id: string,
  status: 'Paid' | 'Pending' | 'Overdue',
): Promise<InvoiceDto> {
  const inv = await prisma.invoice.findUnique({ where: { id } })
  if (!inv) throw new NotFoundError('Invoice')
  const row = (await prisma.invoice.update({
    where: { id },
    data: { status },
    include: { tenant: { select: { name: true } } },
  })) as InvoiceRow
  return toInvoiceDto(row)
}

// ---------------------------------------------------------------------------
// Admin users (users whose globalRole != 'user')
// ---------------------------------------------------------------------------

export interface AdminUserDto {
  id: string
  name: string
  email: string
  role: string // mapped from globalRole
  status: string // Active | Inactive
  lastActive: string
}

const ROLE_TO_GLOBAL: Record<string, string> = {
  'Super Admin': 'super_admin',
  'Platform Admin': 'admin_platform',
}
const GLOBAL_TO_ROLE: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_platform: 'Platform Admin',
}

export async function listAdminUsers(now: Date): Promise<AdminUserDto[]> {
  const users = await prisma.user.findMany({
    where: { globalRole: { in: ['super_admin', 'admin_platform'] } },
    orderBy: { createdAt: 'desc' },
  })
  return users.map((u) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: GLOBAL_TO_ROLE[u.globalRole as string] ?? 'Platform Admin',
    status: u.status === 'Active' ? 'Active' : 'Inactive',
    lastActive: relativeTime(u.lastLoginAt, now),
  }))
}

/** Promote an existing app user to a platform role by email. */
export async function inviteAdminUser(input: {
  email: string
  role: string
}): Promise<AdminUserDto> {
  const email = input.email?.trim().toLowerCase()
  if (!email) throw new ValidationError('Email diperlukan')
  const globalRole = ROLE_TO_GLOBAL[input.role] ?? 'admin_platform'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new NotFoundError('User dengan email tersebut (harus sudah terdaftar)')
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { globalRole: globalRole as never },
  })
  return {
    id: updated.id,
    name: updated.fullName,
    email: updated.email,
    role: GLOBAL_TO_ROLE[globalRole] ?? 'Platform Admin',
    status: updated.status === 'Active' ? 'Active' : 'Inactive',
    lastActive: 'Just now',
  }
}

/** Revoke platform access (globalRole → user) or toggle account status. */
export async function deactivateAdminUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new NotFoundError('User')
  await prisma.user.update({
    where: { id },
    data: { globalRole: 'user' as never },
  })
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

const TICKET_STATUS_TO_DB: Record<string, string> = {
  Open: 'Open',
  'In Progress': 'InProgress',
  Closed: 'Closed',
}
const TICKET_STATUS_FROM_DB: Record<string, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  Closed: 'Closed',
}
const TICKET_CAT_FROM_DB: Record<string, string> = {
  Billing: 'Billing',
  Technical: 'Technical',
  FeatureRequest: 'Feature Request',
}

export interface TicketMessageDto {
  id: string
  sender: string // Client | Agent
  senderName: string
  message: string
  time: string
}

export interface TicketDto {
  id: string
  tenant: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  updatedAt: string
  messages: TicketMessageDto[]
}

interface TicketRow {
  id: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  updatedAt: Date
  tenant?: { name: string } | null
  messages?: Array<{
    id: string
    sender: string
    senderName: string
    body: string
    createdAt: Date
  }>
}

function toTicketDto(row: TicketRow, now: Date): TicketDto {
  return {
    id: row.id,
    tenant: row.tenant?.name ?? '—',
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: TICKET_STATUS_FROM_DB[row.status] ?? row.status,
    category: TICKET_CAT_FROM_DB[row.category] ?? row.category,
    updatedAt: relativeTime(row.updatedAt, now),
    messages: (row.messages ?? []).map((m) => ({
      id: m.id,
      sender: m.sender,
      senderName: m.senderName,
      message: m.body,
      time: relativeTime(m.createdAt, now),
    })),
  }
}

export async function listTickets(now: Date): Promise<TicketDto[]> {
  const rows = (await prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      tenant: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })) as TicketRow[]
  return rows.map((r) => toTicketDto(r, now))
}

export async function replyTicket(
  id: string,
  input: { senderName: string; message: string },
  now: Date,
): Promise<TicketDto> {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } })
  if (!ticket) throw new NotFoundError('Tiket')
  if (!input.message?.trim()) throw new ValidationError('Pesan tidak boleh kosong')

  await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      sender: 'Agent',
      senderName: input.senderName || 'Support',
      body: input.message.trim(),
    },
  })
  // Bump updatedAt + move Open → InProgress on first agent reply.
  const row = (await prisma.supportTicket.update({
    where: { id },
    data: { status: ticket.status === 'Open' ? 'InProgress' : ticket.status },
    include: {
      tenant: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })) as TicketRow
  return toTicketDto(row, now)
}

export async function setTicketStatus(
  id: string,
  status: 'Open' | 'In Progress' | 'Closed',
  now: Date,
): Promise<TicketDto> {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } })
  if (!ticket) throw new NotFoundError('Tiket')
  const dbStatus = TICKET_STATUS_TO_DB[status] ?? 'Open'
  const row = (await prisma.supportTicket.update({
    where: { id },
    data: { status: dbStatus as never },
    include: {
      tenant: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })) as TicketRow
  return toTicketDto(row, now)
}
