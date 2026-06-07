import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../lib/errors'
import { logger } from '../lib/logger'

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId

  if (err instanceof AppError) {
    logger.warn('App error', {
      requestId,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    })
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    })
    return
  }

  if (err instanceof ZodError) {
    logger.warn('Validation error', { requestId, issues: err.issues, path: req.path })
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: err.flatten().fieldErrors,
      },
    })
    return
  }

  logger.error('Unhandled error', {
    requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
  })

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan internal server',
    },
  })
}
