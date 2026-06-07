/**
 * types/workforce.ts
 *
 * Type definitions for Workforce / Employee Management pages.
 *
 * Requirements: 7.1–7.16
 */

// ---------------------------------------------------------------------------
// Enums (mirror backend schema)
// ---------------------------------------------------------------------------

export type EmploymentStatus = "Active" | "Inactive" | "Suspended" | "Archived";
export type AccountStatus =
  | "Pending_Activation"
  | "Active"
  | "Disabled"
  | "No_Login_Access";
export type WorkMode = "WFO" | "WFH" | "Hybrid";

// ---------------------------------------------------------------------------
// Employee (list item, returned by GET /employees)
// ---------------------------------------------------------------------------

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  departmentName?: string;
  workMode: WorkMode;
  employmentStatus: EmploymentStatus;
  accountStatus: AccountStatus;
  assignedShiftId?: string;
  assignedShiftName?: string;
  assignedLocationId?: string;
  assignedLocationName?: string;
  joinedAt?: string;
  /** Warning: no shift assigned (R7.12) */
  hasShiftWarning: boolean;
  /** Warning: no location assigned (R7.12) */
  hasLocationWarning: boolean;
}

// ---------------------------------------------------------------------------
// Form schemas (used by React Hook Form + Zod)
// ---------------------------------------------------------------------------

export interface AddEmployeeFormValues {
  fullName: string;
  email: string;
  employeeCode?: string;
  phone?: string;
  departmentId: string;
  position?: string;
  workMode: WorkMode;
  assignedShiftId?: string;
  assignedLocationId: string;
  joinedAt: string;
}

export interface EditEmployeeFormValues {
  fullName: string;
  employeeCode?: string;
  phone?: string;
  departmentId: string;
  position?: string;
  workMode: WorkMode;
  assignedShiftId?: string;
  assignedLocationId: string;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export interface WorkforceFilters {
  search: string;
  status: EmploymentStatus | "";
  departmentId: string;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Reference data (from API, for selects)
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: "Active" | "Inactive";
}

export interface Location {
  id: string;
  name: string;
  type: "Office" | "Branch" | "WFHApproved";
  status: "Active" | "Inactive";
}

// ---------------------------------------------------------------------------
// Status change dialog state
// ---------------------------------------------------------------------------

export type StatusChangeAction = "archive" | "reactivate" | "suspend" | "activate";

export interface StatusChangeTarget {
  employee: Employee;
  action: StatusChangeAction;
}
