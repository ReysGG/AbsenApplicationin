/**
 * shared.service.ts — reference data shared across the dashboard.
 *
 * Currently exposes configurable LeaveType records per workspace. The
 * `LeaveType` model previously had no endpoint (audit §12), so the dashboard
 * fell back to a hardcoded list. This service activates the model and
 * lazily seeds a sensible default set the first time a workspace reads it,
 * so existing workspaces (provisioned before this endpoint existed) still
 * get usable values without a manual migration.
 *
 * Requirements: 11.3
 */

import { prisma } from '../../config/prisma'
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors'

export interface LeaveTypeDto {
  id: string
  name: string
  requiresAttachment: boolean
  status: string
}

/** Default leave types seeded the first time a workspace has none. */
const DEFAULT_LEAVE_TYPES: Array<{ name: string; requiresAttachment: boolean }> = [
  { name: 'Sakit', requiresAttachment: true },
  { name: 'Cuti Tahunan', requiresAttachment: false },
  { name: 'Izin Pribadi', requiresAttachment: false },
  { name: 'Dinas Luar', requiresAttachment: false },
  { name: 'WFH Request', requiresAttachment: false },
  { name: 'Lainnya', requiresAttachment: false },
]

function toDto(row: {
  id: string
  name: string
  requiresAttachment: boolean
  status: string
}): LeaveTypeDto {
  return {
    id: row.id,
    name: row.name,
    requiresAttachment: row.requiresAttachment,
    status: row.status,
  }
}

/**
 * Ensure the workspace has at least the default set of leave types. Uses
 * `createMany` with `skipDuplicates` so concurrent first-reads can't create
 * duplicates (the `@@unique([workspaceId, name])` constraint backs this up).
 */
async function ensureDefaults(workspaceId: string): Promise<void> {
  const count = await prisma.leaveType.count({ where: { workspaceId } })
  if (count > 0) return
  await prisma.leaveType.createMany({
    data: DEFAULT_LEAVE_TYPES.map((t) => ({
      workspaceId,
      name: t.name,
      requiresAttachment: t.requiresAttachment,
      status: 'Active',
    })),
    skipDuplicates: true,
  })
}

/** List active leave types for a workspace (lazily seeding defaults). */
export async function listLeaveTypes(workspaceId: string): Promise<LeaveTypeDto[]> {
  await ensureDefaults(workspaceId)
  const rows = await prisma.leaveType.findMany({
    where: { workspaceId, status: 'Active' },
    orderBy: { name: 'asc' },
  })
  return rows.map(toDto)
}

/** Create a new leave type for the workspace. */
export async function createLeaveType(
  workspaceId: string,
  input: { name: string; requiresAttachment?: boolean },
): Promise<LeaveTypeDto> {
  const name = input.name?.trim()
  if (!name) throw new ValidationError('Nama tipe izin wajib diisi')

  const existing = await prisma.leaveType.findFirst({
    where: { workspaceId, name },
  })
  if (existing) throw new ConflictError('Tipe izin dengan nama tersebut sudah ada')

  const row = await prisma.leaveType.create({
    data: {
      workspaceId,
      name,
      requiresAttachment: input.requiresAttachment ?? false,
      status: 'Active',
    },
  })
  return toDto(row)
}

/** Update a leave type (rename / toggle attachment / activate-deactivate). */
export async function updateLeaveType(
  workspaceId: string,
  id: string,
  input: { name?: string; requiresAttachment?: boolean; status?: 'Active' | 'Inactive' },
): Promise<LeaveTypeDto> {
  const existing = await prisma.leaveType.findFirst({ where: { id, workspaceId } })
  if (!existing) throw new NotFoundError('Tipe izin')

  const data: Record<string, unknown> = {}
  if (typeof input.name === 'string' && input.name.trim()) data.name = input.name.trim()
  if (typeof input.requiresAttachment === 'boolean') {
    data.requiresAttachment = input.requiresAttachment
  }
  if (input.status === 'Active' || input.status === 'Inactive') data.status = input.status

  const row = await prisma.leaveType.update({ where: { id }, data })
  return toDto(row)
}
