/**
 * locations.test.ts — Unit tests for Location service (Tasks 22 & 23).
 *
 * Requirements validated: 9.1, 9.2, 9.4, 9.5, 9.8, 9.10, 9.13, 9.14, 9.15
 *
 * Tests:
 *   - Create location with valid coords → success (R9.1, R9.2, R9.4)
 *   - Create with radius < 50 → 400 validation error via Zod (R9.5)
 *   - Create with radius > 500 → 400 validation error via Zod (R9.5)
 *   - Default radius: WFHApproved → 150, Office → 100 (R9.5)
 *   - Update location (name change) → success + update_location audit (R9.15)
 *   - Update with radiusMeters change → change_geofence_radius audit (R9.15)
 *   - Deactivate location → success + deactivate_location audit (R9.10, R9.15)
 *   - Reactivate location → success + update_location audit (R9.10, R9.15)
 *   - List locations with status filter (R9.1, R9.11)
 *   - Get location by id (R9.12)
 *   - Get non-existent location → 404 (R9.12)
 *   - Assign WFH location → success (R9.13, R9.14)
 *   - Assign non-WFHApproved location → 400 validation error (R9.14)
 *   - Assign WFH location when already at max 3 → 409 (R9.13)
 *   - Assign duplicate WFH location → 409 (R9.13)
 *   - Remove WFH location assignment → success (R9.13)
 *   - Remove non-existent WFH assignment → 404 (R9.13)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing service
// ---------------------------------------------------------------------------
vi.mock('../config/prisma', () => ({
  prisma: {
    location: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    employeeWfhLocation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
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
  listLocations,
  createLocation,
  getLocationById,
  updateLocation,
  updateLocationStatus,
  listEmployeeWfhLocations,
  assignWfhLocation,
  removeWfhLocation,
} from '../modules/locations/locations.service'
import { createLocationSchema, updateLocationSchema } from '../modules/locations/locations.schema'
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors'

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'ws-test-123'
const ACTOR_ID = 'user-actor-456'
const LOCATION_ID = 'loc-001'
const EMPLOYEE_ID = 'emp-001'

const mockLocationRecord = {
  id: LOCATION_ID,
  name: 'Kantor Pusat',
  type: 'Office',
  address: 'Jl. Sudirman No.1, Jakarta',
  latitude: -6.2146,
  longitude: 106.8451,
  radiusMeters: 100,
  status: 'Active',
  createdBy: ACTOR_ID,
  updatedBy: ACTOR_ID,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  _count: { assignedEmployees: 5 },
}

const mockWfhLocationRecord = {
  id: 'loc-wfh-001',
  name: 'WFH Location Approved',
  type: 'WFHApproved',
  address: null,
  latitude: -6.3,
  longitude: 106.9,
  radiusMeters: 150,
  status: 'Active',
  createdBy: ACTOR_ID,
  updatedBy: ACTOR_ID,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  _count: { assignedEmployees: 0 },
}

const mockEmployeeRecord = { id: EMPLOYEE_ID }

// ---------------------------------------------------------------------------
// Zod schema tests (pure, no DB needed)
// ---------------------------------------------------------------------------

describe('createLocationSchema validation', () => {
  it('accepts a valid location payload with all required fields', () => {
    const result = createLocationSchema.safeParse({
      name: 'Kantor Cabang',
      type: 'Branch',
      latitude: -6.2,
      longitude: 106.8,
      radiusMeters: 100,
    })
    expect(result.success).toBe(true)
  })

  it('rejects radius < 50 (R9.5)', () => {
    const result = createLocationSchema.safeParse({
      name: 'Lokasi Test',
      latitude: -6.2,
      longitude: 106.8,
      radiusMeters: 49,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors['radiusMeters']
      expect(msg).toBeDefined()
      expect(msg![0]).toContain('50')
    }
  })

  it('rejects radius > 500 (R9.5)', () => {
    const result = createLocationSchema.safeParse({
      name: 'Lokasi Test',
      latitude: -6.2,
      longitude: 106.8,
      radiusMeters: 501,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors['radiusMeters']
      expect(msg).toBeDefined()
      expect(msg![0]).toContain('500')
    }
  })

  it('rejects latitude out of range (R9.4)', () => {
    const result = createLocationSchema.safeParse({
      name: 'Test',
      latitude: 91,
      longitude: 106.8,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors['latitude']).toBeDefined()
    }
  })

  it('rejects longitude out of range (R9.4)', () => {
    const result = createLocationSchema.safeParse({
      name: 'Test',
      latitude: -6.2,
      longitude: 181,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors['longitude']).toBeDefined()
    }
  })

  it('rejects missing latitude (R9.4)', () => {
    const result = createLocationSchema.safeParse({
      name: 'Test',
      longitude: 106.8,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors['latitude']).toBeDefined()
    }
  })

  it('rejects missing longitude (R9.4)', () => {
    const result = createLocationSchema.safeParse({
      name: 'Test',
      latitude: -6.2,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors['longitude']).toBeDefined()
    }
  })

  it('defaults type to Office when not provided', () => {
    const result = createLocationSchema.safeParse({
      name: 'Office',
      latitude: -6.2,
      longitude: 106.8,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('Office')
    }
  })
})

describe('updateLocationSchema validation', () => {
  it('rejects radius < 50 (R9.5)', () => {
    const result = updateLocationSchema.safeParse({ radiusMeters: 30 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors['radiusMeters']
      expect(msg).toBeDefined()
      expect(msg![0]).toContain('50')
    }
  })

  it('rejects radius > 500 (R9.5)', () => {
    const result = updateLocationSchema.safeParse({ radiusMeters: 600 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors['radiusMeters']
      expect(msg).toBeDefined()
      expect(msg![0]).toContain('500')
    }
  })

  it('accepts empty update (all optional)', () => {
    const result = updateLocationSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listLocations
// ---------------------------------------------------------------------------

describe('listLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of Active locations with assignedEmployeeCount', async () => {
    vi.mocked(prisma.location.findMany).mockResolvedValueOnce([mockLocationRecord] as never)

    const result = await listLocations({ workspaceId: WORKSPACE_ID, status: 'Active' })

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Kantor Pusat')
    expect(result[0]!.assignedEmployeeCount).toBe(5)
    expect(result[0]!.status).toBe('Active')

    expect(prisma.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: WORKSPACE_ID, status: 'Active' }),
      }),
    )
  })

  it('returns all locations when status=all (no status filter in where)', async () => {
    vi.mocked(prisma.location.findMany).mockResolvedValueOnce([mockLocationRecord] as never)

    await listLocations({ workspaceId: WORKSPACE_ID, status: 'all' })

    const callArg = vi.mocked(prisma.location.findMany).mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(callArg.where).not.toHaveProperty('status')
  })

  it('applies type filter when provided', async () => {
    vi.mocked(prisma.location.findMany).mockResolvedValueOnce([] as never)

    await listLocations({ workspaceId: WORKSPACE_ID, status: 'Active', type: 'WFHApproved' })

    expect(prisma.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'WFHApproved' }),
      }),
    )
  })

  it('returns empty array when no locations exist', async () => {
    vi.mocked(prisma.location.findMany).mockResolvedValueOnce([] as never)
    const result = await listLocations({ workspaceId: WORKSPACE_ID, status: 'Active' })
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getLocationById
// ---------------------------------------------------------------------------

describe('getLocationById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns full location detail', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(mockLocationRecord as never)

    const result = await getLocationById(WORKSPACE_ID, LOCATION_ID)

    expect(result.id).toBe(LOCATION_ID)
    expect(result.name).toBe('Kantor Pusat')
    expect(result.assignedEmployeeCount).toBe(5)
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
  })

  it('throws NotFoundError when location does not exist', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(null as never)

    await expect(getLocationById(WORKSPACE_ID, 'non-existent')).rejects.toThrow(NotFoundError)
  })

  it('queries with both id and workspaceId for isolation', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(mockLocationRecord as never)

    await getLocationById(WORKSPACE_ID, LOCATION_ID)

    expect(prisma.location.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: LOCATION_ID, workspaceId: WORKSPACE_ID },
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// createLocation
// ---------------------------------------------------------------------------

describe('createLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('creates location with valid coords and writes create_location audit (R9.15)', async () => {
    vi.mocked(prisma.location.create).mockResolvedValueOnce({
      ...mockLocationRecord,
    } as never)

    const result = await createLocation({
      workspaceId: WORKSPACE_ID,
      input: {
        name: 'Kantor Pusat',
        type: 'Office',
        latitude: -6.2146,
        longitude: 106.8451,
        status: 'Active',
      },
      actorUserId: ACTOR_ID,
    })

    expect(result.name).toBe('Kantor Pusat')
    expect(result.latitude).toBe(-6.2146)
    expect(result.radiusMeters).toBe(100)

    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'create_location',
          entityType: 'Location',
          actorUserId: ACTOR_ID,
          workspaceId: WORKSPACE_ID,
        }),
      }),
    )
  })

  it('defaults radius to 100 for Office type when radiusMeters not provided (R9.5)', async () => {
    vi.mocked(prisma.location.create).mockResolvedValueOnce({
      ...mockLocationRecord,
      type: 'Office',
      radiusMeters: 100,
    } as never)

    await createLocation({
      workspaceId: WORKSPACE_ID,
      input: { name: 'Office', type: 'Office', latitude: -6.2, longitude: 106.8, status: 'Active' },
      actorUserId: ACTOR_ID,
    })

    expect(prisma.location.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ radiusMeters: 100 }),
      }),
    )
  })

  it('defaults radius to 150 for WFHApproved type when radiusMeters not provided (R9.5)', async () => {
    vi.mocked(prisma.location.create).mockResolvedValueOnce({
      ...mockLocationRecord,
      type: 'WFHApproved',
      radiusMeters: 150,
    } as never)

    await createLocation({
      workspaceId: WORKSPACE_ID,
      input: {
        name: 'WFH Approved',
        type: 'WFHApproved',
        latitude: -6.3,
        longitude: 106.9,
        status: 'Active',
      },
      actorUserId: ACTOR_ID,
    })

    expect(prisma.location.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ radiusMeters: 150 }),
      }),
    )
  })

  it('uses provided radiusMeters when explicitly specified', async () => {
    vi.mocked(prisma.location.create).mockResolvedValueOnce({
      ...mockLocationRecord,
      radiusMeters: 200,
    } as never)

    await createLocation({
      workspaceId: WORKSPACE_ID,
      input: {
        name: 'Custom Radius',
        type: 'Office',
        latitude: -6.2,
        longitude: 106.8,
        radiusMeters: 200,
        status: 'Active',
      },
      actorUserId: ACTOR_ID,
    })

    expect(prisma.location.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ radiusMeters: 200 }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// updateLocation
// ---------------------------------------------------------------------------

describe('updateLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('updates location name and writes update_location audit (R9.15)', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(mockLocationRecord as never)
    vi.mocked(prisma.location.update).mockResolvedValueOnce({
      ...mockLocationRecord,
      name: 'Kantor Baru',
      _count: { assignedEmployees: 5 },
    } as never)

    const result = await updateLocation({
      workspaceId: WORKSPACE_ID,
      locationId: LOCATION_ID,
      input: { name: 'Kantor Baru' },
      actorUserId: ACTOR_ID,
    })

    expect(result.name).toBe('Kantor Baru')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'update_location',
          entityType: 'Location',
          entityId: LOCATION_ID,
        }),
      }),
    )
  })

  it('writes change_geofence_radius audit when radiusMeters changes (R9.8, R9.15)', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce({
      ...mockLocationRecord,
      radiusMeters: 100,
    } as never)
    vi.mocked(prisma.location.update).mockResolvedValueOnce({
      ...mockLocationRecord,
      radiusMeters: 200,
      _count: { assignedEmployees: 5 },
    } as never)

    await updateLocation({
      workspaceId: WORKSPACE_ID,
      locationId: LOCATION_ID,
      input: { radiusMeters: 200 },
      actorUserId: ACTOR_ID,
    })

    // Should have been called at least once with change_geofence_radius
    const calls = vi.mocked(prisma.auditLog.create).mock.calls
    const geofenceCall = calls.find(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'change_geofence_radius',
    )
    expect(geofenceCall).toBeDefined()
    expect((geofenceCall![0] as { data: { oldValue: unknown } }).data.oldValue).toEqual({
      radiusMeters: 100,
    })
    expect((geofenceCall![0] as { data: { newValue: unknown } }).data.newValue).toEqual({
      radiusMeters: 200,
    })
  })

  it('does NOT write change_geofence_radius audit when radius is unchanged', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce({
      ...mockLocationRecord,
      radiusMeters: 100,
    } as never)
    vi.mocked(prisma.location.update).mockResolvedValueOnce({
      ...mockLocationRecord,
      name: 'Updated Name',
      _count: { assignedEmployees: 5 },
    } as never)

    await updateLocation({
      workspaceId: WORKSPACE_ID,
      locationId: LOCATION_ID,
      input: { name: 'Updated Name' },
      actorUserId: ACTOR_ID,
    })

    const calls = vi.mocked(prisma.auditLog.create).mock.calls
    const geofenceCall = calls.find(
      (call: unknown[]) =>
        (call[0] as { data: { action: string } }).data.action === 'change_geofence_radius',
    )
    expect(geofenceCall).toBeUndefined()
  })

  it('throws NotFoundError when location does not exist', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateLocation({
        workspaceId: WORKSPACE_ID,
        locationId: 'non-existent',
        input: { name: 'New Name' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// updateLocationStatus
// ---------------------------------------------------------------------------

describe('updateLocationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('deactivates location and writes deactivate_location audit (R9.10, R9.15)', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce({
      id: LOCATION_ID,
      status: 'Active',
      name: 'Kantor Pusat',
    } as never)
    vi.mocked(prisma.location.update).mockResolvedValueOnce({
      ...mockLocationRecord,
      status: 'Inactive',
      _count: { assignedEmployees: 5 },
    } as never)

    const result = await updateLocationStatus({
      workspaceId: WORKSPACE_ID,
      locationId: LOCATION_ID,
      input: { status: 'Inactive' },
      actorUserId: ACTOR_ID,
    })

    expect(result.status).toBe('Inactive')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'deactivate_location',
          entityType: 'Location',
          entityId: LOCATION_ID,
        }),
      }),
    )
  })

  it('reactivates location and writes update_location audit (R9.10)', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce({
      id: LOCATION_ID,
      status: 'Inactive',
      name: 'Kantor Pusat',
    } as never)
    vi.mocked(prisma.location.update).mockResolvedValueOnce({
      ...mockLocationRecord,
      status: 'Active',
      _count: { assignedEmployees: 5 },
    } as never)

    await updateLocationStatus({
      workspaceId: WORKSPACE_ID,
      locationId: LOCATION_ID,
      input: { status: 'Active' },
      actorUserId: ACTOR_ID,
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'update_location' }),
      }),
    )
  })

  it('throws NotFoundError when location does not exist', async () => {
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      updateLocationStatus({
        workspaceId: WORKSPACE_ID,
        locationId: 'non-existent',
        input: { status: 'Inactive' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// listEmployeeWfhLocations
// ---------------------------------------------------------------------------

describe('listEmployeeWfhLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns WFH locations for an employee', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.employeeWfhLocation.findMany).mockResolvedValueOnce([
      {
        id: 'wfh-assign-001',
        createdAt: new Date('2024-03-01T00:00:00Z'),
        location: mockWfhLocationRecord,
      },
    ] as never)

    const result = await listEmployeeWfhLocations({
      workspaceId: WORKSPACE_ID,
      employeeId: EMPLOYEE_ID,
    })

    expect(result).toHaveLength(1)
    expect(result[0]!.locationId).toBe('loc-wfh-001')
    expect(result[0]!.locationType).toBe('WFHApproved')
    expect(result[0]!.assignedAt).toBe('2024-03-01T00:00:00.000Z')
  })

  it('throws NotFoundError when employee does not exist', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      listEmployeeWfhLocations({ workspaceId: WORKSPACE_ID, employeeId: 'non-existent' }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// assignWfhLocation
// ---------------------------------------------------------------------------

describe('assignWfhLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('assigns a WFHApproved location successfully (R9.13, R9.14)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(mockWfhLocationRecord as never)
    vi.mocked(prisma.employeeWfhLocation.findFirst).mockResolvedValueOnce(null as never) // no duplicate
    vi.mocked(prisma.employeeWfhLocation.count).mockResolvedValueOnce(1 as never) // 1 existing
    vi.mocked(prisma.employeeWfhLocation.create).mockResolvedValueOnce({
      id: 'new-assign-001',
      createdAt: new Date('2024-03-15T00:00:00Z'),
      location: mockWfhLocationRecord,
    } as never)

    const result = await assignWfhLocation({
      workspaceId: WORKSPACE_ID,
      employeeId: EMPLOYEE_ID,
      input: { locationId: 'loc-wfh-001' },
      actorUserId: ACTOR_ID,
    })

    expect(result.locationId).toBe('loc-wfh-001')
    expect(result.locationType).toBe('WFHApproved')
  })

  it('throws ValidationError when location is not WFHApproved (R9.14)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    // Location is Office type, not WFHApproved
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce({
      ...mockLocationRecord,
      type: 'Office',
    } as never)

    await expect(
      assignWfhLocation({
        workspaceId: WORKSPACE_ID,
        employeeId: EMPLOYEE_ID,
        input: { locationId: LOCATION_ID },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws ConflictError when already at max 3 WFH locations (R9.13)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(mockWfhLocationRecord as never)
    vi.mocked(prisma.employeeWfhLocation.findFirst).mockResolvedValueOnce(null as never) // not duplicate
    vi.mocked(prisma.employeeWfhLocation.count).mockResolvedValueOnce(3 as never) // already at max

    await expect(
      assignWfhLocation({
        workspaceId: WORKSPACE_ID,
        employeeId: EMPLOYEE_ID,
        input: { locationId: 'loc-wfh-001' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError when WFH location already assigned (R9.13)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(mockWfhLocationRecord as never)
    // Duplicate found
    vi.mocked(prisma.employeeWfhLocation.findFirst).mockResolvedValueOnce({
      id: 'existing-assign',
    } as never)

    await expect(
      assignWfhLocation({
        workspaceId: WORKSPACE_ID,
        employeeId: EMPLOYEE_ID,
        input: { locationId: 'loc-wfh-001' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(ConflictError)
  })

  it('throws NotFoundError when employee does not exist', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      assignWfhLocation({
        workspaceId: WORKSPACE_ID,
        employeeId: 'non-existent',
        input: { locationId: 'loc-wfh-001' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when location does not exist', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.location.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      assignWfhLocation({
        workspaceId: WORKSPACE_ID,
        employeeId: EMPLOYEE_ID,
        input: { locationId: 'non-existent' },
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

// ---------------------------------------------------------------------------
// removeWfhLocation
// ---------------------------------------------------------------------------

describe('removeWfhLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  })

  it('removes WFH location assignment successfully (R9.13)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.employeeWfhLocation.findFirst).mockResolvedValueOnce({
      id: 'assign-001',
    } as never)
    vi.mocked(prisma.employeeWfhLocation.delete).mockResolvedValueOnce({} as never)

    const result = await removeWfhLocation({
      workspaceId: WORKSPACE_ID,
      employeeId: EMPLOYEE_ID,
      locationId: 'loc-wfh-001',
      actorUserId: ACTOR_ID,
    })

    expect(result.message).toBeDefined()
    expect(prisma.employeeWfhLocation.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'assign-001' } }),
    )
  })

  it('throws NotFoundError when assignment does not exist (R9.13)', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.employeeWfhLocation.findFirst).mockResolvedValueOnce(null as never)

    await expect(
      removeWfhLocation({
        workspaceId: WORKSPACE_ID,
        employeeId: EMPLOYEE_ID,
        locationId: 'non-existent',
        actorUserId: ACTOR_ID,
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('writes remove_wfh_location audit on success', async () => {
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(mockEmployeeRecord as never)
    vi.mocked(prisma.employeeWfhLocation.findFirst).mockResolvedValueOnce({
      id: 'assign-001',
    } as never)
    vi.mocked(prisma.employeeWfhLocation.delete).mockResolvedValueOnce({} as never)

    await removeWfhLocation({
      workspaceId: WORKSPACE_ID,
      employeeId: EMPLOYEE_ID,
      locationId: 'loc-wfh-001',
      actorUserId: ACTOR_ID,
      requestId: 'req-999',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'remove_wfh_location',
          entityType: 'Employee',
          entityId: EMPLOYEE_ID,
          actorUserId: ACTOR_ID,
        }),
      }),
    )
  })
})
