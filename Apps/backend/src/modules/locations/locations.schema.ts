/**
 * locations.schema.ts — Zod validation schemas for location endpoints.
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.13
 */

import { z } from 'zod'

/**
 * POST /locations — create a new location
 *
 * R9.2: name required
 * R9.4: latitude/longitude required and in valid range
 * R9.5: radius 50–500 meters
 */
export const createLocationSchema = z.object({
  name: z
    .string({ required_error: 'Nama lokasi wajib diisi' })
    .min(2, 'Nama lokasi minimal 2 karakter')
    .max(200, 'Nama lokasi maksimal 200 karakter')
    .trim(),
  type: z.enum(['Office', 'Branch', 'WFHApproved']).default('Office'),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').trim().optional().nullable(),
  latitude: z
    .number({ required_error: 'Latitude wajib diisi' })
    .min(-90, 'Latitude harus antara -90 dan 90')
    .max(90, 'Latitude harus antara -90 dan 90'),
  longitude: z
    .number({ required_error: 'Longitude wajib diisi' })
    .min(-180, 'Longitude harus antara -180 dan 180')
    .max(180, 'Longitude harus antara -180 dan 180'),
  radiusMeters: z
    .number()
    .int('Radius harus bilangan bulat')
    .min(50, 'Radius minimal 50 meter')
    .max(500, 'Radius maksimal 500 meter')
    .optional(),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
})

/**
 * PATCH /locations/:id — update an existing location
 *
 * R9.5, R9.6: radius constraint 50–500
 * R9.4: coordinates in valid range if provided
 */
export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama lokasi minimal 2 karakter')
    .max(200, 'Nama lokasi maksimal 200 karakter')
    .trim()
    .optional(),
  type: z.enum(['Office', 'Branch', 'WFHApproved']).optional(),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').trim().optional().nullable(),
  latitude: z
    .number()
    .min(-90, 'Latitude harus antara -90 dan 90')
    .max(90, 'Latitude harus antara -90 dan 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude harus antara -180 dan 180')
    .max(180, 'Longitude harus antara -180 dan 180')
    .optional(),
  radiusMeters: z
    .number()
    .int('Radius harus bilangan bulat')
    .min(50, 'Radius minimal 50 meter')
    .max(500, 'Radius maksimal 500 meter')
    .optional(),
})

/**
 * PATCH /locations/:id/status — change location status
 *
 * R9.10: only deactivate (Inactive) or reactivate (Active), no hard delete
 */
export const updateLocationStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Status wajib diisi',
    invalid_type_error: 'Status harus Active atau Inactive',
  }),
})

/**
 * Query params for GET /locations
 */
export const listLocationsQuerySchema = z.object({
  status: z.enum(['Active', 'Inactive', 'all']).optional().default('Active'),
  type: z.enum(['Office', 'Branch', 'WFHApproved']).optional(),
})

/**
 * Body for POST /employees/:employeeId/wfh-locations
 *
 * R9.13: assign a WFHApproved location to an employee (max 3)
 */
export const assignWfhLocationSchema = z.object({
  locationId: z.string({ required_error: 'locationId wajib diisi' }).min(1, 'locationId tidak boleh kosong'),
})

export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type UpdateLocationStatusInput = z.infer<typeof updateLocationStatusSchema>
export type ListLocationsQuery = z.infer<typeof listLocationsQuerySchema>
export type AssignWfhLocationInput = z.infer<typeof assignWfhLocationSchema>
