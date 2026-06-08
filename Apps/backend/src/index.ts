import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env'
import { requestIdMiddleware } from './middleware/requestId'
import { requestLogger } from './middleware/logger'
import { errorHandler } from './middleware/errorHandler'
import { generalRateLimit } from './middleware/rateLimiter'
import { logger } from './lib/logger'
import authRouter from './modules/auth/auth.routes'
import dashboardRouter from './modules/dashboard/dashboard.routes'
import departmentsRouter from './modules/departments/departments.routes'
import employeesRouter from './modules/employees/employees.routes'
import shiftsRouter from './modules/shifts/shifts.routes'
import locationsRouter from './modules/locations/locations.routes'
import attendanceRouter from './modules/attendance/attendance.routes'
import leaveRouter from './modules/leave/leave.routes'
import reportsRouter from './modules/reports/reports.routes'
import exportsRouter from './modules/exports/exports.routes'
import settingsRouter from './modules/settings/settings.routes'
import auditRouter from './modules/audit/audit.routes'
import notificationsRouter from './modules/notifications/notifications.routes'
import { startExportWorker } from './jobs/exportWorker'
import { startAbsentJob } from './jobs/absentJob'
import { startMissingCheckoutJob } from './jobs/missingCheckoutJob'
import { startDailySummaryJob } from './jobs/dailySummaryJob'
import { startCleanupJob } from './jobs/cleanupExportJob'

const app = express()

// Security headers
app.use(helmet())

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request ID + structured logging
app.use(requestIdMiddleware)
app.use(requestLogger)

// Global rate limit on all /api/v1 routes (R17.3, R1.8)
app.use('/api/v1', generalRateLimit)

// Auth routes (me + workspaces/current + login/logout events)
app.use('/api/v1', authRouter)

// Dashboard routes
app.use('/api/v1', dashboardRouter)

// Departments routes
app.use('/api/v1', departmentsRouter)

// Employees routes
app.use('/api/v1', employeesRouter)

// Shifts routes
app.use('/api/v1', shiftsRouter)

// Locations routes
app.use('/api/v1', locationsRouter)

// Attendance routes
app.use('/api/v1', attendanceRouter)

// Leave routes
app.use('/api/v1', leaveRouter)

// Reports routes
app.use('/api/v1', reportsRouter)

// Exports routes
app.use('/api/v1', exportsRouter)

// Settings routes (workspace, roles, holidays)
app.use('/api/v1', settingsRouter)

// Audit log routes
app.use('/api/v1', auditRouter)

// Notifications routes
app.use('/api/v1', notificationsRouter)

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    message: 'OK',
  })
})

// Global error handler (must be last)
app.use(errorHandler)

const PORT = env.PORT

app.listen(PORT, () => {
  logger.info(`AttendX backend running on port ${PORT}`, { env: env.NODE_ENV })
  // Start the async export worker (polls every 30 seconds for Queued jobs)
  startExportWorker()
  // Start scheduled jobs (Task 41 — R15.6, 15.7, 15.8)
  startAbsentJob()
  startMissingCheckoutJob()
  startDailySummaryJob()
  // Start cleanup job for export file retention (Task 42 — R12.11, 12.12)
  startCleanupJob()
})

export default app
