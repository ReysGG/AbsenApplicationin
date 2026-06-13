-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('Active', 'Inactive', 'Suspended', 'Archived');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PendingActivation', 'Active', 'Disabled', 'NoLoginAccess');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('Present', 'Late', 'Absent', 'PendingCheckout', 'MissingCheckout', 'Leave', 'Invalid', 'Duplicate');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('WFO', 'WFH', 'Hybrid');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('Office', 'Branch', 'WFHApproved');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('stakeholder', 'support_admin', 'end_user');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('workspace', 'department', 'location');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('Queued', 'Processing', 'Completed', 'Failed', 'Expired');

-- CreateEnum
CREATE TYPE "FaceProfileStatus" AS ENUM ('NotRegistered', 'Registered', 'NeedReEnrollment');

-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('super_admin', 'admin_platform', 'user');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('Synced', 'SyncedLate', 'Pending');

-- CreateEnum
CREATE TYPE "GeofenceStatus" AS ENUM ('Valid', 'Invalid', 'Outside');

-- CreateEnum
CREATE TYPE "FaceCheckStatus" AS ENUM ('Passed', 'Failed', 'Skipped');

-- CreateEnum
CREATE TYPE "SpoofingStatus" AS ENUM ('Clean', 'Detected', 'Suspected');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('AttendanceSummary', 'DailyDetail', 'Late', 'MissingCheckout', 'LeaveAndPermit', 'DepartmentAttendance');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('XLSX', 'CSV', 'PDF');

-- CreateEnum
CREATE TYPE "HolidayStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('leave_request_new', 'export_completed', 'leave_approved', 'leave_rejected');

-- CreateEnum
CREATE TYPE "LeaveSource" AS ENUM ('mobile', 'dashboard');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('Paid', 'Pending', 'Overdue');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'InProgress', 'Closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('Billing', 'Technical', 'FeatureRequest');

