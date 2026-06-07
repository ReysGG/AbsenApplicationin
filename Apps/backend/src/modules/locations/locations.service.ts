/**
 * locations.service.ts — business logic for location management.
 *
 * Endpoints covered:
 *   GET  /locations                  — list locations with filters (R9.1, R9.11)
 *   POST /locations                  — create location (R9.1, R9.2, R9.4, R9.5)
 *   GET  /locations/:id              — location detail (R9.12)
 *   PATCH /locations/:id             — update location; radius change needs manage_geofence (R9.6–9.8)
 *   PATCH /locations/:id/status      — deactivate/reactivate; no hard delete (R9.10)
 *
 * WFH Location per Employee (Task 23):
 *   GET  /employees/:employeeId/wfh-locations   — list WFH locations for employee (R9.13)
 *   POST /employees/:employeeId/wfh-locations   — assign (max 3) (R9.13)
 *   DELETE /employees/:employeeId/wfh-locations/:locationId — remove assignment (R9.13)
 *
 * Business rules:
 *   - Latitude required (-90 to 90), Longitude required (-180 to 180) (R9.4)
 *   - Radius 50–500 meters; default WFO=100, WFH=150 (R9.5)
 *   - Types: Office, Branch, WFHApproved (R9.7)
 *   - Radius change requires manage_geofence permission (R9.8) — checked in controller
 *   - Radius changes apply to new attendance only (R9.9) — enforced by attendance calculation
 *   - No hard delete; deactivate via status (R9.10)
 *   - Audit: create_location, update_location, change_geofence_radius, deactivate_location (R9.15)
 *   - EmployeeWfhLocation max 3 per employee (R9.13); location must be WFHApproved (R9.14)
 *
 * Requirements: 9.1–9.15
 */

import { prisma } from '../../config/prisma'
import { writeAudit } from '../../lib/audit'
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors'
import type {
  CreateLocationInput,
  UpdateLocationInput,
  UpdateLocationStatusInput,
  AssignWfhLocationInput,
} from './locations.schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationListItem {
  id: string
  name: string
  type: string
  address: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  status: string
  assignedEmployeeCount: number
  createdAt: string
}

export interface LocationDetail extends LocationListItem {
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
}

export interface WfhLocationItem {
  id: string
  locationId: string
  locationName: string
  locationType: string
  locationAddress: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  locationStatus: string
  assignedAt: string
}

// ---------------------------------------------------------------------------
// listLocations
// ---------------------------------------------------------------------------

/**
 * GET /locations
 * List all locations in the workspace with optional status/type filter.
 * Returns assignedEmployeeCount (R9.11).
 *
 * Requirements: 9.1, 9.11
 */
export async function listLocations(params: {
  workspaceId: string
  status: 'Active' | 'Inactive' | 'all'
  type?: 'Office' | 'Branch' | 'WFHApproved'
}): Promise<LocationListItem[]> {
  const { workspaceId, status, type } = params

  const where: Record<string, unknown> = { workspaceId }
  if (status !== 'all') {
    where['status'] = status
  }
  if (type) {
    where['type'] = type
  }

  const locations = await (prisma as any).location.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          assignedEmployees: true,
        },
      },
    },
  })

  return (
    locations as Array<{
      id: string
      name: string
      type: string
      address: string | null
      latitude: number
      longitude: number
      radiusMeters: number
      status: string
      createdAt: Date
      _count: { assignedEmployees: number }
    }>
  ).map((loc) => ({
    id: loc.id,
    name: loc.name,
    type: loc.type,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radiusMeters: loc.radiusMeters,
    status: loc.status,
    assignedEmployeeCount: loc._count.assignedEmployees,
    createdAt: loc.createdAt.toISOString(),
  }))
}

// ---------------------------------------------------------------------------
// getLocationById
// ---------------------------------------------------------------------------

/**
 * GET /locations/:id
 * Full location detail including assignedEmployeeCount.
 *
 * Requirements: 9.12
 */
