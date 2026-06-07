/**
 * attendance.schema.ts — Zod validation schemas for attendance endpoints.
 *
 * Requirements: 6.1, 6.3, 6.4, 6.6, 6.7
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// List Attendance Query
// ---------------------------------------------------------------------------

export const listAttendanceQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  department_id: z.string().optional(),
  location_id: z.string().optional(),
  shift_id: z.string().optional(),
  status: z
    .enum([
      'Present',
      'Late',
      'Absent',
      'PendingCheckout',
      'MissingCheckout',
      'Leave',
      'Invalid',
      'all',
    ])
    .optional()
    .default('all'),
  search: z.string().max(100).trim().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? '1', 10) || 1)),
  page_size: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v ?? '25', 10)
      return [10, 25, 50, 100].includes(n) ? n : 25
    }),
})

// ---------------------------------------------------------------------------
// Adjustment Note
// ---------------------------------------------------------------------------

export const adjustmentNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Catatan wajib diisi')
    .max(1000, 'Catatan maksimal 1000 karakter'),
})

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>
export type AdjustmentNoteInput = z.infer<typeof adjustmentNoteSchema>
