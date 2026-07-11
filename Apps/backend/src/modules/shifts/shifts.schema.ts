/**
 * shifts.schema.ts — Zod validation schemas for shift endpoints.
 *
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.12
 */

import { z } from 'zod'
import { isValidIsoDate } from '../../lib/validDate'

// Valid day enum values (R10.3)
const dayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
])

// HH:MM time format regex
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const calendarDate = z
  .string()
  .refine(isValidIsoDate, 'Format tanggal harus YYYY-MM-DD yang valid')

/**
 * POST /shifts — create a new shift
 *
 * R10.2: name, startTime, endTime, breakMinutes, gracePeriodMinutes,
 *         checkoutToleranceMinutes, absenceCutoffMinutes, workDays, effectiveFrom
 * R10.4: grace=10, checkoutTolerance=60 defaults
 * R10.5: absenceCutoff=120 default
 * R10.6: startTime !== endTime
 */
export const createShiftSchema = z
  .object({
    name: z
      .string({ required_error: 'Nama shift wajib diisi' })
      .min(2, 'Nama shift minimal 2 karakter')
      .max(100, 'Nama shift maksimal 100 karakter')
      .trim(),
    startTime: z
      .string({ required_error: 'Jam masuk wajib diisi' })
      .regex(timeRegex, 'Format jam harus HH:MM'),
    endTime: z
      .string({ required_error: 'Jam keluar wajib diisi' })
      .regex(timeRegex, 'Format jam harus HH:MM'),
    breakMinutes: z
      .number({ invalid_type_error: 'Durasi istirahat harus berupa angka' })
      .int('Durasi istirahat harus bilangan bulat')
      .min(0, 'Durasi istirahat minimal 0 menit')
      .max(480, 'Durasi istirahat maksimal 480 menit')
      .default(0),
    gracePeriodMinutes: z
      .number({ invalid_type_error: 'Grace period harus berupa angka' })
      .int('Grace period harus bilangan bulat')
      .min(0, 'Grace period minimal 0 menit')
      .max(120, 'Grace period maksimal 120 menit')
      .default(10),
    checkoutToleranceMinutes: z
      .number({ invalid_type_error: 'Toleransi checkout harus berupa angka' })
      .int('Toleransi checkout harus bilangan bulat')
      .min(0, 'Toleransi checkout minimal 0 menit')
      .max(240, 'Toleransi checkout maksimal 240 menit')
      .default(60),
    absenceCutoffMinutes: z
      .number({ invalid_type_error: 'Batas absen harus berupa angka' })
      .int('Batas absen harus bilangan bulat')
      .min(30, 'Batas absen minimal 30 menit')
      .max(480, 'Batas absen maksimal 480 menit')
      .default(120),
    workDays: z
      .array(dayEnum, { required_error: 'Hari kerja wajib diisi' })
      .min(1, 'Minimal 1 hari kerja harus dipilih')
      .max(7, 'Maksimal 7 hari kerja'),
    effectiveFrom: calendarDate.optional(),
  })
  .refine((data) => data.startTime !== data.endTime, {
    message: 'Jam masuk dan jam keluar tidak boleh sama',
    path: ['endTime'],
  })

/**
 * PATCH /shifts/:id — update a shift
 * At least one field must be provided.
 * If gracePeriodMinutes is included → requires manage_grace_period (enforced in service).
 */
export const updateShiftSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nama shift minimal 2 karakter')
      .max(100, 'Nama shift maksimal 100 karakter')
      .trim()
      .optional(),
    startTime: z.string().regex(timeRegex, 'Format jam harus HH:MM').optional(),
    endTime: z.string().regex(timeRegex, 'Format jam harus HH:MM').optional(),
    breakMinutes: z
      .number()
      .int()
      .min(0)
      .max(480)
      .optional(),
    gracePeriodMinutes: z
      .number()
      .int()
      .min(0)
      .max(120)
      .optional(),
    checkoutToleranceMinutes: z
      .number()
      .int()
      .min(0)
      .max(240)
      .optional(),
    absenceCutoffMinutes: z
      .number()
      .int()
      .min(30)
      .max(480)
      .optional(),
    workDays: z.array(dayEnum).min(1).max(7).optional(),
    effectiveFrom: calendarDate.optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'Setidaknya satu field harus diisi' },
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime !== data.endTime
      }
      return true
    },
    {
      message: 'Jam masuk dan jam keluar tidak boleh sama',
      path: ['endTime'],
    },
  )

/**
 * POST /shifts/:id/assign — assign shift to employees
 * R10.8
 */
export const assignShiftSchema = z.object({
  employeeIds: z
    .array(z.string({ invalid_type_error: 'ID karyawan tidak valid' }))
    .min(1, 'Minimal 1 karyawan harus dipilih'),
})

/**
 * Query params for GET /shifts
 */
export const listShiftsQuerySchema = z.object({
  status: z.enum(['Active', 'Inactive', 'all']).optional().default('Active'),
})

export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>
export type AssignShiftInput = z.infer<typeof assignShiftSchema>
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>
