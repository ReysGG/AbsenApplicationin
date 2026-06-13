/**
 * leaveTypes.itest.ts — DB-backed integration test (audit §16).
 *
 * Unlike the unit suite (which mocks Prisma), this exercises the real Prisma
 * client + SQL + the `@@unique([workspaceId, name])` constraint against a live
 * Postgres. It self-skips when DATABASE_URL is not configured so it never runs
 * in the hermetic unit job.
 *
 * Run: npm run test:integration   (with a live DATABASE_URL)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { randomBytes } from 'crypto'

const HAS_DB = !!process.env.DATABASE_URL

describe.skipIf(!HAS_DB)('leave-types service (integration, real DB)', () => {
  // Imported lazily so the unit job never loads the real prisma/env modules.
  let prisma: typeof import('../../config/prisma').prisma
  let listLeaveTypes: typeof import('../../modules/shared/shared.service').listLeaveTypes
  let createLeaveType: typeof import('../../modules/shared/shared.service').createLeaveType

  let tenantId = ''
  let workspaceId = ''

  beforeAll(async () => {
    ;({ prisma } = await import('../../config/prisma'))
    ;({ listLeaveTypes, createLeaveType } = await import('../../modules/shared/shared.service'))

    const suffix = randomBytes(4).toString('hex')
    const tenant = await prisma.tenant.create({
      data: { name: `IT Tenant ${suffix}`, slug: `it-tenant-${suffix}`, status: 'Active' },
    })
    tenantId = tenant.id
    const workspace = await prisma.workspace.create({
      data: { tenantId, name: `IT Workspace ${suffix}`, status: 'Active' },
    })
    workspaceId = workspace.id
  })

  afterAll(async () => {
    if (!workspaceId) return
    await prisma.leaveType.deleteMany({ where: { workspaceId } })
    await prisma.workspace.deleteMany({ where: { id: workspaceId } })
    await prisma.tenant.deleteMany({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('lazily seeds the default leave types on first read', async () => {
    const types = await listLeaveTypes(workspaceId)
    expect(types.length).toBeGreaterThanOrEqual(6)
    expect(types.map((t) => t.name)).toContain('Cuti Tahunan')
    // "Sakit" requires an attachment in the defaults.
    const sakit = types.find((t) => t.name === 'Sakit')
    expect(sakit?.requiresAttachment).toBe(true)
  })

  it('does not duplicate defaults on subsequent reads', async () => {
    const first = await listLeaveTypes(workspaceId)
    const second = await listLeaveTypes(workspaceId)
    expect(second.length).toBe(first.length)
  })

  it('enforces the unique name constraint within a workspace', async () => {
    await createLeaveType(workspaceId, { name: `Unik ${randomBytes(2).toString('hex')}` })
    // Re-creating an existing default name must be rejected.
    await expect(createLeaveType(workspaceId, { name: 'Cuti Tahunan' })).rejects.toBeTruthy()
  })
})
