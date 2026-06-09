/**
 * mobile.controller.ts — request/response handlers for the mobile self-service
 * API. Every handler reads `req.employee` (set by authenticateMobile) and never
 * trusts an employee id from the request body.
 */

import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../lib/response'
import { UnauthenticatedError, ValidationError } from '../../lib/errors'
import * as service from './mobile.service'
import type { CheckInput, CreateLeaveInput } from './mobile.service'

function requireEmployee(req: Request) {
  if (!req.employee) throw new UnauthenticatedError('Autentikasi diperlukan')
  return req.employee
}

export async function todayHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getToday(requireEmployee(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function historyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getHistory(requireEmployee(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function attendanceDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id)
    const data = await service.getAttendanceDetail(requireEmployee(req), id)
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function shiftHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMyShift(requireEmployee(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function locationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMyLocations(requireEmployee(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

function parseCheckInput(body: unknown): CheckInput {
  const b = (body ?? {}) as Record<string, unknown>
  const workMode = b.workMode === 'wfh' ? 'wfh' : 'wfo'
  const latitude = Number(b.latitude)
  const longitude = Number(b.longitude)
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ValidationError('Koordinat lokasi diperlukan')
  }
  return {
    workMode,
    latitude,
    longitude,
    faceVerified: Boolean(b.faceVerified),
    livenessPassed: Boolean(b.livenessPassed),
    locationId: typeof b.locationId === 'string' ? b.locationId : null,
    capturedAt: typeof b.capturedAt === 'string' ? b.capturedAt : null,
  }
}

export async function checkInHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseCheckInput(req.body)
    const data = await service.checkIn(requireEmployee(req), input)
    sendSuccess(res, data, 'Check-in berhasil', 201)
  } catch (err) {
    next(err)
  }
}

export async function checkOutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parseCheckInput(req.body)
    const data = await service.checkOut(requireEmployee(req), input)
    sendSuccess(res, data, 'Check-out berhasil')
  } catch (err) {
    next(err)
  }
}

export async function leaveListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMyLeaveRequests(requireEmployee(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function createLeaveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>
    if (typeof b.type !== 'string' || typeof b.startDate !== 'string' || typeof b.endDate !== 'string') {
      throw new ValidationError('Jenis, tanggal mulai, dan tanggal selesai diperlukan')
    }
    const input: CreateLeaveInput = {
      type: b.type,
      startDate: b.startDate,
      endDate: b.endDate,
      reason: typeof b.reason === 'string' ? b.reason : '',
    }
    const data = await service.createMyLeaveRequest(requireEmployee(req), input)
    sendSuccess(res, data, 'Pengajuan terkirim', 201)
  } catch (err) {
    next(err)
  }
}

export async function scheduleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMySchedule(requireEmployee(req))
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}

export async function notificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = requireEmployee(req)
    const data = await service.getMyNotifications(employee, req.user!.authUserId)
    sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
}
