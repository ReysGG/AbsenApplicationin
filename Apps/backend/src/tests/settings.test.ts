/**
 * settings.test.ts — Unit tests for Settings & Audit service functions.
 *
 * Requirements validated:
 *   Settings: 13.1–13.12, 3.8, 3.9, 3.12
 *   Audit:    14.1–14.7
 *
 * Tests:
 *   - Get workspace settings → success
 *   - Update workspace settings → success + audit (update_workspace_setting)
 *   - Update workspace settings by non-Stakeholder with manage_roles → success
 *   - Update workspace settings by non-Stakeholder without manage_roles → ForbiddenError
 *   - Assign role (Stakeholder) → success + audit (update_role_permission)
 *   - Assign role (Support Admin) → ForbiddenError
 *   - Remove last Stakeholder → ConflictError
 *   - Remove non-last Stakeholder → success
 *   - Remove Support Admin role → success
 *   - List holidays → filtered by year/status
 *   - Create holiday → success
 *   - Create duplicate holiday → ConflictError
 *   - Update holiday → success
 *   - Delete holiday → success
 *   - List audit logs → paginated, scope-filtered
 *   - Get audit log by id → success
 *   - Get audit log by id not in scope → ForbiddenError
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing services
// ---------------------------------------------------------------------------
vi.mock('../config/prisma', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    roleAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
    holidayCalendar: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    INTERNAL_JWT_SECRET: 'test-secret-minimum-32-characters-long-ok',
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getRoleAssignments,
  assignRole,
  removeRole,
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../modules/settings/settings.service'
import { listAuditLogs, getAuditLogById } from '../modules/audit/audit.service'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-001'
const ACTOR_ID = 'user-actor-001'
const STAKEHOLDER_ROLES = ['stakeholder']
const SUPPORT_ADMIN_ROLES = ['support_admin']

const MOCK_WORKSPACE = {
  id: WORKSPACE_ID,
  name: 'Test Workspace',
  timezone: 'Asia/Jakarta',
  defaultGeofenceRadius: 100,
  defaultGracePeriod: 10,
  absenceCutoffMinutes: 120,
  wfhEnabled: false,
  hybridEnabled: false,
  latePolicy: null,
  missingCheckoutPolicy: null,
  exportPermissions: null,
  status: 'Active',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
}

const MOCK_ROLE_ASSIGNMENT = {
  id: 'ra-001',
  workspaceId: WORKSPACE_ID,
  userId: 'user-001',
  role: 'stakeholder',
  scopeType: 'workspace',
  scopeId: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  user: { id: 'user-001', email: 'user@test.com', fullName: 'Test User' },
  permissions: [],
}

const MOCK_HOLIDAY = {
  id: 'hol-001',
  workspaceId: WORKSPACE_ID,
  date: new Date('2024-08-17T00:00:00.000Z'),
  name: 'Hari Kemerdekaan',
  recurringYearly: true,
  status: 'Active',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
}

const MOCK_AUDIT_LOG = {
  id: 'audit-001',
  workspaceId: WORKSPACE_ID,
  actorUserId: ACTOR_ID,
  action: 'update_workspace_setting',
  entityType: 'Workspace',
  entityId: WORKSPACE_ID,
  oldValue: { name: 'Old Name' },
  newValue: { name: 'New Name' },
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  requestId: 'req-001',
  createdAt: new Date('2024-06-01T10:00:00Z'),
}

// ---------------------------------------------------------------------------
// getWorkspaceSettings
// ---------------------------------------------------------------------------

describe('getWorkspaceSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns workspace settings when workspace exists', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(MOCK_WORKSPACE as never)

    const result = await getWorkspaceSettings(WORKSPACE_ID)

    expect(result.id).toBe(WORKSPACE_ID)
    expect(result.name).toBe('Test Workspace')
    expect(result.timezone).toBe('Asia/Jakarta')
    expect(result.defaultGeofenceRadius).toBe(100)
    expect(result.wfhEnabled).toBe(false)
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
  })

  it('throws NotFoundError when workspace does not exist', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(null as never)

    await expect(getWorkspaceSettings('non-existent')).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// updateWorkspaceSettings
// ---------------------------------------------------------------------------

describe('updateWorkspaceSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('Stakeholder can update settings and writes audit', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(MOCK_WORKSPACE as never)
    vi.mocked(prisma.workspace.update).mockResolvedValueOnce({
      ...MOCK_WORKSPACE,
      name: 'Updated Workspace',
      updatedAt: new Date('2024-06-01T00:00:00Z'),
    } as never)

    const result = await updateWorkspaceSettings({
      workspaceId: WORKSPACE_ID,
      input: { name: 'Updated Workspace' },
      actorUserId: ACTOR_ID,
      actorRoles: STAKEHOLDER_ROLES,
      actorPermissions: [],
    })

    expect(result.name).toBe('Updated Workspace')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'update_workspace_setting',
          entityType: 'Workspace',
          actorUserId: ACTOR_ID,
          workspaceId: WORKSPACE_ID,
        }),
      }),
    )
  })

  it('Support Admin with manage_roles can update settings', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(MOCK_WORKSPACE as never)
    vi.mocked(prisma.workspace.update).mockResolvedValueOnce({
      ...MOCK_WORKSPACE,
      wfhEnabled: true,
      updatedAt: new Date('2024-06-01T00:00:00Z'),
    } as never)

    const result = await updateWorkspaceSettings({
      workspaceId: WORKSPACE_ID,
      input: { wfhEnabled: true },
      actorUserId: ACTOR_ID,
      actorRoles: SUPPORT_ADMIN_ROLES,
      actorPermissions: ['manage_roles'],
    })

    expect(result.wfhEnabled).toBe(true)
  })

  it('Support Admin WITHOUT manage_roles cannot update settings → ForbiddenError', async () => {
    await expect(
      updateWorkspaceSettings({
        workspaceId: WORKSPACE_ID,
        input: { name: 'Hack' },
        actorUserId: ACTOR_ID,
        actorRoles: SUPPORT_ADMIN_ROLES,
        actorPermissions: ['view_dashboard'],
      }),
    ).rejects.toThrow(ForbiddenError)

    // workspace.update should NOT be called
    expect(prisma.workspace.update).not.toHaveBeenCalled()
  })

  it('only records changed fields in audit old/new values', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(MOCK_WORKSPACE as never)
    vi.mocked(prisma.workspace.update).mockResolvedValueOnce({
      ...MOCK_WORKSPACE,
      timezone: 'UTC',
      updatedAt: new Date(),
    } as never)

    await updateWorkspaceSettings({
      workspaceId: WORKSPACE_ID,
      input: { timezone: 'UTC' },
      actorUserId: ACTOR_ID,
      actorRoles: STAKEHOLDER_ROLES,
      actorPermissions: [],
    })

    const auditCall = vi.mocked(prisma.auditLog.create).mock.calls[0][0] as {
      data: Record<string, unknown>
    }
    const oldVal = auditCall.data['oldValue'] as Record<string, unknown>
    const newVal = auditCall.data['newValue'] as Record<string, unknown>
    expect(oldVal['timezone']).toBe('Asia/Jakarta')
    expect(newVal['timezone']).toBe('UTC')
    // Should not include unchanged fields
    expect(oldVal).not.toHaveProperty('name')
  })
})

// ---------------------------------------------------------------------------
// assignRole
// ---------------------------------------------------------------------------

describe('assignRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(prisma.employee.findFirst).mockResolvedValue({ id: 'emp-001' } as never)
  })

  it('Stakeholder can assign a role and writes audit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-002',
      email: 'newuser@test.com',
      fullName: 'New User',
    } as never)
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.permission.findMany).mockResolvedValueOnce([
      { id: 'perm-001', key: 'view_dashboard' },
    ] as never)
    vi.mocked(prisma.roleAssignment.create).mockResolvedValueOnce({
      id: 'ra-new',
      workspaceId: WORKSPACE_ID,
      userId: 'user-002',
      role: 'support_admin',
      scopeType: 'workspace',
      scopeId: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      user: { id: 'user-002', email: 'newuser@test.com', fullName: 'New User' },
      permissions: [{ permission: { key: 'view_dashboard' } }],
    } as never)

    const result = await assignRole({
      workspaceId: WORKSPACE_ID,
      input: {
        userId: 'user-002',
        role: 'support_admin',
        scopeType: 'workspace',
        scopeId: null,
        permissions: ['view_dashboard'],
      },
      actorUserId: ACTOR_ID,
      actorRoles: STAKEHOLDER_ROLES,
    })

    expect(result.id).toBe('ra-new')
    expect(result.role).toBe('support_admin')
    expect(result.permissions).toContain('view_dashboard')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'update_role_permission',
          entityType: 'RoleAssignment',
        }),
      }),
    )
  })

  it('Support Admin cannot assign roles → ForbiddenError', async () => {
    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'end_user',
          scopeType: 'workspace',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: SUPPORT_ADMIN_ROLES,
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ConflictError when duplicate role assignment', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-002',
      email: 'newuser@test.com',
      fullName: 'New User',
    } as never)
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce({
      id: 'existing-ra',
    } as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'support_admin',
          scopeType: 'workspace',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('rejects a global user that is not connected to the workspace', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-foreign',
      email: 'foreign@test.com',
      fullName: 'Foreign User',
    } as never)
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-foreign',
          role: 'support_admin',
          scopeType: 'workspace',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(ForbiddenError)

    expect(prisma.roleAssignment.create).not.toHaveBeenCalled()
  })

  it('allows a target user with an existing workspace role assignment', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-002',
      email: 'newuser@test.com',
      fullName: 'New User',
    } as never)
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.roleAssignment.findFirst)
      .mockResolvedValueOnce({ id: 'membership-ra' } as never)
      .mockResolvedValueOnce(null as never)
    vi.mocked(prisma.roleAssignment.create).mockResolvedValueOnce({
      id: 'ra-new',
      workspaceId: WORKSPACE_ID,
      userId: 'user-002',
      role: 'support_admin',
      scopeType: 'workspace',
      scopeId: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      user: { id: 'user-002', email: 'newuser@test.com', fullName: 'New User' },
      permissions: [],
    } as never)

    const result = await assignRole({
      workspaceId: WORKSPACE_ID,
      input: {
        userId: 'user-002',
        role: 'support_admin',
        scopeType: 'workspace',
        permissions: [],
      },
      actorUserId: ACTOR_ID,
      actorRoles: STAKEHOLDER_ROLES,
    })

    expect(result.id).toBe('ra-new')
  })

  it('rejects workspace scope with a scopeId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-002' } as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'support_admin',
          scopeType: 'workspace',
          scopeId: 'dept-foreign',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects department scope without a scopeId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-002' } as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'support_admin',
          scopeType: 'department',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects department scope outside the workspace', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-002' } as never)
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'support_admin',
          scopeType: 'department',
          scopeId: 'dept-foreign',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('rejects location scope outside the workspace', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-002' } as never)
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'support_admin',
          scopeType: 'location',
          scopeId: 'loc-foreign',
          permissions: [],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('rejects unknown permission keys', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-002' } as never)
    vi.mocked(prisma.permission.findMany).mockResolvedValueOnce([
      { id: 'perm-001', key: 'view_dashboard' },
    ] as never)

    await expect(
      assignRole({
        workspaceId: WORKSPACE_ID,
        input: {
          userId: 'user-002',
          role: 'support_admin',
          scopeType: 'workspace',
          permissions: ['view_dashboard', 'unknown_permission'],
        },
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(ValidationError)

    expect(prisma.roleAssignment.create).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// removeRole
// ---------------------------------------------------------------------------

describe('removeRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('prevents removing the last Stakeholder → ConflictError', async () => {
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce({
      ...MOCK_ROLE_ASSIGNMENT,
      role: 'stakeholder',
    } as never)
    vi.mocked(prisma.roleAssignment.count).mockResolvedValueOnce(1 as never)

    await expect(
      removeRole({
        workspaceId: WORKSPACE_ID,
        roleAssignmentId: MOCK_ROLE_ASSIGNMENT.id,
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(ConflictError)

    // Should NOT call delete
    expect(prisma.roleAssignment.delete).not.toHaveBeenCalled()
  })

  it('allows removing a non-last Stakeholder', async () => {
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce({
      ...MOCK_ROLE_ASSIGNMENT,
      role: 'stakeholder',
    } as never)
    vi.mocked(prisma.roleAssignment.count).mockResolvedValueOnce(2 as never) // 2 stakeholders
    vi.mocked(prisma.roleAssignment.delete).mockResolvedValueOnce({} as never)

    await removeRole({
      workspaceId: WORKSPACE_ID,
      roleAssignmentId: MOCK_ROLE_ASSIGNMENT.id,
      actorUserId: ACTOR_ID,
      actorRoles: STAKEHOLDER_ROLES,
    })

    expect(prisma.roleAssignment.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: MOCK_ROLE_ASSIGNMENT.id } }),
    )
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'update_role_permission' }),
      }),
    )
  })

  it('allows removing a Support Admin role assignment', async () => {
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce({
      ...MOCK_ROLE_ASSIGNMENT,
      role: 'support_admin',
    } as never)
    vi.mocked(prisma.roleAssignment.delete).mockResolvedValueOnce({} as never)

    await removeRole({
      workspaceId: WORKSPACE_ID,
      roleAssignmentId: MOCK_ROLE_ASSIGNMENT.id,
      actorUserId: ACTOR_ID,
      actorRoles: STAKEHOLDER_ROLES,
    })

    // count should NOT have been called for non-stakeholder role
    expect(prisma.roleAssignment.count).not.toHaveBeenCalled()
    expect(prisma.roleAssignment.delete).toHaveBeenCalled()
  })

  it('Support Admin cannot remove roles → ForbiddenError', async () => {
    await expect(
      removeRole({
        workspaceId: WORKSPACE_ID,
        roleAssignmentId: 'ra-some',
        actorUserId: ACTOR_ID,
        actorRoles: SUPPORT_ADMIN_ROLES,
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when role assignment does not exist', async () => {
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      removeRole({
        workspaceId: WORKSPACE_ID,
        roleAssignmentId: 'non-existent',
        actorUserId: ACTOR_ID,
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// listHolidays
// ---------------------------------------------------------------------------

describe('listHolidays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns holidays for the workspace', async () => {
    vi.mocked(prisma.holidayCalendar.findMany).mockResolvedValueOnce([MOCK_HOLIDAY] as never)

    const result = await listHolidays(WORKSPACE_ID)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Hari Kemerdekaan')
    expect(result[0].date).toBe('2024-08-17')
    expect(result[0].recurringYearly).toBe(true)
  })

  it('filters by year when provided', async () => {
    vi.mocked(prisma.holidayCalendar.findMany).mockResolvedValueOnce([MOCK_HOLIDAY] as never)

    await listHolidays(WORKSPACE_ID, 2024)

    const callArg = vi.mocked(prisma.holidayCalendar.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(callArg.where).toHaveProperty('date')
  })

  it('returns empty array when no holidays exist', async () => {
    vi.mocked(prisma.holidayCalendar.findMany).mockResolvedValueOnce([] as never)

    const result = await listHolidays(WORKSPACE_ID)
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// createHoliday
// ---------------------------------------------------------------------------

describe('createHoliday', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('creates a holiday successfully', async () => {
    vi.mocked(prisma.holidayCalendar.findFirst).mockResolvedValueOnce(null as never)
    vi.mocked(prisma.holidayCalendar.create).mockResolvedValueOnce(MOCK_HOLIDAY as never)

    const result = await createHoliday({
      workspaceId: WORKSPACE_ID,
      input: { date: '2024-08-17', name: 'Hari Kemerdekaan', recurringYearly: true, status: 'Active' },
      actorUserId: ACTOR_ID,
    })

    expect(result.name).toBe('Hari Kemerdekaan')
    expect(result.date).toBe('2024-08-17')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'create_holiday' }),
      }),
    )
  })

  it('throws ConflictError when holiday with same date and name exists', async () => {
    vi.mocked(prisma.holidayCalendar.findFirst).mockResolvedValueOnce(MOCK_HOLIDAY as never)

    await expect(
      createHoliday({
        workspaceId: WORKSPACE_ID,
        input: { date: '2024-08-17', name: 'Hari Kemerdekaan', recurringYearly: true, status: 'Active' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })
})

// ---------------------------------------------------------------------------
// updateHoliday
// ---------------------------------------------------------------------------

describe('updateHoliday', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('updates holiday name successfully', async () => {
    vi.mocked(prisma.holidayCalendar.findFirst).mockResolvedValueOnce(MOCK_HOLIDAY as never)
    vi.mocked(prisma.holidayCalendar.update).mockResolvedValueOnce({
      ...MOCK_HOLIDAY,
      name: 'Kemerdekaan RI',
      updatedAt: new Date('2024-06-01T00:00:00Z'),
    } as never)

    const result = await updateHoliday({
      workspaceId: WORKSPACE_ID,
      holidayId: MOCK_HOLIDAY.id,
      input: { name: 'Kemerdekaan RI' },
      actorUserId: ACTOR_ID,
    })

    expect(result.name).toBe('Kemerdekaan RI')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'update_holiday' }),
      }),
    )
  })

  it('throws NotFoundError when holiday does not exist', async () => {
    vi.mocked(prisma.holidayCalendar.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateHoliday({
        workspaceId: WORKSPACE_ID,
        holidayId: 'non-existent',
        input: { name: 'New Name' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// deleteHoliday
// ---------------------------------------------------------------------------

describe('deleteHoliday', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('deletes a holiday successfully', async () => {
    vi.mocked(prisma.holidayCalendar.findFirst).mockResolvedValueOnce(MOCK_HOLIDAY as never)
    vi.mocked(prisma.holidayCalendar.delete).mockResolvedValueOnce({} as never)

    await deleteHoliday({
      workspaceId: WORKSPACE_ID,
      holidayId: MOCK_HOLIDAY.id,
      actorUserId: ACTOR_ID,
    })

    expect(prisma.holidayCalendar.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: MOCK_HOLIDAY.id } }),
    )
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'delete_holiday' }),
      }),
    )
  })

  it('throws NotFoundError when holiday does not exist', async () => {
    vi.mocked(prisma.holidayCalendar.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      deleteHoliday({
        workspaceId: WORKSPACE_ID,
        holidayId: 'non-existent',
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// listAuditLogs
// ---------------------------------------------------------------------------

describe('listAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated audit logs for Stakeholder', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(1 as never)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([MOCK_AUDIT_LOG] as never)

    const result = await listAuditLogs({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      actorRoles: STAKEHOLDER_ROLES,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].action).toBe('update_workspace_setting')
    expect(result.pagination.total).toBe(1)
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.page_size).toBe(25)
    expect(result.pagination.total_pages).toBe(1)
  })

  it('applies date, actor, action filters', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(1 as never)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([MOCK_AUDIT_LOG] as never)

    await listAuditLogs({
      workspaceId: WORKSPACE_ID,
      query: {
        page: 1,
        page_size: 25,
        start_date: '2024-06-01',
        end_date: '2024-06-30',
        actor: ACTOR_ID,
        action: 'update_workspace',
      },
      actorRoles: STAKEHOLDER_ROLES,
    })

    const countCall = vi.mocked(prisma.auditLog.count).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    // Should have AND clause with filters
    expect(countCall.where).toHaveProperty('AND')
  })

  it('scope-limited Support Admin sees limited results', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([] as never)

    const result = await listAuditLogs({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      actorRoles: SUPPORT_ADMIN_ROLES,
      scopeFilter: {
        departmentIds: ['dept-001'],
        locationIds: [],
        isWorkspaceScope: false,
      },
    })

    // The where clause should restrict by scope
    const findCall = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(findCall.where).toHaveProperty('OR')
    expect(result.items).toHaveLength(0)
  })

  it('returns empty items when no logs match', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(0 as never)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([] as never)

    const result = await listAuditLogs({
      workspaceId: WORKSPACE_ID,
      query: { page: 1, page_size: 25 },
      actorRoles: STAKEHOLDER_ROLES,
    })

    expect(result.items).toHaveLength(0)
    expect(result.pagination.total).toBe(0)
    expect(result.pagination.total_pages).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getAuditLogById
// ---------------------------------------------------------------------------

describe('getAuditLogById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns audit log by id for Stakeholder', async () => {
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValueOnce(MOCK_AUDIT_LOG as never)

    const result = await getAuditLogById({
      workspaceId: WORKSPACE_ID,
      auditId: MOCK_AUDIT_LOG.id,
      actorRoles: STAKEHOLDER_ROLES,
    })

    expect(result.id).toBe(MOCK_AUDIT_LOG.id)
    expect(result.action).toBe('update_workspace_setting')
    expect(result.createdAt).toBe('2024-06-01T10:00:00.000Z')
  })

  it('returns audit log for Support Admin when entityId is in scope', async () => {
    const logInScope = {
      ...MOCK_AUDIT_LOG,
      entityType: 'Department',
      entityId: 'dept-001',
    }
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValueOnce(logInScope as never)

    const result = await getAuditLogById({
      workspaceId: WORKSPACE_ID,
      auditId: MOCK_AUDIT_LOG.id,
      actorRoles: SUPPORT_ADMIN_ROLES,
      scopeFilter: {
        departmentIds: ['dept-001'],
        locationIds: [],
        isWorkspaceScope: false,
      },
    })

    expect(result.entityId).toBe('dept-001')
  })

  it('throws ForbiddenError when Support Admin has no scope for the log', async () => {
    const logOutOfScope = {
      ...MOCK_AUDIT_LOG,
      entityType: 'Department',
      entityId: 'dept-999',
    }
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValueOnce(logOutOfScope as never)

    await expect(
      getAuditLogById({
        workspaceId: WORKSPACE_ID,
        auditId: MOCK_AUDIT_LOG.id,
        actorRoles: SUPPORT_ADMIN_ROLES,
        scopeFilter: {
          departmentIds: ['dept-001'],
          locationIds: [],
          isWorkspaceScope: false,
        },
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when audit log does not exist', async () => {
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      getAuditLogById({
        workspaceId: WORKSPACE_ID,
        auditId: 'non-existent',
        actorRoles: STAKEHOLDER_ROLES,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})
