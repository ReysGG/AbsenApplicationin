/**
 * mobile.controller.ts — request handlers for the mobile API.
 *
 * Login issues a better-auth bearer token (the bearer plugin is enabled in
 * config/auth.ts). All other handlers rely on `req.employee` populated by the
 * `authenticateMobile` middleware.
 *
 * Requirements: 1.1, 5.x, 6.x, 7.x, 11.x, 21.x
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../config/prisma'
import { auth } from '../../config/auth'
import { sendSuccess } from '../../lib/response'
import {
  UnauthenticatedError,
  ValidationError,
} from '../../lib/errors'
import type { MobileEmployee } from '../../types/auth'
import {
  checkSubmissionSchema,
  deviceTokenDeleteSchema,
  deviceTokenSchema,
  enrollFaceSchema,
  leaveCreateSchema,
  loginSchema,
} from './mobile.schema'
import * as service from './mobile.service'

function requireEmployee(req: Request): MobileEmployee {
  if (!req.employee) {
    throw new UnauthenticatedError('Autentikasi diperlukan')
  }
  return req.employee
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Input tidak valid', parsed.error.flatten()),
      )
    }
    const { email, password } = parsed.data

    // Sign in via better-auth; bearer plugin returns the token in a header.
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })

    if (!response.ok) {
      return next(new UnauthenticatedError('Email atau kata sandi salah.'))
    }

    const token = response.headers.get('set-auth-token')
    if (!token) {
      return next(new UnauthenticatedError('Gagal menerbitkan token sesi.'))
    }

    const json = (await response.json()) as { user?: { id?: string } }
    const authUserId = json.user?.id
    if (!authUserId) {
      return next(new UnauthenticatedError('Respons autentikasi tidak valid.'))
    }

    // Resolve the application User → Employee profile.
    const user = await prisma.user.findUnique({ where: { authUserId } })
    if (!user) {
      return next(new UnauthenticatedError('Akun pengguna tidak ditemukan.'))
    }

    if (user.status !== 'Active') {
      return next(new UnauthenticatedError('Akun pengguna tidak aktif.'))
    }

    const employee = await prisma.employee.findFirst({
      where: {
        userId: user.id,
        employmentStatus: 'Active',
        accountStatus: 'Active',
      },
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    if (!employee) {
      return next(
        new UnauthenticatedError(
          'Profil karyawan tidak ditemukan untuk akun ini.',
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

    const profile = await service.buildProfile(mobileEmployee)
    sendSuccess(res, { token, profile }, 'Login berhasil')
  } catch (err) {
    next(err)
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await auth.api
      .signOut({ headers: req.headers as Record<string, string> })
      .catch(() => undefined)
    sendSuccess(res, null, 'Logout berhasil')
  } catch (err) {
    next(err)
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    sendSuccess(res, await service.buildProfile(emp))
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Attendance reads
// ---------------------------------------------------------------------------

export async function todayHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getToday(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

export async function historyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getHistory(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

export async function detailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getDetail(requireEmployee(req), String(req.params.id)))
  } catch (err) {
    next(err)
  }
}

export async function shiftHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getTodayShift(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

export async function scheduleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getSchedule(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

export async function locationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getAssignedLocations(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Check-in / out
// ---------------------------------------------------------------------------

export async function checkInHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    const parsed = checkSubmissionSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Data check-in tidak valid', parsed.error.flatten()),
      )
    }
    sendSuccess(res, await service.checkIn(emp, parsed.data), 'Check-in berhasil')
  } catch (err) {
    next(err)
  }
}

export async function checkOutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    const parsed = checkSubmissionSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Data check-out tidak valid', parsed.error.flatten()),
      )
    }
    sendSuccess(
      res,
      await service.checkOut(emp, parsed.data),
      'Check-out berhasil',
    )
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export async function leaveListHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getLeaveRequests(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

export async function leaveCreateHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    const parsed = leaveCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Data pengajuan tidak valid', parsed.error.flatten()),
      )
    }
    sendSuccess(
      res,
      await service.createMyLeaveRequest(emp, parsed.data),
      'Pengajuan terkirim',
      201,
    )
  } catch (err) {
    next(err)
  }
}

export async function leaveCancelHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    sendSuccess(
      res,
      await service.cancelMyLeaveRequest(emp, String(req.params.id)),
      'Pengajuan dibatalkan',
    )
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function notificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await service.getNotifications(requireEmployee(req)))
  } catch (err) {
    next(err)
  }
}

export async function notificationReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.markNotificationRead(requireEmployee(req), String(req.params.id))
    sendSuccess(res, null, 'Notifikasi ditandai dibaca')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Device tokens
// ---------------------------------------------------------------------------

export async function registerDeviceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    const parsed = deviceTokenSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Token tidak valid', parsed.error.flatten()),
      )
    }
    await service.registerDeviceToken(emp, parsed.data.token, parsed.data.platform)
    sendSuccess(res, null, 'Device terdaftar')
  } catch (err) {
    next(err)
  }
}

export async function deleteDeviceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    requireEmployee(req)
    const parsed = deviceTokenDeleteSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Token tidak valid', parsed.error.flatten()),
      )
    }
    await service.deleteDeviceToken(parsed.data.token)
    sendSuccess(res, null, 'Device dihapus')
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Face enrollment
// ---------------------------------------------------------------------------

export async function enrollFaceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const emp = requireEmployee(req)
    const parsed = enrollFaceSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        new ValidationError('Input pendaftaran wajah tidak valid', parsed.error.flatten()),
      )
    }
    sendSuccess(
      res,
      await service.enrollFace(emp, parsed.data.faceImageBase64),
      'Wajah berhasil didaftarkan',
    )
  } catch (err) {
    next(err)
  }
}
