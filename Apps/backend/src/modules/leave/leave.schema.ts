/**
 * leave.schema.ts — Zod validation schemas for leave request endpoints.
 *
 * Requirements: 11.1, 11.2, 11.9, 11.11, 11.14, 11.15
 */

import { z } from 'zod'
import { isValidIsoDate } from '../../lib/validDate'

const calendarDate = z
  .string()
  .refine(isValidIsoDate, 'Tanggal harus format YYYY-MM-DD yang valid')

// ---------------------------------------------------------------------------
// Create Leave Request (POST /leave-requests)
// ---------------------------------------------------------------------------

export const createLeaveSchema = z
  .object({
    employeeId: z.string().min(1, 'employeeId wajib diisi'),
    type: z.string().min(1, 'type wajib diisi').max(100, 'type maksimal 100 karakter'),
    startDate: calendarDate,
    endDate: calendarDate,
    reason: z.string().max(1000, 'reason maksimal 1000 karakter').optional(),
    notes: z.string().max(1000, 'notes maksimal 1000 karakter').optional(),
    /**
     * Status override: only used for HR manual leave records (R11.12).
     * If omitted, defaults to Pending.
     */
    status: z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled']).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'endDate harus >= startDate',
    path: ['endDate'],
  })

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>

// ---------------------------------------------------------------------------
// Reject Leave Request (PATCH /leave-requests/:id/reject)
// ---------------------------------------------------------------------------

export const rejectLeaveSchema = z.object({
  notes: z.string().max(1000, 'notes maksimal 1000 karakter').trim().optional(),
})

export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>

// ---------------------------------------------------------------------------
// Upload Attachment (POST /leave-requests/:id/attachment)
// ---------------------------------------------------------------------------

export const uploadAttachmentSchema = z.object({
  fileBase64: z.string().min(1, 'fileBase64 wajib diisi'),
  fileName: z
    .string()
    .min(1, 'fileName wajib diisi')
    .max(255, 'fileName maksimal 255 karakter')
    .regex(
      /^[a-zA-Z0-9_\-. ]+\.(pdf|jpg|jpeg|png)$/i,
      'fileName harus PDF, JPG, atau PNG',
    ),
  mimeType: z
    .enum([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ] as const, {
      errorMap: () => ({ message: 'mimeType harus application/pdf, image/jpeg, atau image/png' }),
    }),
})

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>

// ---------------------------------------------------------------------------
// List Leave Requests query (GET /leave-requests)
// ---------------------------------------------------------------------------

export const listLeaveQuerySchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled', 'all']).default('all'),
  employee_id: z.string().optional(),
  start_date: calendarDate.optional(),
  end_date: calendarDate.optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z
    .coerce
    .number()
    .int()
    .refine((v) => [10, 25, 50, 100].includes(v), {
      message: 'page_size harus salah satu dari: 10, 25, 50, 100',
    })
    .default(25),
})

export type ListLeaveQuery = z.infer<typeof listLeaveQuerySchema>