export async function getLocationById(
  workspaceId: string,
  locationId: string,
): Promise<LocationDetail> {
  const loc = await (prisma as any).location.findFirst({
    where: { id: locationId, workspaceId },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      status: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          assignedEmployees: true,
        },
      },
    },
  })

  if (!loc) {
    throw new NotFoundError('Lokasi')
  }

  return {
    id: loc.id,
    name: loc.name,
    type: loc.type,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radiusMeters: loc.radiusMeters,
    status: loc.status,
    assignedEmployeeCount: (loc._count as { assignedEmployees: number }).assignedEmployees,
    createdBy: loc.createdBy,
    updatedBy: loc.updatedBy,
    createdAt: (loc.createdAt as Date).toISOString(),
    updatedAt: (loc.updatedAt as Date).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// createLocation
// ---------------------------------------------------------------------------

/**
 * POST /locations
 * Create a new location.
 *
 * Default radius:
 *   - WFHApproved → 150m
 *   - Office/Branch → 100m
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.15
 */
export async function createLocation(params: {
  workspaceId: string
  input: CreateLocationInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<LocationDetail> {
  const { workspaceId, input, actorUserId, ipAddress, userAgent, requestId } = params

  // Determine default radius if not supplied (R9.5)
  const defaultRadius = input.type === 'WFHApproved' ? 150 : 100
  const radiusMeters = input.radiusMeters ?? defaultRadius

  const loc = await (prisma as any).location.create({
    data: {
      workspaceId,
      name: input.name,
      type: input.type ?? 'Office',
      address: input.address ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters,
      status: input.status ?? 'Active',
      createdBy: actorUserId,
      updatedBy: actorUserId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      status: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Audit: create_location (R9.15)
  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'create_location',
    entityType: 'Location',
    entityId: loc.id,
    newValue: {
      name: loc.name,
      type: loc.type,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      status: loc.status,
    },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: loc.id,
    name: loc.name,
    type: loc.type,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radiusMeters: loc.radiusMeters,
    status: loc.status,
    assignedEmployeeCount: 0,
    createdBy: loc.createdBy,
    updatedBy: loc.updatedBy,
    createdAt: (loc.createdAt as Date).toISOString(),
    updatedAt: (loc.updatedAt as Date).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// updateLocation
// ---------------------------------------------------------------------------

/**
 * PATCH /locations/:id
 * Update location fields.
 *
 * NOTE: The controller MUST verify manage_geofence permission BEFORE calling
 * this function when radiusMeters is being changed (R9.8).
 *
 * Audit:
 *   - update_location for name/address/type/coordinate changes (R9.15)
 *   - change_geofence_radius separately when radius changes (R9.15)
 *
 * Requirements: 9.5, 9.6, 9.8, 9.15
 */
export async function updateLocation(params: {
  workspaceId: string
  locationId: string
  input: UpdateLocationInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<LocationDetail> {
  const { workspaceId, locationId, input, actorUserId, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).location.findFirst({
    where: { id: locationId, workspaceId },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      status: true,
    },
  })

  if (!existing) {
    throw new NotFoundError('Lokasi')
  }

  // Build update payload
  const updateData: Record<string, unknown> = { updatedBy: actorUserId }
  if (input.name !== undefined) updateData['name'] = input.name
  if (input.type !== undefined) updateData['type'] = input.type
  if (input.address !== undefined) updateData['address'] = input.address
  if (input.latitude !== undefined) updateData['latitude'] = input.latitude
  if (input.longitude !== undefined) updateData['longitude'] = input.longitude
  if (input.radiusMeters !== undefined) updateData['radiusMeters'] = input.radiusMeters

  const updated = await (prisma as any).location.update({
    where: { id: locationId },
    data: updateData,
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      status: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { assignedEmployees: true },
      },
    },
  })

  // Build old/new value for audit (only changed fields — R14.2)
  const coreFields = ['name', 'type', 'address', 'latitude', 'longitude'] as const
  const oldCoreValue: Record<string, unknown> = {}
  const newCoreValue: Record<string, unknown> = {}
  for (const field of coreFields) {
    if (updateData[field] !== undefined && updateData[field] !== (existing as Record<string, unknown>)[field]) {
      oldCoreValue[field] = (existing as Record<string, unknown>)[field]
      newCoreValue[field] = updateData[field]
    }
  }

  // Audit: update_location for non-radius changes (R9.15)
  if (Object.keys(newCoreValue).length > 0) {
    await writeAudit({
      workspaceId,
      actorUserId,
      action: 'update_location',
      entityType: 'Location',
      entityId: locationId,
      oldValue: oldCoreValue,
      newValue: newCoreValue,
      ipAddress,
      userAgent,
      requestId,
    })
  }

  // Audit: change_geofence_radius separately if radius changed (R9.15)
  if (input.radiusMeters !== undefined && input.radiusMeters !== existing.radiusMeters) {
    await writeAudit({
      workspaceId,
      actorUserId,
      action: 'change_geofence_radius',
      entityType: 'Location',
      entityId: locationId,
      oldValue: { radiusMeters: existing.radiusMeters },
      newValue: { radiusMeters: input.radiusMeters },
      ipAddress,
      userAgent,
      requestId,
    })
  }

  // If only updatedBy changed (no actual field change), still write a generic audit
  if (
    Object.keys(newCoreValue).length === 0 &&
    (input.radiusMeters === undefined || input.radiusMeters === existing.radiusMeters) &&
    Object.keys(updateData).length > 1 // updatedBy is always included
  ) {
    await writeAudit({
      workspaceId,
      actorUserId,
      action: 'update_location',
      entityType: 'Location',
      entityId: locationId,
      oldValue: undefined,
      newValue: undefined,
      ipAddress,
      userAgent,
      requestId,
    })
  }

  return {
    id: updated.id,
    name: updated.name,
    type: updated.type,
    address: updated.address,
    latitude: updated.latitude,
    longitude: updated.longitude,
    radiusMeters: updated.radiusMeters,
    status: updated.status,
    assignedEmployeeCount: (updated._count as { assignedEmployees: number }).assignedEmployees,
    createdBy: updated.createdBy,
    updatedBy: updated.updatedBy,
    createdAt: (updated.createdAt as Date).toISOString(),
    updatedAt: (updated.updatedAt as Date).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// updateLocationStatus
// ---------------------------------------------------------------------------

/**
 * PATCH /locations/:id/status
 * Change location status (Active/Inactive).
 * No hard delete allowed (R9.10).
 *
 * Audit: deactivate_location when going Inactive (R9.15)
 *
 * Requirements: 9.10, 9.15
 */
export async function updateLocationStatus(params: {
  workspaceId: string
  locationId: string
  input: UpdateLocationStatusInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<LocationDetail> {
  const { workspaceId, locationId, input, actorUserId, ipAddress, userAgent, requestId } = params

  const existing = await (prisma as any).location.findFirst({
    where: { id: locationId, workspaceId },
    select: { id: true, status: true, name: true },
  })

  if (!existing) {
    throw new NotFoundError('Lokasi')
  }

  const updated = await (prisma as any).location.update({
    where: { id: locationId },
    data: {
      status: input.status,
      updatedBy: actorUserId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      status: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { assignedEmployees: true },
      },
    },
  })

  // Determine audit action (R9.15)
  const auditAction = input.status === 'Inactive' ? 'deactivate_location' : 'update_location'

  await writeAudit({
    workspaceId,
    actorUserId,
    action: auditAction,
    entityType: 'Location',
    entityId: locationId,
    oldValue: { status: existing.status },
    newValue: { status: input.status },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: updated.id,
    name: updated.name,
    type: updated.type,
    address: updated.address,
    latitude: updated.latitude,
    longitude: updated.longitude,
    radiusMeters: updated.radiusMeters,
    status: updated.status,
    assignedEmployeeCount: (updated._count as { assignedEmployees: number }).assignedEmployees,
    createdBy: updated.createdBy,
    updatedBy: updated.updatedBy,
    createdAt: (updated.createdAt as Date).toISOString(),
    updatedAt: (updated.updatedAt as Date).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// WFH Location per Employee (Task 23) — R9.13, R9.14
// ---------------------------------------------------------------------------

/**
 * GET /employees/:employeeId/wfh-locations
 * List all WFH locations assigned to an employee.
 *
 * Requirements: 9.13
 */
export async function listEmployeeWfhLocations(params: {
  workspaceId: string
  employeeId: string
}): Promise<WfhLocationItem[]> {
  const { workspaceId, employeeId } = params

  // Verify employee belongs to this workspace
  const employee = await (prisma as any).employee.findFirst({
    where: { id: employeeId, workspaceId },
    select: { id: true },
  })

  if (!employee) {
    throw new NotFoundError('Karyawan')
  }

  const assignments = await (prisma as any).employeeWfhLocation.findMany({
    where: { employeeId },
    select: {
      id: true,
      createdAt: true,
      location: {
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          latitude: true,
          longitude: true,
          radiusMeters: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    assignments as Array<{
      id: string
      createdAt: Date
      location: {
        id: string
        name: string
        type: string
        address: string | null
        latitude: number
        longitude: number
        radiusMeters: number
        status: string
      }
    }>
  ).map((a) => ({
    id: a.id,
    locationId: a.location.id,
    locationName: a.location.name,
    locationType: a.location.type,
    locationAddress: a.location.address,
    latitude: a.location.latitude,
    longitude: a.location.longitude,
    radiusMeters: a.location.radiusMeters,
    locationStatus: a.location.status,
    assignedAt: a.createdAt.toISOString(),
  }))
}

/**
 * POST /employees/:employeeId/wfh-locations
 * Assign a WFHApproved location to an employee (max 3 total).
 *
 * Rules:
 *   - Location must be WFHApproved (R9.14)
 *   - Max 3 WFH locations per employee (R9.13)
 *   - 409 if already assigned
 *
 * Requirements: 9.13, 9.14
 */
export async function assignWfhLocation(params: {
  workspaceId: string
  employeeId: string
  input: AssignWfhLocationInput
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<WfhLocationItem> {
  const { workspaceId, employeeId, input, actorUserId, ipAddress, userAgent, requestId } = params

  // Verify employee belongs to this workspace
  const employee = await (prisma as any).employee.findFirst({
    where: { id: employeeId, workspaceId },
    select: { id: true },
  })

  if (!employee) {
    throw new NotFoundError('Karyawan')
  }

  // Verify location exists in this workspace and is WFHApproved (R9.14)
  const location = await (prisma as any).location.findFirst({
    where: { id: input.locationId, workspaceId },
    select: { id: true, type: true, name: true, address: true, latitude: true, longitude: true, radiusMeters: true, status: true },
  })

  if (!location) {
    throw new NotFoundError('Lokasi')
  }

  if (location.type !== 'WFHApproved') {
    throw new ValidationError(
      'Hanya lokasi bertipe WFHApproved yang dapat ditambahkan sebagai lokasi WFH karyawan',
    )
  }

  // Check duplicate assignment
  const existingAssignment = await (prisma as any).employeeWfhLocation.findFirst({
    where: { employeeId, locationId: input.locationId },
    select: { id: true },
  })

  if (existingAssignment) {
    throw new ConflictError('Lokasi WFH ini sudah ditambahkan untuk karyawan tersebut')
  }

  // Enforce max 3 per employee (R9.13)
  const currentCount = await (prisma as any).employeeWfhLocation.count({
    where: { employeeId },
  })

  if (currentCount >= 3) {
    throw new ConflictError(
      'Karyawan sudah memiliki 3 lokasi WFH. Hapus salah satu sebelum menambahkan yang baru',
    )
  }

  const assignment = await (prisma as any).employeeWfhLocation.create({
    data: {
      employeeId,
      locationId: input.locationId,
    },
    select: {
      id: true,
      createdAt: true,
      location: {
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          latitude: true,
          longitude: true,
          radiusMeters: true,
          status: true,
        },
      },
    },
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'assign_wfh_location',
    entityType: 'Employee',
    entityId: employeeId,
    newValue: { locationId: input.locationId },
    ipAddress,
    userAgent,
    requestId,
  })

  return {
    id: (assignment as { id: string }).id,
    locationId: (assignment as { location: { id: string } }).location.id,
    locationName: (assignment as { location: { name: string } }).location.name,
    locationType: (assignment as { location: { type: string } }).location.type,
    locationAddress: (assignment as { location: { address: string | null } }).location.address,
    latitude: (assignment as { location: { latitude: number } }).location.latitude,
    longitude: (assignment as { location: { longitude: number } }).location.longitude,
    radiusMeters: (assignment as { location: { radiusMeters: number } }).location.radiusMeters,
    locationStatus: (assignment as { location: { status: string } }).location.status,
    assignedAt: (assignment as { createdAt: Date }).createdAt.toISOString(),
  }
}

/**
 * DELETE /employees/:employeeId/wfh-locations/:locationId
 * Remove a WFH location assignment from an employee.
 * This removes the assignment record, not the location itself.
 *
 * Requirements: 9.13
 */
export async function removeWfhLocation(params: {
  workspaceId: string
  employeeId: string
  locationId: string
  actorUserId: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
}): Promise<{ message: string }> {
  const { workspaceId, employeeId, locationId, actorUserId, ipAddress, userAgent, requestId } = params

  // Verify employee belongs to this workspace
  const employee = await (prisma as any).employee.findFirst({
    where: { id: employeeId, workspaceId },
    select: { id: true },
  })

  if (!employee) {
    throw new NotFoundError('Karyawan')
  }

  // Find the assignment
  const assignment = await (prisma as any).employeeWfhLocation.findFirst({
    where: { employeeId, locationId },
    select: { id: true },
  })

  if (!assignment) {
    throw new NotFoundError('Penugasan lokasi WFH')
  }

  await (prisma as any).employeeWfhLocation.delete({
    where: { id: (assignment as { id: string }).id },
  })

  await writeAudit({
    workspaceId,
    actorUserId,
    action: 'remove_wfh_location',
    entityType: 'Employee',
    entityId: employeeId,
    oldValue: { locationId },
    ipAddress,
    userAgent,
    requestId,
  })

  return { message: 'Lokasi WFH berhasil dihapus dari karyawan' }
}
