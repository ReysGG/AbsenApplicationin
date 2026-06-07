/**
 * locations.controller.ts — request/response handlers for location endpoints.
 *
 * GET  /api/v1/locations                                    — list locations
 * POST /api/v1/locations                                    — create location
 * GET  /api/v1/locations/:id                                — get location detail
 * PATCH /api/v1/locations/:id                               — update location (radius → manage_geofence)
 * PATCH /api/v1/locations/:id/status                        — change location status
 *
 * GET  /api/v1/employees/:employeeId/wfh-locations          — list WFH locations for employee
 * POST /api/v1/employees/:employeeId/wfh-locations          — assign WFH location (max 3)
 * DELETE /api/v1/employees/:employeeId/wfh-locations/:locationId — remove WFH location assignment
 *
 * Special: PATCH /locations/:id with radiusMeters requires BOTH manage_locations AND manage_geofence (R9.8)
 * This check is done inside the controller after body parsing.
 *
 * Requirements: 9.1–9.15
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { ForbiddenError, ValidationError } from '../../lib/errors'
import { hasPermission, PERMISSIONS } from '../../lib/permissions'
import {
  createLocationSchema,
  updateLocationSchema,
  updateLocationStatusSchema,
  listLocationsQuerySchema,
  assignWfhLocationSchema,
} from './locations.schema'
import {
  listLocations,
  getLocationById,
  createLocation,
  updateLocation,
  updateLocationStatus,
  listEmployeeWfhLocations,
  assignWfhLocation,
  removeWfhLocation,
} from './locations.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: (req.headers['user-agent'] as string) ?? null,
    requestId: (req as Request & { requestId?: string }).requestId ?? null,
  }
}

// ---------------------------------------------------------------------------
// listLocationsHandler
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/locations
 * Permission: view_employees
 *
 * Requirements: 9.1, 9.11
 */
export async function listLocationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = listLocationsQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return next(new ValidationError('Query tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const locations = await listLocations({
      workspaceId,
      status: parseResult.data.status,
      type: parseResult.data.type,
    })
    sendSuccess(res, locations)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// createLocationHandler
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/locations
 * Permission: manage_locations
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.15
 */
export async function createLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = createLocationSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const meta = getRequestMeta(req)

    const location = await createLocation({
      workspaceId,
      input: parseResult.data,
      actorUserId,
      ...meta,
    })

    sendSuccess(res, location, 'Lokasi berhasil dibuat', 201)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// getLocationHandler
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/locations/:id
 * Permission: view_employees
 *
 * Requirements: 9.12
 */
export async function getLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const id = req.params['id'] as string

    const location = await getLocationById(workspaceId, id)
    sendSuccess(res, location)
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// updateLocationHandler
// ---------------------------------------------------------------------------

/**
 * PATCH /api/v1/locations/:id
 * Permission: manage_locations (always)
 *             manage_geofence (additionally when radiusMeters is changing — R9.8)
 *
 * Requirements: 9.5, 9.6, 9.8, 9.15
 */
export async function updateLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateLocationSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    // R9.8: if radiusMeters is being changed, also require manage_geofence
    if (parseResult.data.radiusMeters !== undefined) {
      const user = req.user!
      const hasGeofence = hasPermission(user.roles, user.permissions, PERMISSIONS.MANAGE_GEOFENCE)
      if (!hasGeofence) {
        return next(
          new ForbiddenError(
            'Mengubah radius geofence memerlukan permission manage_geofence',
          ),
        )
      }
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string
    const meta = getRequestMeta(req)

    const location = await updateLocation({
      workspaceId,
      locationId: id,
      input: parseResult.data,
      actorUserId,
      ...meta,
    })

    sendSuccess(res, location, 'Lokasi berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// updateLocationStatusHandler
// ---------------------------------------------------------------------------

/**
 * PATCH /api/v1/locations/:id/status
 * Permission: manage_locations
 *
 * Requirements: 9.10, 9.15
 */
export async function updateLocationStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = updateLocationStatusSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const id = req.params['id'] as string
    const meta = getRequestMeta(req)

    const location = await updateLocationStatus({
      workspaceId,
      locationId: id,
      input: parseResult.data,
      actorUserId,
      ...meta,
    })

    sendSuccess(res, location, 'Status lokasi berhasil diperbarui')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// WFH Location handlers (Task 23)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/employees/:employeeId/wfh-locations
 * Permission: view_employees
 *
 * Requirements: 9.13
 */
export async function listEmployeeWfhLocationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const employeeId = req.params['employeeId'] as string

    const locations = await listEmployeeWfhLocations({ workspaceId, employeeId })
    sendSuccess(res, locations)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/employees/:employeeId/wfh-locations
 * Permission: manage_employees
 *
 * Requirements: 9.13, 9.14
 */
export async function assignWfhLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parseResult = assignWfhLocationSchema.safeParse(req.body)
    if (!parseResult.success) {
      return next(new ValidationError('Data tidak valid', parseResult.error.flatten()))
    }

    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const employeeId = req.params['employeeId'] as string
    const meta = getRequestMeta(req)

    const assignment = await assignWfhLocation({
      workspaceId,
      employeeId,
      input: parseResult.data,
      actorUserId,
      ...meta,
    })

    sendSuccess(res, assignment, 'Lokasi WFH berhasil ditambahkan', 201)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/v1/employees/:employeeId/wfh-locations/:locationId
 * Permission: manage_employees
 *
 * Requirements: 9.13
 */
export async function removeWfhLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId!
    const actorUserId = req.user!.userId
    const employeeId = req.params['employeeId'] as string
    const locationId = req.params['locationId'] as string
    const meta = getRequestMeta(req)

    const result = await removeWfhLocation({
      workspaceId,
      employeeId,
      locationId,
      actorUserId,
      ...meta,
    })

    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
}
