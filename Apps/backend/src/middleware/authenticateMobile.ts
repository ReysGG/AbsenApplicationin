/**
 * authenticateMobile.ts — bearer-token authentication for the mobile API.
 *
 * Unlike the web `authenticate` middleware (which trusts HMAC-signed context
 * headers from the Next.js BFF), the mobile app talks to the backend directly
 * and proves its identity with a better-auth session token:
 *
 *   Authorization: Bearer <session-token>
 *
 * The middleware:
 * 1. Verifies the session token via better-auth (config/auth.ts bearer plugin).
 * 2. Resolves the app User by `authUserId`.
 * 3. Loads the linked Employee + active workspace.
 * 4. Attaches `req.user`, `req.workspaceId`, and `req.employee`.
 *
 * Mobile endpoints are end-user only: a user with no Employee record (e.g. a
 * pure HR admin) cannot use the mobile API.
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { verifySession } from '../lib/authVerify'
import { UnauthenticatedError, ForbiddenError } from '../lib/errors'
import type { AuthenticatedUser, MobileEmployee } from '../types/auth'

export async function authenticateMobile(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Verify the bearer/session token. verifySession reads the Authorization
    //    header (bearer plugin) or cookie and returns the better-auth identity.
    const session = await verifySession(req)
    if (!session) {
      return next(new UnauthenticatedError('Sesi tidak valid atau sudah berakhir'))
    }

    // 2. Resolve the app User strictly by the cryptographically asserted
    //    better-auth user id — never by email (account-takeover guard).
    const userRecord = await prisma.user.findUnique({
      where: { authUserId: session.authUserId },
    })
    if (!userRecord) {
      return next(new UnauthenticatedError('User tidak ditemukan'))
    }

    // 3. Load the Employee linked to this user. The mobile app is for
    //    employees clocking in/out — a user without an Employee row is not a
    //    mobile user.
    const employee = await prisma.employee.findFirst({
      where: { userId: userRecord.id },
      include: { department: { select: { name: true } } },
    })
    if (!employee) {
      return next(
        new ForbiddenError('Akun ini tidak terhubung ke data karyawan'),
      )
    }

    // 4. Load role assignments for the employee's workspace (for permissions /
    //    scope parity with the web context, though mobile only needs identity).
    const user = await prisma.user.findUnique({
      where: { id: userRecord.id },
      include: {
        roleAssignments: {
          where: { workspaceId: employee.workspaceId },
        },
      },
    })

    const roles = [
      ...new Set(
        ((user?.roleAssignments ?? []) as Array<{ role: AuthenticatedUser['roles'][number] }>).map(
          (ra) => ra.role,
        ),
      ),
    ] as AuthenticatedUser['roles']

    const authenticatedUser: AuthenticatedUser = {
      userId: userRecord.id,
      authUserId: userRecord.authUserId,
      fullName: userRecord.fullName,
      email: userRecord.email,
      roles,
      permissions: [],
      scopeAssignments: [],
      workspaceId: employee.workspaceId,
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

    req.user = authenticatedUser
    req.workspaceId = employee.workspaceId
    req.employee = mobileEmployee

    return next()
  } catch (err) {
    return next(err)
  }
}
