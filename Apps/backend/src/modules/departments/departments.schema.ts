/**
 * departments.schema.ts — Zod validation schemas for department endpoints.
 *
 * Requirements: 8.1, 8.2, 8.5
 */

import { z } from 'zod'

/**
 * POST /departments — create a new department
 * R8.1: name required, min 2 chars, max 100 chars
 */
export const createDeptSchema = z.object({
  name: z
    .string({ required_error: 'Nama departemen wajib diisi' })
    .min(2, 'Nama departemen minimal 2 karakter')
    .max(100, 'Nama departemen maksimal 100 karakter')
    .trim(),
})

/**
 * PATCH /departments/:id — update a department
 * At least one of name or status must be provided.
 */
export const updateDeptSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nama departemen minimal 2 karakter')
      .max(100, 'Nama departemen maksimal 100 karakter')
      .trim()
      .optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  })
  .refine((data) => data.name !== undefined || data.status !== undefined, {
    message: 'Setidaknya satu field (name atau status) harus diisi',
  })

/**
 * Query params for GET /departments
 */
export const listDeptQuerySchema = z.object({
  status: z.enum(['Active', 'Inactive', 'all']).optional().default('Active'),
})

export type CreateDeptInput = z.infer<typeof createDeptSchema>
export type UpdateDeptInput = z.infer<typeof updateDeptSchema>
export type ListDeptQuery = z.infer<typeof listDeptQuerySchema>
