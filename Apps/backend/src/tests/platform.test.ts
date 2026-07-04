import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '../config/prisma'
import { deactivateAdminUser, inviteAdminUser } from '../modules/platform/platform.service'
import { ConflictError, ForbiddenError, ValidationError } from '../lib/errors'
import type { PlatformActor } from '../types/auth'

const SUPER_ADMIN: PlatformActor = { userId: 'actor-super', globalRole: 'super_admin' }
const PLATFORM_ADMIN: PlatformActor = { userId: 'actor-platform', globalRole: 'admin_platform' }

const TARGET_USER = {
  id: 'target-user',
  email: 'target@example.com',
  fullName: 'Target User',
  globalRole: 'user',
  status: 'Active',
  lastLoginAt: null,
}

describe('platform admin role hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin_platform cannot grant Super Admin', async () => {
    await expect(
      inviteAdminUser(
        { email: 'target@example.com', role: 'Super Admin' },
        PLATFORM_ADMIN,
      ),
    ).rejects.toThrow(ForbiddenError)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('admin_platform can grant Platform Admin', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(TARGET_USER as never)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      ...TARGET_USER,
      globalRole: 'admin_platform',
    } as never)

    const result = await inviteAdminUser(
      { email: 'target@example.com', role: 'Platform Admin' },
      PLATFORM_ADMIN,
    )

    expect(result.role).toBe('Platform Admin')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { globalRole: 'admin_platform' },
      }),
    )
  })

  it('super_admin can grant Super Admin', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(TARGET_USER as never)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      ...TARGET_USER,
      globalRole: 'super_admin',
    } as never)

    const result = await inviteAdminUser(
      { email: 'target@example.com', role: 'Super Admin' },
      SUPER_ADMIN,
    )

    expect(result.role).toBe('Super Admin')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { globalRole: 'super_admin' },
      }),
    )
  })

  it('rejects unknown platform role labels', async () => {
    await expect(
      inviteAdminUser(
        { email: 'target@example.com', role: 'Owner' },
        SUPER_ADMIN,
      ),
    ).rejects.toThrow(ValidationError)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('admin_platform cannot revoke a Super Admin', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      ...TARGET_USER,
      globalRole: 'super_admin',
    } as never)

    await expect(deactivateAdminUser('target-user', PLATFORM_ADMIN)).rejects.toThrow(ForbiddenError)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('cannot revoke own platform access', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      ...TARGET_USER,
      id: SUPER_ADMIN.userId,
      globalRole: 'super_admin',
    } as never)

    await expect(deactivateAdminUser(SUPER_ADMIN.userId, SUPER_ADMIN)).rejects.toThrow(ForbiddenError)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('does not revoke the last Super Admin', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      ...TARGET_USER,
      globalRole: 'super_admin',
    } as never)
    vi.mocked(prisma.user.count).mockResolvedValueOnce(1 as never)

    await expect(deactivateAdminUser('target-user', SUPER_ADMIN)).rejects.toThrow(ConflictError)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
