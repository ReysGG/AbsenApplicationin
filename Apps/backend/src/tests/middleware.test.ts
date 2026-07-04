/**
 * middleware.test.ts — Unit tests for auth/workspace/RBAC/scope middleware.
 *
 * Requirements validated: 3.1, 3.2, 3.3, 3.7, 3.10, 4.2, 4.6, 17.1, 17.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { createHmac } from 'crypto'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing modules that reference it
// ---------------------------------------------------------------------------
vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    roleAssignment: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

// Mock env so INTERNAL_JWT_SECRET is a known value in tests
vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    INTERNAL_JWT_SECRET: 'test-secret-minimum-32-characters-long-ok',
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks are in place
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/authenticate'
import { resolveActiveWorkspace } from '../middleware/resolveActiveWorkspace'
import { requirePermission } from '../middleware/requirePermission'
import { requirePlatformAdmin } from '../middleware/requirePlatformAdmin'
import { enforceScope } from '../middleware/enforceScope'
import {
  PERMISSIONS,
  hasPermission,
  isStakeholder,
  stakeholderHasAllPermissions,
  ALL_PERMISSIONS,
} from '../lib/permissions'
import { UnauthenticatedError, ForbiddenError } from '../lib/errors'
import type { AuthenticatedUser, ScopeAssignment } from '../types/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-secret-minimum-32-characters-long-ok'

function buildContextHeader(payload: object): { contextHeader: string; sigHeader: string } {
  const contextHeader = Buffer.from(JSON.stringify(payload)).toString('base64')
  const sigHeader = createHmac('sha256', TEST_SECRET).update(contextHeader).digest('hex')
  return { contextHeader, sigHeader }
}

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ip: '127.0.0.1',
    path: '/test',
    requestId: 'req-test-id',
    ...overrides,
  } as unknown as Request
}

function mockResponse(): Response {
  return { setHeader: vi.fn() } as unknown as Response
}

function mockNext(): NextFunction & { calls: unknown[][] } {
  const fn = vi.fn() as unknown as NextFunction & { calls: unknown[][] }
  fn.calls = (fn as unknown as { mock: { calls: unknown[][] } }).mock.calls
  return fn
}

function buildAuthenticatedUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    userId: 'user-1',
    authUserId: 'auth-user-1',
    fullName: 'Test User',
    email: 'test@example.com',
    roles: ['support_admin'],
    permissions: [PERMISSIONS.VIEW_DASHBOARD],
    scopeAssignments: [],
    workspaceId: 'ws-1',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests: lib/permissions.ts helpers
// ---------------------------------------------------------------------------

describe('lib/permissions.ts — hasPermission', () => {
  it('stakeholder with any role returns true for any permission', () => {
    expect(
      hasPermission(['stakeholder'], [], PERMISSIONS.MANAGE_ROLES),
    ).toBe(true)
  })

  it('stakeholder implicit grant — stakeholderHasAllPermissions always returns true', () => {
    expect(stakeholderHasAllPermissions()).toBe(true)
  })

  it('support_admin with the permission returns true', () => {
    expect(
      hasPermission(
        ['support_admin'],
        [PERMISSIONS.VIEW_REPORTS],
        PERMISSIONS.VIEW_REPORTS,
      ),
    ).toBe(true)
  })

  it('support_admin without the permission returns false', () => {
    expect(
      hasPermission(
        ['support_admin'],
        [PERMISSIONS.VIEW_REPORTS],
        PERMISSIONS.MANAGE_EMPLOYEES,
      ),
    ).toBe(false)
  })

  it('end_user with no permissions returns false', () => {
    expect(
      hasPermission(['end_user'], [], PERMISSIONS.VIEW_DASHBOARD),
    ).toBe(false)
  })

  it('isStakeholder returns true when roles includes stakeholder', () => {
    expect(isStakeholder(['stakeholder'])).toBe(true)
    expect(isStakeholder(['support_admin', 'stakeholder'])).toBe(true)
  })

  it('isStakeholder returns false when roles does not include stakeholder', () => {
    expect(isStakeholder(['support_admin'])).toBe(false)
    expect(isStakeholder([])).toBe(false)
  })

  it('ALL_PERMISSIONS contains exactly 15 entries', () => {
    expect(ALL_PERMISSIONS).toHaveLength(15)
  })

  it('PERMISSIONS object has all expected keys', () => {
    const keys = Object.keys(PERMISSIONS)
    expect(keys).toContain('MANAGE_EMPLOYEES')
    expect(keys).toContain('VIEW_AUDIT_LOGS')
    expect(keys).toHaveLength(15)
  })
})

// ---------------------------------------------------------------------------
// Tests: authenticate middleware
// ---------------------------------------------------------------------------

describe('authenticate middleware', () => {
  const prismaUserFindUnique = vi.mocked(prisma.user.findUnique)
  const prismaAuditCreate = vi.mocked(prisma.auditLog.create)

  const validPayload = {
    userId: 'user-1',
    authUserId: 'auth-user-1',
    email: 'hr@acme.com',
    fullName: 'HR Manager',
    workspaceId: 'ws-1',
  }

  const dbUserStakeholder = {
    id: 'user-1',
    authUserId: 'auth-user-1',
    email: 'hr@acme.com',
    fullName: 'HR Manager',
    status: 'Active',
    roleAssignments: [
      {
        role: 'stakeholder',
        scopeType: 'workspace',
        scopeId: null,
        permissions: [],
      },
    ],
  }

  const dbUserSupportAdmin = {
    id: 'user-1',
    authUserId: 'auth-user-1',
    email: 'support@acme.com',
    fullName: 'Support Admin',
    status: 'Active',
    roleAssignments: [
      {
        role: 'support_admin',
        scopeType: 'department',
        scopeId: 'dept-1',
        permissions: [
          { permission: { key: PERMISSIONS.VIEW_EMPLOYEES } },
          { permission: { key: PERMISSIONS.VIEW_DASHBOARD } },
        ],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid HMAC + valid user → sets req.user and req.workspaceId', async () => {
    const { contextHeader, sigHeader } = buildContextHeader(validPayload)
    prismaUserFindUnique.mockResolvedValue(dbUserStakeholder as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith() // next() with no args = success
    expect(req.user).toBeDefined()
    expect(req.user?.userId).toBe('user-1')
    expect(req.user?.workspaceId).toBe('ws-1')
    expect(req.workspaceId).toBe('ws-1')
  })

  it('stakeholder gets ALL_PERMISSIONS populated implicitly', async () => {
    const { contextHeader, sigHeader } = buildContextHeader(validPayload)
    prismaUserFindUnique.mockResolvedValue(dbUserStakeholder as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    expect(req.user?.roles).toContain('stakeholder')
    expect(req.user?.permissions).toHaveLength(ALL_PERMISSIONS.length)
  })

  it('support_admin gets only explicitly assigned permissions', async () => {
    const { contextHeader, sigHeader } = buildContextHeader({
      ...validPayload,
      userId: 'user-1',
    })
    prismaUserFindUnique.mockResolvedValue(dbUserSupportAdmin as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    expect(req.user?.roles).toContain('support_admin')
    expect(req.user?.permissions).toContain(PERMISSIONS.VIEW_EMPLOYEES)
    expect(req.user?.permissions).toContain(PERMISSIONS.VIEW_DASHBOARD)
    expect(req.user?.permissions).not.toContain(PERMISSIONS.MANAGE_EMPLOYEES)
  })

  it('scopeAssignments are populated from roleAssignments', async () => {
    const { contextHeader, sigHeader } = buildContextHeader(validPayload)
    prismaUserFindUnique.mockResolvedValue(dbUserSupportAdmin as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    expect(req.user?.scopeAssignments).toHaveLength(1)
    expect(req.user?.scopeAssignments[0]).toEqual({
      scopeType: 'department',
      scopeId: 'dept-1',
    })
  })

  it('platform admin without a workspace assignment is allowed through (no lockout)', async () => {
    // Pure platform admin: globalRole super_admin, no RoleAssignment, and no
    // workspace cookie. Must NOT be locked out (audit §14 latent lockout fix).
    const { contextHeader, sigHeader } = buildContextHeader({
      userId: 'user-1',
      authUserId: 'auth-user-1',
      email: 'platform@attendx.dev',
      fullName: 'Platform Admin',
      // no workspaceId
    })
    prismaUserFindUnique.mockResolvedValue({
      id: 'user-1',
      authUserId: 'auth-user-1',
      email: 'platform@attendx.dev',
      fullName: 'Platform Admin',
      status: 'Active',
      globalRole: 'super_admin',
    } as never)
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValue(null as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith() // success, no error
    expect(req.user).toBeDefined()
    expect(req.user?.userId).toBe('user-1')
    expect(req.user?.workspaceId).toBe('')
    expect(req.user?.roles).toEqual([])
    expect(req.workspaceId).toBeUndefined()
  })

  it('non-platform user without a workspace assignment is rejected', async () => {
    const { contextHeader, sigHeader } = buildContextHeader({
      userId: 'user-1',
      authUserId: 'auth-user-1',
      email: 'orphan@attendx.dev',
      fullName: 'Orphan User',
      // no workspaceId
    })
    prismaUserFindUnique.mockResolvedValue({
      id: 'user-1',
      authUserId: 'auth-user-1',
      email: 'orphan@attendx.dev',
      fullName: 'Orphan User',
      globalRole: 'user',
    } as never)
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValue(null as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
    expect(req.user).toBeUndefined()
  })

  it('missing x-user-context header → UnauthenticatedError', async () => {
    const { sigHeader } = buildContextHeader(validPayload)

    const req = mockRequest({
      headers: { 'x-user-context-sig': sigHeader },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })

  it('missing x-user-context-sig header → UnauthenticatedError', async () => {
    const { contextHeader } = buildContextHeader(validPayload)

    const req = mockRequest({
      headers: { 'x-user-context': contextHeader },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })

  it('invalid HMAC signature → UnauthenticatedError', async () => {
    const { contextHeader } = buildContextHeader(validPayload)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })

  it('tampered payload (valid sig for different payload) → UnauthenticatedError', async () => {
    const original = { ...validPayload }
    const tampered = { ...validPayload, workspaceId: 'ws-malicious' }

    const { sigHeader } = buildContextHeader(original)
    const tamperedHeader = Buffer.from(JSON.stringify(tampered)).toString('base64')

    const req = mockRequest({
      headers: {
        'x-user-context': tamperedHeader,
        'x-user-context-sig': sigHeader, // sig for original, not tampered
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })

  it('user not found in DB → UnauthenticatedError + audit log', async () => {
    const { contextHeader, sigHeader } = buildContextHeader(validPayload)
    prismaUserFindUnique.mockResolvedValueOnce(null)
    prismaAuditCreate.mockResolvedValueOnce({} as never)

    const req = mockRequest({
      headers: {
        'x-user-context': contextHeader,
        'x-user-context-sig': sigHeader,
      },
    })
    const next = mockNext()

    await authenticate(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })
})

// ---------------------------------------------------------------------------
// Tests: resolveActiveWorkspace middleware
// ---------------------------------------------------------------------------

describe('resolveActiveWorkspace middleware', () => {
  const prismaWorkspaceFindUnique = vi.mocked(prisma.workspace.findUnique)
  const prismaRoleAssignmentFindFirst = vi.mocked(prisma.roleAssignment.findFirst)

  const activeWorkspace = {
    id: 'ws-1',
    name: 'Acme Corp',
    status: 'Active',
    timezone: 'Asia/Jakarta',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid workspace + valid role assignment → sets req.activeWorkspace', async () => {
    prismaWorkspaceFindUnique.mockResolvedValueOnce(activeWorkspace as never)
    prismaRoleAssignmentFindFirst.mockResolvedValueOnce({ id: 'ra-1' } as never)

    const req = mockRequest({
      user: buildAuthenticatedUser(),
      workspaceId: 'ws-1',
    })
    const next = mockNext()

    await resolveActiveWorkspace(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.activeWorkspace).toBeDefined()
    expect(req.activeWorkspace?.id).toBe('ws-1')
  })

  it('workspace not found → ForbiddenError', async () => {
    prismaWorkspaceFindUnique.mockResolvedValueOnce(null)

    const req = mockRequest({
      user: buildAuthenticatedUser(),
      workspaceId: 'ws-nonexistent',
    })
    const next = mockNext()

    await resolveActiveWorkspace(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(ForbiddenError)
  })

  it('workspace status not Active → ForbiddenError', async () => {
    prismaWorkspaceFindUnique.mockResolvedValueOnce({
      ...activeWorkspace,
      status: 'Inactive',
    } as never)

    const req = mockRequest({
      user: buildAuthenticatedUser(),
      workspaceId: 'ws-1',
    })
    const next = mockNext()

    await resolveActiveWorkspace(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(ForbiddenError)
  })

  it('user has no role assignment in workspace (cross-workspace) → ForbiddenError + audit', async () => {
    prismaWorkspaceFindUnique.mockResolvedValueOnce(activeWorkspace as never)
    prismaRoleAssignmentFindFirst.mockResolvedValueOnce(null)
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as never)

    const req = mockRequest({
      user: buildAuthenticatedUser(),
      workspaceId: 'ws-1',
    })
    const next = mockNext()

    await resolveActiveWorkspace(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(ForbiddenError)
  })

  it('missing req.user → UnauthenticatedError', async () => {
    const req = mockRequest({ workspaceId: 'ws-1' })
    const next = mockNext()

    await resolveActiveWorkspace(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })
})

// ---------------------------------------------------------------------------
// Tests: requirePermission middleware
// ---------------------------------------------------------------------------

describe('requirePermission middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stakeholder always passes regardless of permission', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['stakeholder'],
        permissions: [], // stakeholder has implicit all
      }),
      workspaceId: 'ws-1',
    })
    const next = mockNext()

    const middleware = requirePermission(PERMISSIONS.MANAGE_ROLES)
    middleware(req, mockResponse(), next)

    // Call next() synchronously — it's an async fn, resolve then check
    return Promise.resolve().then(() => {
      expect(next).toHaveBeenCalledWith()
    })
  })

  it('support_admin with the permission passes', async () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        permissions: [PERMISSIONS.VIEW_REPORTS],
      }),
      workspaceId: 'ws-1',
    })
    const next = mockNext()

    await requirePermission(PERMISSIONS.VIEW_REPORTS)(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
  })

  it('support_admin without the permission → ForbiddenError', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as never)

    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        permissions: [PERMISSIONS.VIEW_DASHBOARD],
      }),
      workspaceId: 'ws-1',
    })
    const next = mockNext()

    await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES)(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(ForbiddenError)
    expect((error as ForbiddenError).message).toContain(PERMISSIONS.MANAGE_EMPLOYEES)
  })

  it('missing req.user → UnauthenticatedError', async () => {
    const req = mockRequest({ workspaceId: 'ws-1' })
    const next = mockNext()

    await requirePermission(PERMISSIONS.VIEW_DASHBOARD)(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })

  it('denied permission triggers audit log (best-effort)', async () => {
    const auditCreate = vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as never)

    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        permissions: [],
      }),
      workspaceId: 'ws-1',
    })

    await requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS)(req, mockResponse(), mockNext())

    expect(auditCreate).toHaveBeenCalledOnce()
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'failed_permission_check_for_sensitive_action',
          entityId: PERMISSIONS.VIEW_AUDIT_LOGS,
        }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Tests: requirePlatformAdmin middleware
// ---------------------------------------------------------------------------

describe('requirePlatformAdmin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows super_admin and attaches platformActor', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ globalRole: 'super_admin' } as never)
    const req = mockRequest({ user: buildAuthenticatedUser() })
    const next = mockNext()

    await requirePlatformAdmin()(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.platformActor).toEqual({ userId: 'user-1', globalRole: 'super_admin' })
  })

  it('allows admin_platform and attaches platformActor', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ globalRole: 'admin_platform' } as never)
    const req = mockRequest({ user: buildAuthenticatedUser() })
    const next = mockNext()

    await requirePlatformAdmin()(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.platformActor).toEqual({ userId: 'user-1', globalRole: 'admin_platform' })
  })

  it('rejects normal users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ globalRole: 'user' } as never)
    const req = mockRequest({ user: buildAuthenticatedUser() })
    const next = mockNext()

    await requirePlatformAdmin()(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(ForbiddenError)
    expect(req.platformActor).toBeUndefined()
  })

  it('missing req.user → UnauthenticatedError', async () => {
    const req = mockRequest()
    const next = mockNext()

    await requirePlatformAdmin()(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })
})

// ---------------------------------------------------------------------------
// Tests: enforceScope middleware
// ---------------------------------------------------------------------------

describe('enforceScope middleware', () => {
  it('stakeholder → req.scopeFilter is undefined (no restriction)', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['stakeholder'],
        scopeAssignments: [{ scopeType: 'workspace', scopeId: null }],
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.scopeFilter).toBeUndefined()
  })

  it('support_admin with workspace scope → isWorkspaceScope: true, no dept/loc filter', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        scopeAssignments: [{ scopeType: 'workspace', scopeId: null }],
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.scopeFilter?.isWorkspaceScope).toBe(true)
    expect(req.scopeFilter?.departmentIds).toHaveLength(0)
    expect(req.scopeFilter?.locationIds).toHaveLength(0)
  })

  it('support_admin with department scope → departmentId filter', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        scopeAssignments: [
          { scopeType: 'department', scopeId: 'dept-1' },
        ],
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(next).toHaveBeenCalledWith()
    expect(req.scopeFilter?.isWorkspaceScope).toBe(false)
    expect(req.scopeFilter?.departmentIds).toEqual(['dept-1'])
    expect(req.scopeFilter?.locationIds).toHaveLength(0)
  })

  it('support_admin with location scope → locationId filter', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        scopeAssignments: [
          { scopeType: 'location', scopeId: 'loc-1' },
        ],
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(req.scopeFilter?.isWorkspaceScope).toBe(false)
    expect(req.scopeFilter?.locationIds).toEqual(['loc-1'])
    expect(req.scopeFilter?.departmentIds).toHaveLength(0)
  })

  it('OR logic: multiple dept + location scopes are unioned', () => {
    const scopeAssignments: ScopeAssignment[] = [
      { scopeType: 'department', scopeId: 'dept-1' },
      { scopeType: 'department', scopeId: 'dept-2' },
      { scopeType: 'location', scopeId: 'loc-1' },
    ]
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        scopeAssignments,
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(req.scopeFilter?.isWorkspaceScope).toBe(false)
    expect(req.scopeFilter?.departmentIds).toEqual(['dept-1', 'dept-2'])
    expect(req.scopeFilter?.locationIds).toEqual(['loc-1'])
  })

  it('support_admin with no scope assignments → empty filter (no data visible)', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        scopeAssignments: [],
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(req.scopeFilter?.isWorkspaceScope).toBe(false)
    expect(req.scopeFilter?.departmentIds).toHaveLength(0)
    expect(req.scopeFilter?.locationIds).toHaveLength(0)
  })

  it('scopeFilter is also attached to req.user.scopeFilter', () => {
    const req = mockRequest({
      user: buildAuthenticatedUser({
        roles: ['support_admin'],
        scopeAssignments: [{ scopeType: 'department', scopeId: 'dept-42' }],
      }),
    })
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    expect(req.user?.scopeFilter).toBe(req.scopeFilter)
  })

  it('missing req.user → UnauthenticatedError', () => {
    const req = mockRequest()
    const next = mockNext()

    enforceScope(req, mockResponse(), next)

    const [error] = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(error).toBeInstanceOf(UnauthenticatedError)
  })
})
