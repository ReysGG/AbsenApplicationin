/**
 * audit.schema.ts — Zod validation schemas for audit log endpoints.
 *
 * Requirements: 14.1–14.7
 */

import { z } from 'zod'

/**
 * Query params for GET /audit-logs
 * R14.5: filter by date/actor/action
 * R14.6: pagination
 */
export const listAuditQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format start_date harus YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format end_date harus YYYY-MM-DD')
    .optional(),
  actor: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  entity_type: z.string().min(1).optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10) || 1) : 1)),
  page_size: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? parseInt(v, 10) : 25
      return [10, 25, 50, 100].includes(n) ? n : 25
    }),
})

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>
