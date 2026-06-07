/**
 * types/leave.ts
 *
 * Type definitions for Leave & Permit (Izin & Cuti) page.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.10
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

// ---------------------------------------------------------------------------
// Leave Request (returned by GET /leave-requests)
// ---------------------------------------------------------------------------

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string | null;
  type: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string | null;
  attachmentUrl: string | null;
  attachmentSignedUrl: string | null;
  status: LeaveStatus;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  conflictNote: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export interface LeaveFilters {
  status: LeaveStatus | "";
  search: string;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export interface LeaveTypeOption {
  id: string;
  name: string;
}

export interface EmployeeOption {
  id: string;
  employeeCode: string;
  fullName: string;
  departmentName: string | null;
}

// ---------------------------------------------------------------------------
// API request payloads
// ---------------------------------------------------------------------------

export interface ApproveLeavePayload {
  notes?: string;
}

export interface RejectLeavePayload {
  notes: string;
}

export interface CreateLeavePayload {
  employeeId: string;
  type: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
  status?: "Pending" | "Approved";
}

// ---------------------------------------------------------------------------
// API response
// ---------------------------------------------------------------------------

export interface ApproveLeaveResponse {
  id: string;
  status: LeaveStatus;
  conflictWarning?: boolean;
  conflictNote?: string | null;
}
