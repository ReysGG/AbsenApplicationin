/**
 * mobile.schema.ts — Zod validation for the mobile API.
 *
 * Requirements: 1.1, 5.x, 7.x, 11.x
 */

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

export const checkSubmissionSchema = z.object({
  workMode: z.enum(['wfo', 'wfh']),
  latitude: z.number(),
  longitude: z.number(),
  faceVerified: z.boolean(),
  livenessPassed: z.boolean(),
  isMocked: z.boolean().optional().default(false),
  locationId: z.string().optional(),
  capturedAt: z.string().datetime().optional(),
  // ── Integrity signals (server is the decision authority, see mobile.integrity.ts) ──
  // Number of distinct liveness challenges passed / presented on-device.
  livenessChecksPassed: z.number().int().min(0).max(10).optional(),
  livenessChecksTotal: z.number().int().min(0).max(10).optional(),
  // Optional face-match score (0..1) once face enrollment exists.
  faceMatchScore: z.number().min(0).max(1).optional(),
  // Optional Play Integrity / DeviceCheck attestation token (verified upstream).
  appIntegrityToken: z.string().max(4096).optional(),
  // Optional device model string for anomaly review.
  deviceModel: z.string().max(160).optional(),
})

export const leaveCreateSchema = z.object({
  type: z.string().min(1, 'Jenis pengajuan wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  reason: z.string().trim().min(3, 'Alasan minimal 3 karakter'),
  attachmentName: z.string().optional(),
})

export const deviceTokenSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  platform: z.string().optional().default('android'),
})

export const deviceTokenDeleteSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CheckSubmissionInput = z.infer<typeof checkSubmissionSchema>
export type LeaveCreateInput = z.infer<typeof leaveCreateSchema>
export type DeviceTokenInput = z.infer<typeof deviceTokenSchema>
