/**
 * types/attendance.ts
 *
 * Type definitions for Live Attendance page.
 *
 * Requirements: 6.1, 6.2, 6.4, 16.4, 19.5
 */

// ---------------------------------------------------------------------------
// Enums (mirror backend schema)
// ---------------------------------------------------------------------------

export type AttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "PendingCheckout"
  | "MissingCheckout"
  | "Leave"
  | "Invalid";

// ---------------------------------------------------------------------------
// Attendance Record (returned by GET /attendance)
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentId: string | null;
  departmentName: string | null;
  shiftId: string | null;
  shiftName: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  originalCheckInAt: string | null;
  syncedAt: string | null;
  syncStatus: string;
  locationId: string | null;
  locationName: string | null;
  workMode: string | null;
  faceCheckStatus: string | null;
  geofenceStatus: string | null;
  spoofingStatus: string | null;
  status: AttendanceStatus;
  isDuplicate: boolean;
  notes: string | null;
  attendanceDate: string;
  /** Presigned URLs for captured face images (populated on detail fetch). */
  checkInFaceUrl?: string | null;
  checkOutFaceUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export interface AttendanceFilters {
  date: string;
  status: AttendanceStatus | "";
  departmentId: string;
  shiftId: string;
  search: string;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Reference data (for filter selects)
// ---------------------------------------------------------------------------

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface ShiftOption {
  id: string;
  name: string;
}
