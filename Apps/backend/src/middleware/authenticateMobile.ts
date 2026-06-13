/**
 * authenticateMobile.ts — bearer-token auth for the mobile app.
 *
 * The Flutter app authenticates with `Authorization: Bearer <session-token>`
 * (issued by `POST /mobile/auth/login`). This middleware:
 *   1. Verifies the session via better-auth (bearer plugin).
 *   2. Resolves the application `User` by better-auth user id (authUserId).
 *   3. Resolves the active end-user `Employee` record (+ department) and
 *      attaches it to `req.employee`.
 *
 * Mobile endpoints are strictly self-scoped: they only ever read/write the
 * authenticated employee's own data, so no RBAC/permission layer is applied
 * here — the employee context IS the scope.
 *
 * Requirements: 1.1, 1.3, 3.1, 17.4
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { auth } from '../config/auth'
import { UnauthenticatedError } from '../lib/errors'
import type { MobileEmployee } from '../types/auth'

export async function authenticateMobile(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Verify the bearer session via better-auth.
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    })

    if (!session?.user) {
      return next(new UnauthenticatedError('Sesi tidak valid atau kedaluwarsa'))
    }

    const authUserId = session.user.id

    // 2. Resolve the application User by better-auth id.
    const user = await prisma.user.findUnique({
      where: { authUserId },
    })

    if (!user) {
      return next(new UnauthenticatedError('Akun pengguna tidak ditemukan'))
    }

    // 3. Resolve the active employee profile (+ department).
    //    Prefer an Active employment; fall back to the most recent record.
    const employee =
      (await prisma.employee.findFirst({
        where: { userId: user.id, employmentStatus: 'Active' },
        include: { department: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })) ??
      (await prisma.employee.findFirst({
        where: { userId: user.id },
        include: { department: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }))

    if (!employee) {
      return next(
        new UnauthenticatedError(
          'Profil karyawan tidak ditemukan untuk akun ini',
        ),
      )
    }

    const mobileEmployee: MobileEmployee = {
      id: employee.id,
      workspaceId: employee.workspaceId,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      email: employee.email,
      position: employee.position,
      departmentId: employee.departmentId,
      departmentName:
        (employee as { department?: { name: string } }).department?.name ??
        null,
      workMode: employee.workMode,
      faceProfileStatus: employee.faceProfileStatus,
      assignedLocationId: employee.assignedLocationId,
      assignedShiftId: employee.assignedShiftId,
    }

    req.employee = mobileEmployee
    // Expose the resolved app user id + workspace for downstream handlers.
    req.workspaceId = employee.workspaceId

    return next()
  } catch (err) {
    return next(err)
  }
}
