/**
 * employees.schema.ts — Zod validation schemas for employee endpoints.
 *
 * Requirements: 7.1–7.8, 7.13, 7.14
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Create Employee
// ---------------------------------------------------------------------------

export const createEmployeeSchema = z.object({
  fullName: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(200, 'Nama lengkap maksimal 200 karakter')
    .trim(),
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  employeeCode: z
    .string()
    .min(2, 'Kode karyawan minimal 2 karakter')
    .max(50, 'Kode karyawan maksimal 50 karakter')
    .trim()
    .optional(),
  phone: z
    .string()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .trim()
    .optional()
    .nullable(),
  departmentId: z
    .string({ required_error: 'Departemen wajib diisi' })
    .min(1, 'Departemen wajib diisi'),
  position: z
    .string()
    .max(100, 'Jabatan maksimal 100 karakter')
    .trim()
    .optional()
    .nullable(),
  employmentStatus: z
    .enum(['Active', 'Inactive', 'Suspended', 'Archived'])
    .default('Active'),
  assignedShiftId: z.string().min(1).optional().nullable(),
  assignedLocationId: z.string().min(1).optional().nullable(),
  workMode: z.enum(['WFO', 'WFH', 'Hybrid']).default('WFO'),
  joinDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .default(() => new Date().toISOString().slice(0, 10)),
})

// ---------------------------------------------------------------------------
// Update Employee
// ---------------------------------------------------------------------------

export const updateEmployeeSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Nama lengkap minimal 2 karakter')
      .max(200, 'Nama lengkap maksimal 200 karakter')
      .trim()
      .optional(),
    phone: z
      .string()
      .max(20, 'Nomor telepon maksimal 20 karakter')
      .trim()
      .optional()
      .nullable(),
    position: z
      .string()
      .max(100, 'Jabatan maksimal 100 karakter')
      .trim()
      .optional()
      .nullable(),
    departmentId: z.string().min(1).optional(),
    employeeCode: z
      .string()
      .min(2, 'Kode karyawan minimal 2 karakter')
      .max(50, 'Kode karyawan maksimal 50 karakter')
      .trim()
      .optional(),
    assignedShiftId: z.string().min(1).optional().nullable(),
    assignedLocationId: z.string().min(1).optional().nullable(),
    workMode: z.enum(['WFO', 'WFH', 'Hybrid']).optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.phone !== undefined ||
      data.position !== undefined ||
      data.departmentId !== undefined ||
      data.employeeCode !== undefined ||
      data.assignedShiftId !== undefined ||
      data.assignedLocationId !== undefined ||
      data.workMode !== undefined,
    { message: 'Setidaknya satu field harus diisi untuk update' },
  )

// ---------------------------------------------------------------------------
// Update Employee Status
// ---------------------------------------------------------------------------

export const updateEmployeeStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive', 'Suspended', 'Archived'], {
    required_error: 'Status wajib diisi',
    invalid_type_error: 'Status tidak valid',
  }),
})

// ---------------------------------------------------------------------------
// List Employees Query
// ---------------------------------------------------------------------------

export const listEmployeesQuerySchema = z.object({
  status: z
    .enum(['Active', 'Inactive', 'Suspended', 'Archived', 'all'])
    .optional()
    .default('Active'),
  department_id: z.string().optional(),
  search: z.string().max(100).trim().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10) || 1) : 1)),
  page_size: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = v ? parseInt(v, 10) : 25
      return [10, 25, 50, 100].includes(parsed) ? parsed : 25
    }),
})

// ---------------------------------------------------------------------------
// Activate Account (Public)
// ---------------------------------------------------------------------------

export const activateAccountSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password terlalu panjang'),
})

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusSchema>
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>
