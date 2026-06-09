/**
 * mobile.auth.ts — login/logout/me for the mobile app.
 *
 * Login proxies better-auth's email+password sign-in (same credential store as
 * the web dashboard) and returns the session token for the app to store and
 * send as `Authorization: Bearer <token>`.
 */

import type { Request, Response, NextFunction } from 'express'
import { auth } from '../../config/auth'
import { prisma } from '../../config/prisma'
import { sendSuccess } from '../../lib/response'
import { UnauthenticatedError, ValidationError, ForbiddenError } from '../../lib/errors'
import type { MobileEmployee } from '../../types/auth'

/** Reshape the employee context into the mobile profile payload. */
function profilePayload(employee: MobileEmployee, fullName: string, email: string) {
  return {
    id: employee.id,
    fullName,
    email,
    employeeCode: employee.employeeCode,
    position: employee.position,
    department: employee.departmentName,
    workspaceId: employee.workspaceId,
    workMode: employee.workMode,
    faceEnrolled: employee.faceProfileStatus === 'Registered',
    assignedLocationId: employee.assignedLocationId,
    assignedShiftId: employee.assignedShiftId,
  }
}

/**
 * POST /api/v1/mobile/auth/login
 * Body: { email, password }
 * Returns: { token, profile }
 */
export async function mobileLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as { email?: unknown; password?: unknown }
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return next(new ValidationError('Email dan kata sandi diperlukan'))
    }

    // Authenticate against better-auth (same store as the web dashboard).
    let result: Awaited<ReturnType<typeof auth.api.signInEmail>>
    try {
      result = await auth.api.signInEmail({
        body: { email, password },
        // asResponse:false → returns { token, user } object
      })
    } catch {
      // Generic message — never reveal whether the email exists (R1.2).
      return next(new UnauthenticatedError('Email atau kata sandi salah'))
    }

    const token = (result as { token?: string } | null)?.token
    const authUser = (result as { user?: { id: string } } | null)?.user
    if (!token || !authUser) {
      return next(new UnauthenticatedError('Email atau kata sandi salah'))
    }

    // Resolve the app User + Employee. Only employees may use the mobile app.
    const userRecord = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
    })
    if (!userRecord) {
      return next(new UnauthenticatedError('Email atau kata sandi salah'))
    }

    const employee = await prisma.employee.findFirst({
      where: { userId: userRecord.id },
      include: { department: { select: { name: true } } },
    })
    if (!employee) {
      return next(new ForbiddenError('Akun ini tidak terhubung ke data karyawan'))
    }

    const mobileEmployee: MobileEmployee = {
      id: employee.id,
      workspaceId: employee.workspaceId,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      email: employee.email,
      position: employee.position ?? null,
      departmentId: employee.departmentId,
      departmentName:
        (employee as { department?: { name: string } | null }).department?.name ?? null,
      workMode: employee.workMode as MobileEmployee['workMode'],
      faceProfileStatus: employee.faceProfileStatus as string,
      assignedLocationId: employee.assignedLocationId ?? null,
      assignedShiftId: employee.assignedShiftId ?? null,
    }

    await prisma.user.update({
      where: { id: userRecord.id },
      data: { lastLoginAt: new Date() },
    })

    sendSuccess(res, {
      token,
      profile: profilePayload(mobileEmployee, userRecord.fullName, userRecord.email),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/mobile/me
 * Returns the authenticated employee's profile.
 */
export function mobileMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.employee || !req.user) {
      return next(new UnauthenticatedError('Autentikasi diperlukan'))
    }
    sendSuccess(
      res,
      profilePayload(req.employee, req.user.fullName, req.user.email),
    )
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/mobile/auth/logout
 * Revokes the current session token.
 */
export async function mobileLogoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    try {
      await auth.api.signOut({ headers: req.headers as Record<string, string> })
    } catch {
      // Idempotent — already invalid is fine.
    }
    sendSuccess(res, null, 'Logout berhasil')
  } catch (err) {
    next(err)
  }
}
