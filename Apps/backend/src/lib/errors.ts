export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'LOCKED'
  | 'EXPIRED_TOKEN'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Autentikasi diperlukan') {
    super('UNAUTHENTICATED', message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak') {
    super('FORBIDDEN', message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') {
    super('NOT_FOUND', message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Terlalu banyak permintaan, coba lagi nanti') {
    super('RATE_LIMITED', message, 429)
  }
}

export class LockedError extends AppError {
  constructor(message = 'Akun terkunci sementara') {
    super('LOCKED', message, 423)
  }
}

export class ExpiredTokenError extends AppError {
  constructor(message = 'Token sudah kedaluwarsa') {
    super('EXPIRED_TOKEN', message, 401)
  }
}

// ---------------------------------------------------------------------------
// Factory functions (convenience wrappers)
// ---------------------------------------------------------------------------

export function createValidationError(msg: string, details?: unknown): ValidationError {
  return new ValidationError(msg, details)
}

export function createUnauthenticatedError(msg?: string): UnauthenticatedError {
  return new UnauthenticatedError(msg)
}

export function createForbiddenError(msg?: string): ForbiddenError {
  return new ForbiddenError(msg)
}

export function createNotFoundError(entity?: string): NotFoundError {
  return new NotFoundError(entity ? `${entity} tidak ditemukan` : undefined)
}

export function createConflictError(msg: string): ConflictError {
  return new ConflictError(msg)
}
