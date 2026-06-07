import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  res.on('finish', () => {
    logger.info('HTTP request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
  })

  next()
}
