/**
 * settings.schema.ts — Zod validation schemas for settings endpoints.
 *
 * Requirements: 13.1–13.12
 */

import { z } from 'zod'
import { isValidIsoDate } from '../../lib/validDate'

const calendarDate = z
  .string()
  .refine(isValidIsoDate, 'Format tanggal harus YYYY-MM-DD yang valid')

/**
 * PATCH /settings/workspace — update workspace-level settings
 * R13.1–13.9: various workspace configuration fields
 */
export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama workspace minimal 2 karakter')
    .max(200, 'Nama workspace maksimal 200 karakter')
    .trim()
    .optional(),
  timezone: z
    .string()
    .min(2, 'Timezone minimal 2 karakter')
    .max(100, 'Timezone maksimal 100 karakter')
    .optional(),
  defaultGeofenceRadius: z
    .number()
    .int('Radius harus bilangan bulat')
    .min(50, 'Radius minimal 50 meter')
    .max(500, 'Radius maksimal 500 meter')
    .optional(),
  defaultGracePeriod: z
    .number()
    .int('Grace period harus bilangan bulat')
    .min(0, 'Grace period minimal 0 menit')
    .max(120, 'Grace period maksimal 120 menit')
    .optional(),
  absenceCutoffMinutes: z
    .number()
    .int('Absence cutoff harus bilangan bulat')
    .min(30, 'Absence cutoff minimal 30 menit')
    .max(480, 'Absence cutoff maksimal 480 menit')
    .optional(),
  wfhEnabled: z.boolean().optional(),
  hybridEnabled: z.boolean().optional(),
  latePolicy: z.record(z.unknown()).optional(),
  missingCheckoutPolicy: z.record(z.unknown()).optional(),
  // Export permissions stored as JSON (R13.8)
  exportPermissions: z.record(z.boolean()).optional(),
})

/**
 * POST /settings/roles — assign a role with scope + permissions
 * R3.8, R3.9, R13.10, R13.11
 */
export const assignRoleSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
  role: z.enum(['stakeholder', 'support_admin', 'end_user']),
  scopeType: z.enum(['workspace', 'department', 'location']),
  scopeId: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional().default([]),
})

/**
 * POST /settings/holidays — create a holiday
 * R13.12
 */
export const createHolidaySchema = z.object({
  date: calendarDate,
  name: z
    .string()
    .min(1, 'Nama hari libur wajib diisi')
    .max(200, 'Nama hari libur maksimal 200 karakter')
    .trim(),
  recurringYearly: z.boolean().optional().default(false),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
})

/**
 * PATCH /settings/holidays/:id — update a holiday
 * R13.12
 */
export const updateHolidaySchema = z.object({
  date: calendarDate.optional(),
  name: z
    .string()
    .min(1, 'Nama hari libur wajib diisi')
    .max(200, 'Nama hari libur maksimal 200 karakter')
    .trim()
    .optional(),
  recurringYearly: z.boolean().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
})

/**
 * Query params for GET /settings/holidays
 */
export const listHolidaysQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year harus 4 digit')
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  status: z.enum(['Active', 'Inactive', 'all']).optional().default('Active'),
})

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type AssignRoleInput = z.infer<typeof assignRoleSchema>
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>
export type ListHolidaysQuery = z.infer<typeof listHolidaysQuerySchema>
