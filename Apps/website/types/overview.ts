/**
 * types/overview.ts
 *
 * Tipe data untuk halaman Overview Dashboard.
 * Memetakan response dari endpoint:
 *   GET /api/v1/dashboard/summary
 *   GET /api/v1/dashboard/attendance-trend
 *   GET /api/v1/dashboard/department-breakdown
 *   GET /api/v1/dashboard/live-preview
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

// ---------------------------------------------------------------------------
// Summary Cards
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  total_employees: number;
  present: number;
  late: number;
  on_leave: number;
  absent: number;
  pending_checkout: number;
  date: string; // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Attendance Trend
// ---------------------------------------------------------------------------

export interface AttendanceTrendPoint {
  date: string; // YYYY-MM-DD
  present: number;
  late: number;
  absent: number;
}

// ---------------------------------------------------------------------------
// Department Breakdown
// ---------------------------------------------------------------------------

export interface DepartmentBreakdownRow {
  department_id: string;
  department_name: string;
  total: number;
  present: number;
  late: number;
  absent: number;
}

// ---------------------------------------------------------------------------
// Live Preview (last 5 check-ins)
// ---------------------------------------------------------------------------

export type AttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "PendingCheckout"
  | "MissingCheckout"
  | "Leave"
  | "Invalid";

export interface LivePreviewItem {
  attendance_id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  check_in_at: string; // ISO UTC
  status: AttendanceStatus;
}
