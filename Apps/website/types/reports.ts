/**
 * types/reports.ts
 *
 * Type definitions for Reports & Export functionality.
 * Requirements: 12.3, 12.8, 12.11
 */

export type ReportType =
  | "AttendanceSummary"
  | "DailyDetail"
  | "Late"
  | "MissingCheckout"
  | "LeaveAndPermit"
  | "DepartmentAttendance";

export type ExportFormat = "xlsx" | "csv" | "pdf";

export type ExportStatus =
  | "Queued"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Expired";

// Keep backward compat alias
export type ExportJobStatus = ExportStatus;

export interface ExportJob {
  id: string;
  reportType: ReportType;
  format: ExportFormat;
  rowCount: number | null;
  status: ExportStatus;
  requestedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  signedUrl?: string | null;
}

export interface AttendanceSummary {
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    missingCheckout: number;
  };
  sampleRows: SampleRow[];
  totalRows: number;
}

export interface SampleRow {
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  date: string;
  shiftName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface ReportFilters {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  department?: string;
  location?: string;
  shift?: string;
  status?: string;
  format?: ExportFormat;
}

// ---------------------------------------------------------------------------
// Preview list item (for non-summary reports)
// ---------------------------------------------------------------------------

export interface ReportListRow {
  id: string;
  employeeName: string;
  employeeCode: string;
  department?: string;
  date?: string;
  shift?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
  workMode?: string;
  location?: string;
  notes?: string | null;
  [key: string]: unknown;
}

export interface ReportListResponse {
  data: ReportListRow[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}
