/**
 * reports.schema.ts — Zod validation schemas for report and export endpoints.
 *
 * Requirements: 12.1, 12.2, 12.4, 12.5
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Date regex
// ---------------------------------------------------------------------------

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

// ---------------------------------------------------------------------------
// Shared report query (list endpoints)
// ---------------------------------------------------------------------------

export const reportQuerySchema = z.object({
  start_date: z
    .string()
    .regex(dateRegex, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(dateRegex, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  department_id: z.string().optional(),
  location_id: z.string().optional(),
  shift_id: z.string().optional(),
  status: z.string().optional(),
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
// Export query
// ---------------------------------------------------------------------------

export const exportQuerySchema = z.object({
  start_date: z
    .string()
    .regex(dateRegex, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(dateRegex, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
  format: z.enum(['xlsx', 'csv', 'pdf']).default('xlsx'),
  report_type: z
    .enum([
      'AttendanceSummary',
      'DailyDetail',
      'Late',
      'MissingCheckout',
      'LeaveAndPermit',
      'DepartmentAttendance',
    ])
    .default('AttendanceSummary'),
  department_id: z.string().optional(),
  location_id: z.string().optional(),
  shift_id: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type ReportQuery = z.infer<typeof reportQuerySchema>
export type ExportQuery = z.infer<typeof exportQuerySchema>
