import { Response } from 'express'

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ApiPaginatedSuccess<T = unknown> {
  success: true
  data: T[]
  pagination: PaginationMeta
  message: string
}

// ---------------------------------------------------------------------------
// Pure shape factories (return plain objects, no Response needed)
// ---------------------------------------------------------------------------

/** Returns the standard success response shape. */
export function successResponse<T>(data: T, message = 'OK'): ApiSuccess<T> {
  return { success: true, data, message }
}

/** Returns the standard error response shape. */
export function errorResponse(
  code: string,
  message: string
): ApiError {
  return { success: false, error: { code, message } }
}

/** Returns the standard paginated success response shape. */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message = 'OK'
): ApiPaginatedSuccess<T> {
  return { success: true, data, pagination, message }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  } satisfies ApiSuccess<T>)
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  } satisfies ApiError)
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedData<T> {
  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  }
}

export function parsePagination(query: Record<string, unknown>): {
  page: number
  pageSize: number
  skip: number
} {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const pageSizeRaw = parseInt(String(query.page_size ?? '25'), 10) || 25
  const pageSize = [10, 25, 50, 100].includes(pageSizeRaw) ? pageSizeRaw : 25
  return { page, pageSize, skip: (page - 1) * pageSize }
}