-- CreateEnum
CREATE TYPE "TicketSender" AS ENUM ('Client', 'Agent');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'Active',
    "plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "default_geofence_radius" INTEGER NOT NULL DEFAULT 100,
    "default_grace_period" INTEGER NOT NULL DEFAULT 10,
    "absence_cutoff_minutes" INTEGER NOT NULL DEFAULT 120,
    "wfh_enabled" BOOLEAN NOT NULL DEFAULT false,
    "hybrid_enabled" BOOLEAN NOT NULL DEFAULT false,
    "late_policy" JSONB,
    "missing_checkout_policy" JSONB,
    "export_permissions" JSONB,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "full_name" TEXT NOT NULL,
    "global_role" "GlobalRole" NOT NULL DEFAULT 'user',
    "status" "AccountStatus" NOT NULL DEFAULT 'Active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "scope_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignment_permissions" (
    "id" TEXT NOT NULL,
    "role_assignment_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_assignment_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'Office',
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 100,
    "status" "LocationStatus" NOT NULL DEFAULT 'Active',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department_id" TEXT NOT NULL,
    "position" TEXT,
    "employment_status" "EmploymentStatus" NOT NULL DEFAULT 'Active',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'PendingActivation',
    "work_mode" "WorkMode" NOT NULL DEFAULT 'WFO',
    "face_profile_status" "FaceProfileStatus" NOT NULL DEFAULT 'NotRegistered',
    "assigned_location_id" TEXT,
    "assigned_shift_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL,
    "inactive_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_wfh_locations" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_wfh_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 10,
    "checkout_tolerance_minutes" INTEGER NOT NULL DEFAULT 60,
    "absence_cutoff_minutes" INTEGER NOT NULL DEFAULT 120,
    "work_days" TEXT[],
    "effective_from" TIMESTAMP(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_date" TIMESTAMP(3) NOT NULL,
    "shift_id" TEXT,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "check_in_latitude" DOUBLE PRECISION,
    "check_in_longitude" DOUBLE PRECISION,
    "check_out_latitude" DOUBLE PRECISION,
    "check_out_longitude" DOUBLE PRECISION,
    "location_id" TEXT,
    "work_mode" "WorkMode",
    "face_check_status" "FaceCheckStatus",
    "geofence_status" "GeofenceStatus",
    "spoofing_status" "SpoofingStatus",
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'Pending',
    "original_check_in_at" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PendingCheckout',
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "attachment_url" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'Pending',
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "conflict_note" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "filters_json" JSONB NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "row_count" INTEGER,
    "status" "ExportStatus" NOT NULL DEFAULT 'Queued',
    "file_path" TEXT,
    "signed_url_expires_at" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendars" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "recurring_yearly" BOOLEAN NOT NULL DEFAULT false,
    "status" "HolidayStatus" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_raw_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "raw_payload_json" JSONB NOT NULL,
    "device_time" TIMESTAMP(3) NOT NULL,
    "server_received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "face_result" TEXT,
    "geofence_result" TEXT,
    "spoofing_result" TEXT,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "is_invalid_sequence" BOOLEAN NOT NULL DEFAULT false,
    "resulting_attendance_log_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_raw_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_settings" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "late_calculation_policy" JSONB,
    "missing_checkout_policy" JSONB,
    "export_permissions_json" JSONB,
    "display_settings_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "recipient_auth_user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "ref_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'Pending',
    "issued_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'Medium',
    "status" "TicketStatus" NOT NULL DEFAULT 'Open',
    "category" "TicketCategory" NOT NULL DEFAULT 'Technical',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sender" "TicketSender" NOT NULL,
    "sender_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "workspaces_tenant_id_idx" ON "workspaces"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "role_assignments_workspace_id_idx" ON "role_assignments"("workspace_id");

-- CreateIndex
CREATE INDEX "role_assignments_user_id_idx" ON "role_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignments_workspace_id_user_id_role_scope_type_scope_key" ON "role_assignments"("workspace_id", "user_id", "role", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignment_permissions_role_assignment_id_permission_i_key" ON "role_assignment_permissions"("role_assignment_id", "permission_id");

-- CreateIndex
CREATE INDEX "departments_workspace_id_idx" ON "departments"("workspace_id");

-- CreateIndex
CREATE INDEX "locations_workspace_id_idx" ON "locations"("workspace_id");

-- CreateIndex
CREATE INDEX "employees_workspace_id_idx" ON "employees"("workspace_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_workspace_id_employment_status_idx" ON "employees"("workspace_id", "employment_status");

-- CreateIndex
CREATE INDEX "employees_workspace_id_department_id_employment_status_idx" ON "employees"("workspace_id", "department_id", "employment_status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_workspace_id_employee_code_key" ON "employees"("workspace_id", "employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_workspace_id_email_key" ON "employees"("workspace_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_wfh_locations_employee_id_location_id_key" ON "employee_wfh_locations"("employee_id", "location_id");

-- CreateIndex
CREATE INDEX "shifts_workspace_id_idx" ON "shifts"("workspace_id");

-- CreateIndex
CREATE INDEX "attendance_logs_workspace_id_idx" ON "attendance_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "attendance_logs_employee_id_idx" ON "attendance_logs"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_logs_attendance_date_idx" ON "attendance_logs"("attendance_date");

-- CreateIndex
CREATE INDEX "attendance_logs_status_idx" ON "attendance_logs"("status");

-- CreateIndex
CREATE INDEX "attendance_logs_workspace_id_attendance_date_status_idx" ON "attendance_logs"("workspace_id", "attendance_date", "status");

-- CreateIndex
CREATE INDEX "attendance_logs_workspace_id_employee_id_attendance_date_idx" ON "attendance_logs"("workspace_id", "employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_logs_workspace_id_attendance_date_idx" ON "attendance_logs"("workspace_id", "attendance_date");

-- CreateIndex
CREATE INDEX "leave_requests_workspace_id_idx" ON "leave_requests"("workspace_id");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_workspace_id_status_idx" ON "leave_requests"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "leave_requests_workspace_id_employee_id_status_idx" ON "leave_requests"("workspace_id", "employee_id", "status");

-- CreateIndex
CREATE INDEX "export_jobs_workspace_id_idx" ON "export_jobs"("workspace_id");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "holiday_calendars_workspace_id_idx" ON "holiday_calendars"("workspace_id");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_idx" ON "audit_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_created_at_idx" ON "audit_logs"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_action_created_at_idx" ON "audit_logs"("workspace_id", "action", "created_at");

-- CreateIndex
CREATE INDEX "attendance_raw_logs_workspace_id_idx" ON "attendance_raw_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "attendance_raw_logs_employee_id_idx" ON "attendance_raw_logs"("employee_id");

-- CreateIndex
CREATE INDEX "leave_types_workspace_id_idx" ON "leave_types"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_workspace_id_name_key" ON "leave_types"("workspace_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_settings_workspace_id_key" ON "workspace_settings"("workspace_id");

-- CreateIndex
CREATE INDEX "notifications_workspace_id_idx" ON "notifications"("workspace_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_auth_user_id_idx" ON "notifications"("recipient_auth_user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "support_tickets_tenant_id_idx" ON "support_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "ticket_messages_ticket_id_idx" ON "ticket_messages"("ticket_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignment_permissions" ADD CONSTRAINT "role_assignment_permissions_role_assignment_id_fkey" FOREIGN KEY ("role_assignment_id") REFERENCES "role_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignment_permissions" ADD CONSTRAINT "role_assignment_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_assigned_location_id_fkey" FOREIGN KEY ("assigned_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_assigned_shift_id_fkey" FOREIGN KEY ("assigned_shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_wfh_locations" ADD CONSTRAINT "employee_wfh_locations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_wfh_locations" ADD CONSTRAINT "employee_wfh_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_calendars" ADD CONSTRAINT "holiday_calendars_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_raw_logs" ADD CONSTRAINT "attendance_raw_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_raw_logs" ADD CONSTRAINT "attendance_raw_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
