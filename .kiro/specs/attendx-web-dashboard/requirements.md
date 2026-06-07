# Requirements — AttendX Web Dashboard v1

## Introduction

AttendX Web Dashboard v1 adalah panel kerja berbasis web untuk HR/Admin sebuah workspace dalam sistem absensi digital SaaS multi-tenant. Dashboard ini memungkinkan Stakeholder dan Support Admin memantau kehadiran real-time, mengelola karyawan, lokasi, shift, izin/cuti, laporan, serta konfigurasi workspace — dengan kontrol akses berbasis role, granular permission, dan scope (workspace/department/location).

Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional untuk v1, mengikuti `PRD.md`, `PLANING WEB.MD`, serta keputusan klarifikasi di `PERTANYAAN PLANNING WEB.md`.

### Technical Context (locked v1)

- **Auth:** better-auth (email + password), Prisma + Supabase PostgreSQL. Field identitas memakai `auth_user_id` (bukan `firebase_uid`).
- **API:** Express.js di `Apps/backend`, base path `/api/v1`.
- **Web:** Next.js (`Apps/website`) sebagai UI + BFF/proxy. Alur: Browser → Next.js → Express → DB.
- **Data attendance:** dibuat dari mobile/backend; dashboard hanya membaca. Status final dihitung backend (write + scheduled job).
- **Real-time:** polling 10 detik.
- **Export:** Excel/XLSX + CSV; sync ≤ 5.000 row; async > 5.000 row (maks 50.000); file privat di Supabase Storage + signed URL.
- **Library:** Recharts (chart), TanStack Table (tabel), React Hook Form + Zod (form/validasi).
- **Pagination:** server-side, default 25 (opsi 10/25/50/100).
- **Bahasa:** Indonesia (struktur disiapkan bilingual).
- **Timezone:** per-workspace, simpan UTC, tampil sesuai workspace.

### Glossary

- **Workspace:** ruang kerja terisolasi milik tenant; unit utama isolasi data.
- **Active Workspace:** workspace yang sedang aktif untuk user pada sesi berjalan.
- **Stakeholder:** owner workspace; punya seluruh permission secara implisit; satu-satunya yang dapat memberi/mencabut role & permission.
- **Support Admin:** HR admin dengan akses terbatas sesuai granular permission + scope.
- **End User:** karyawan; tidak mengakses dashboard web v1.
- **Granular Permission:** izin spesifik per aksi/setting (mis. `manage_geofence`).
- **Scope:** batas data yang boleh diakses Support Admin (`workspace`, `department`, atau `location`), bisa multi-row.
- **Effective Dated:** aturan yang berlaku mulai tanggal efektif dan tidak mengubah histori.
- **Admin Note:** catatan HR pada AttendanceLog tanpa mengubah timestamp asli.
- **Account Status:** status akun login (`Pending_Activation`, `Active`, `Disabled`).
- **Employment Status:** status kepegawaian (`Active`, `Inactive`, `Suspended`, `Archived`).

### Permission Set (v1)

Action: `manage_employees`, `manage_locations`, `manage_shifts`, `manage_geofence`, `manage_wfh_mode`, `manage_grace_period`, `manage_attendance_policy`, `approve_leave`, `export_reports`, `manage_roles`.
View: `view_dashboard`, `view_live_attendance`, `view_reports`, `view_employees`, `view_audit_logs`.

### Requirements Index

1. Authentication & Session
2. Account Activation (Employee)
3. Authorization — Role, Permission & Scope
4. Multi-Tenant Isolation
5. Overview Dashboard
6. Live Attendance
7. Workforce / Employee Management
8. Department Management
9. Locations & Geofence
10. Shift Management
11. Leave & Permit Approval
12. Reports & Export
13. Workspace Settings
14. Audit Log
15. Attendance Status Calculation (Backend)
16. Non-Functional: Performance
17. Non-Functional: Security & Reliability
18. Non-Functional: API Contract & Observability
19. Non-Functional: UI/UX, Accessibility & Responsiveness
20. User Account & Profile
21. In-App Notifications

---

## Requirements

### Requirement 1: Authentication & Session

**User Story:** As an HR/Admin user, I want to log in securely with email and password and have my session managed safely, so that only authorized users can access the dashboard.

#### Acceptance Criteria

1. WHEN a user submits valid email and password THEN the system SHALL authenticate via better-auth and create a session.
2. WHEN a user submits invalid credentials THEN the system SHALL reject the attempt and display the generic message "Email atau password tidak valid" WITHOUT revealing whether the email exists.
3. WHERE "Remember me" is not selected THE system SHALL set session validity to 24 hours.
4. WHERE "Remember me" is selected THE system SHALL set session validity to 7 days.
5. WHILE a session is valid and the user is active THE system SHALL extend the session automatically until total expiry.
6. WHEN a session expires THEN the system SHALL redirect the user to the login page, AND after successful re-login SHALL redirect back to the last valid page.
7. IF a user fails login 5 times within 15 minutes THEN the system SHALL temporarily lock that account for 15 minutes.
8. THE system SHALL apply rate limiting on login per IP and per email (and per device/session fingerprint where feasible).
9. WHEN a user clicks "Forgot Password" and submits a registered email THEN the system SHALL send a reset link valid for 30 minutes.
10. WHEN a password reset is completed THEN the system SHALL invalidate all previous sessions of that user.
11. IF a reset link is used after 30 minutes THEN the system SHALL reject it and require requesting a new link.
12. WHEN a user logs out THEN the system SHALL terminate the current session.
13. THE system SHALL record `login_success`, `login_failed_due_to_lockout`, and `logout` events in the audit log.
14. IF an unauthenticated request reaches a protected endpoint THEN the system SHALL respond with `401 UNAUTHENTICATED`.

---

### Requirement 2: Account Activation (Employee)

**User Story:** As an HR/Admin, I want newly created employees to activate their own accounts via an invitation link, so that employees set their own passwords securely without manual password creation.

#### Acceptance Criteria

1. WHEN an employee record is created with an email THEN the system SHALL set `Account_Status = Pending_Activation`, `Employment_Status = Active`, and `Face_Profile_Status = Not_Registered`.
2. WHEN an employee record is created THEN the system SHALL generate an activation link valid for 7 days and send it to the employee's email.
3. WHERE a user is Stakeholder OR a Support Admin with `manage_employees` permission THE system SHALL allow sending/resending invitations.
4. WHILE `Account_Status = Pending_Activation` THE system SHALL prevent the employee from logging in.
5. WHEN an employee completes activation by setting a password THEN the system SHALL set `Account_Status = Active`.
6. WHEN an invitation is resent THEN the system SHALL generate a new activation token AND invalidate the previous token.
7. IF an activation link is used after 7 days THEN the system SHALL reject it and require a resend.
8. THE system SHALL NOT allow HR to set an employee's password manually in v1.
9. WHERE an employee record is created without login access THE system MAY set a `No_Login_Access` state (non-priority for MVP) AND SHALL NOT send an activation link.
10. THE system SHALL display the pre-activation status in the workforce list.

---

### Requirement 3: Authorization — Role, Permission & Scope

**User Story:** As a Stakeholder, I want granular, scope-based permissions for Support Admins, so that each admin can only perform the specific operations and access the specific data assigned to them.

#### Acceptance Criteria

1. THE system SHALL support roles `stakeholder`, `support_admin`, and `end_user`.
2. THE system SHALL grant a Stakeholder all permissions implicitly without explicit assignment.
3. THE system SHALL grant a Support Admin only the permissions explicitly assigned to them.
4. WHERE a user holds the `end_user` role only THE system SHALL deny access to the web dashboard.
5. THE system SHALL support the action permissions: `manage_employees`, `manage_locations`, `manage_shifts`, `manage_geofence`, `manage_wfh_mode`, `manage_grace_period`, `manage_attendance_policy`, `approve_leave`, `export_reports`, `manage_roles`.
6. THE system SHALL support the view permissions: `view_dashboard`, `view_live_attendance`, `view_reports`, `view_employees`, `view_audit_logs`.
7. WHEN any sensitive action or setting is requested THEN the system SHALL verify the specific permission required for that action (e.g., changing geofence requires `manage_geofence`).
8. WHERE only a Stakeholder may grant or revoke roles and permissions THE system SHALL deny role/permission management to Support Admins, even those holding `manage_roles`, to prevent privilege escalation among Support Admins.
9. THE system SHALL store scope as multiple `RoleAssignment` rows, allowing a single Support Admin to hold multiple department and/or location scopes simultaneously, AND SHALL allow a permission to be bound to a specific scope (e.g., `manage_employees` only for Department A).
10. WHEN a Support Admin requests data THEN the system SHALL filter results to the UNION (OR) of their assigned department/location scopes (an employee visible if in any scoped department OR any scoped location); WHERE scope is `workspace` THE system SHALL allow the entire workspace.
11. IF a user attempts an action without the required permission THEN the system SHALL respond with `403 FORBIDDEN` AND record `failed_permission_check_for_sensitive_action` in the audit log.
12. WHEN a user's role/permission is revoked THEN the system SHALL apply the change no later than the next session refresh.
13. WHERE a Support Admin holds `approve_leave` but lacks scope over the requesting employee's department/location THE system SHALL deny the approval (permission alone is insufficient).

---

### Requirement 4: Multi-Tenant Isolation

**User Story:** As a platform operator, I want strict workspace isolation, so that no user can ever read or modify data belonging to another workspace.

#### Acceptance Criteria

1. THE system SHALL associate every core record with a `workspace_id`.
2. WHEN any data query executes THEN the system SHALL filter by the requester's Active Workspace at the backend layer.
3. THE system SHALL enable Supabase RLS for `Workspace`, `Employee`, `AttendanceLog`, `LeaveRequest`, `Location`, `Shift`, and `RoleAssignment` before production.
4. WHILE RLS is enabled THE system SHALL still perform permission and scope checks at the backend (defense in depth).
5. THE system SHALL NOT expose any endpoint that returns data without a tenant/workspace filter.
6. IF a request attempts to access data outside the Active Workspace THEN the system SHALL respond with `403 FORBIDDEN` AND record `unauthorized_cross_workspace_access_attempt` as a security audit log entry.
7. WHERE a user belongs to multiple workspaces THE system SHALL use a single Active Workspace (last active or primary) AND SHALL NOT provide workspace switching in v1.
8. THE system SHALL include `workspace_id` in every audit log entry.

---

### Requirement 5: Overview Dashboard

**User Story:** As a Stakeholder or HR Admin, I want a real-time summary of today's attendance and trends, so that I can quickly understand operational status.

#### Acceptance Criteria

1. WHEN a user with `view_dashboard` opens the dashboard THEN the system SHALL display summary cards: Total Employees, Present Today, Late Today, On Leave/Permit, and Absent.
2. THE system SHALL display an attendance trend chart defaulting to the last 30 days.
3. THE system SHALL display a department breakdown, a leave & permit summary, and a live check-ins preview.
4. THE system SHALL apply the date range filter and the user's role/scope to all dashboard data.
5. WHEN a user clicks the "Late" card THEN the system SHALL navigate to Live Attendance pre-filtered to status = Late.
6. WHERE an employee has no assigned shift THE system SHALL classify them under "Unassigned Shift".
7. WHERE an employee was added today THE system SHALL NOT count them as absent before their active date.
8. WHERE an employee is inactive THE system SHALL exclude them from present/absent counts.
9. IF there is no data THEN the system SHALL display an empty state instead of an error AND the chart SHALL NOT crash.
10. THE system SHALL NOT display data from any other workspace.

---

### Requirement 6: Live Attendance

**User Story:** As an HR Admin, I want to monitor incoming attendance in near real time and filter it, so that I can validate daily attendance operationally.

#### Acceptance Criteria

1. WHEN a user with `view_live_attendance` opens Live Attendance THEN the system SHALL display a table with columns: Employee name, Employee ID, Department, Shift, Check-in time, Check-out time, Location, Work mode, Face verification status, GPS/geofence status, Attendance status, Sync status, and Action/detail.
2. THE system SHALL refresh the live attendance data by polling every 10 seconds.
3. THE system SHALL provide filters for date, status, department, location, and shift, processed server-side.
4. WHEN a user opens an attendance detail THEN the system SHALL display check-in/check-out timestamps, location, face status, geofence status, and sync status (original time and sync time).
5. WHERE offline-synced data exists THE system SHALL display the original check-in time and the sync time without altering the original timestamp.
6. THE system SHALL NOT allow direct editing or deletion of attendance logs from the dashboard.
7. WHEN a user with appropriate permission adds an admin note via `POST /attendance/:id/adjustment-note` THEN the system SHALL store the note, preserve original timestamps, AND record the action in the audit log.
8. WHEN data is filtered THEN the results SHALL respect the user's scope and Active Workspace.
9. THE system SHALL NOT display attendance from any other workspace.
10. THE system SHALL store all raw check-in/check-out attempts (including duplicates, failed face verification, invalid sequence, GPS spoofing, and offline sync) in a separate `AttendanceRawLog`, while `AttendanceLog` holds the final result used for reporting.

---

### Requirement 7: Workforce / Employee Management

**User Story:** As a Stakeholder or HR Admin, I want to manage employee records, statuses, and assignments, so that workforce data stays accurate without losing attendance history.

#### Acceptance Criteria

1. WHERE a user is Stakeholder THE system SHALL allow full employee CRUD (create, edit, status change, assign role).
2. WHERE a user is a Support Admin with `manage_employees` THE system SHALL allow employee management limited to their scope.
3. WHEN creating an employee THEN the system SHALL require: Full name, Email, Employee code, Department, Employment status, Assigned shift, Assigned location, Work mode eligibility, and Join date.
4. WHEN an employee code is needed THEN the system SHALL auto-generate it in the format `EMP-YYYY-0001` AND SHALL allow HR to edit it.
5. THE system SHALL enforce that Employee code is unique within a workspace AND MAY repeat across different workspaces.
6. THE system SHALL enforce that employee email is unique within a workspace.
7. IF an email already exists in the workspace THEN the system SHALL display "Email already exists in this workspace".
8. THE system SHALL restrict `Employment_Status` to `Active`, `Inactive`, `Suspended`, or `Archived` AND SHALL NOT permanently delete employees.
9. WHERE an employee is `Inactive` or `Archived` THE system SHALL prevent check-in AND SHALL retain all attendance history.
10. WHERE an employee is `Archived` THE system SHALL exclude them from active lists but include them in historical reports with an "Archived" badge.
11. WHEN an employee is archived AND the underlying user holds only the `end_user` role THEN the system SHALL allow disabling the login account; WHERE the user also holds Support Admin/Stakeholder roles THE system SHALL preserve dashboard access per the dashboard role.
12. WHERE an employee lacks an assigned shift or location THE system SHALL display a warning ("Shift belum diatur" / "Lokasi belum diatur").
13. THE system SHALL allow exactly one active primary shift per employee per effective date in v1.
14. THE system SHALL require at least one primary assigned location per employee.
15. THE system SHALL prevent a Support Admin from modifying employees outside their scope.
16. THE system SHALL record `create_employee`, `update_employee`, `archive_employee`, and `reactivate_employee` in the audit log.

---

### Requirement 8: Department Management

**User Story:** As an HR Admin, I want to manage departments, so that employees can be organized and scoped correctly.

#### Acceptance Criteria

1. THE system SHALL allow creating, editing, and deactivating departments within a workspace.
2. THE system SHALL allow listing employees by department.
3. THE system SHALL support a single-level department structure in v1 (no parent-child hierarchy).
4. IF a department has employees or history THEN the system SHALL prevent hard delete AND allow deactivation only.
5. WHERE a department is deactivated THE system SHALL prevent its use for new assignments while retaining it in historical data.
6. THE system SHALL record `create_department`, `update_department`, and `deactivate_department` in the audit log.

---

### Requirement 9: Locations & Geofence

**User Story:** As an HR Admin, I want to manage work locations and geofence radius, so that attendance can be validated against valid coordinates.

#### Acceptance Criteria

1. WHERE a user is Stakeholder OR has `manage_locations` THE system SHALL allow creating, editing, and activating/deactivating locations.
2. THE system SHALL require name, latitude, longitude, and radius for every location.
3. WHEN entering coordinates THEN the system SHALL provide a Leaflet/OpenStreetMap picker AND SHALL allow manual latitude/longitude input as a fallback.
4. IF coordinates are empty THEN the system SHALL prevent saving the form.
5. THE system SHALL enforce geofence radius between 50 meters (minimum) and 500 meters (maximum), with defaults WFO = 100 m and WFH = 150 m.
6. IF the radius is below the minimum or above the maximum THEN the system SHALL display the corresponding validation message.
7. WHEN a user changes a geofence radius THEN the system SHALL require confirmation via a dialog stating the change applies only to new attendance and does not alter historical data.
8. WHERE `manage_geofence` permission is required THE system SHALL deny radius changes to users lacking it.
9. THE system SHALL apply radius/coordinate changes only to new attendance AND SHALL NOT alter historical attendance validation.
10. IF a location has attendance history THEN the system SHALL prevent permanent deletion AND allow only deactivation.
11. WHERE a location is `Inactive` THE system SHALL exclude it from new assignment options while retaining it in historical reports.
12. THE system SHALL support multi-branch locations and location types `Office`, `Branch`, and `WFHApproved`.
13. THE system SHALL allow at most 3 approved WFH locations per employee, all created/approved by HR.
14. WHERE WFH mode is enabled THE system SHALL allow WFH check-in only from approved WFH locations (enforced by backend/mobile).
15. THE system SHALL record `create_location`, `update_location`, `change_geofence_radius`, and `deactivate_location` in the audit log.

---

### Requirement 10: Shift Management

**User Story:** As an HR Admin, I want to manage work shifts and assign them to employees, so that attendance status calculations are accurate.

#### Acceptance Criteria

1. WHERE a user is Stakeholder OR has `manage_shifts` THE system SHALL allow creating and editing shifts.
2. WHEN creating a shift THEN the system SHALL capture name, start time, end time, optional break time, grace period, checkout tolerance, work days, status, and effective_from.
3. THE system SHALL store work days as a list of active days (e.g., `["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]`).
4. THE system SHALL default grace period to 10 minutes and checkout tolerance to 60 minutes after shift end.
5. THE system SHALL default the absence cut-off to 120 minutes after shift start, configurable per workspace.
6. IF start time equals end time THEN the system SHALL reject the form.
7. WHERE a shift crosses midnight THE system SHALL set the attendance date to the shift start date AND allow checkout on the following day.
8. THE system SHALL allow assigning a shift to employees via `POST /shifts/:id/assign`.
9. THE system SHALL apply shift changes from the effective date forward AND SHALL NOT alter historical attendance.
10. IF a shift has attendance history THEN the system SHALL prevent hard delete AND use an Active → Inactive lifecycle only.
11. THE system SHALL allow listing employees who have no assigned shift.
12. WHERE `manage_grace_period` permission is required THE system SHALL deny grace period changes to users lacking it.
13. THE system SHALL record `create_shift`, `update_shift`, `deactivate_shift`, `assign_shift`, and `assign_location` in the audit log.

---

### Requirement 11: Leave & Permit Approval

**User Story:** As an HR Admin, I want to review and decide on leave/permit requests, so that approved leave is reflected accurately in attendance and reports.

#### Acceptance Criteria

1. WHEN a user with `view_live_attendance`/relevant access opens Leave & Permit THEN the system SHALL list requests with fields: Employee, Leave type, Start date, End date, Reason, optional Attachment, Status, Approver, Approved/Rejected at, and Notes.
2. THE system SHALL support leave statuses `Pending`, `Approved`, `Rejected`, and `Cancelled`.
3. THE system SHALL support a configurable leave type list seeded with: Sakit, Cuti Tahunan, Izin Pribadi, Dinas Luar, WFH Request, Lainnya.
4. WHERE a user is Stakeholder OR a Support Admin with `approve_leave` and matching scope THE system SHALL allow approve/reject as a single approver.
5. IF an approver lacks scope over the employee's department/location THEN the system SHALL deny the approval.
6. WHEN a request is approved THEN the system SHALL store the approver ID and timestamp, AND mark the relevant dates as Leave so the employee is not counted absent.
7. WHILE a request is `Pending` or `Rejected` THE system SHALL NOT change attendance status.
8. WHEN a multi-day request is approved THEN the system SHALL apply Leave status to all dates in the range.
9. IF a new request overlaps an existing `Pending` or `Approved` request THEN the system SHALL reject the new request.
10. IF an employee already has attendance on a requested leave date THEN the system SHALL warn the approver, SHALL NOT auto-overwrite attendance, AND SHALL store a conflict note if approved anyway.
11. THE system SHALL reject backdated leave requests by default in v1.
12. WHERE leave is created from the dashboard by HR for operational needs THE system SHALL allow manual leave records.
13. THE system SHALL allow employee-sourced requests (from mobile) to be processed in the dashboard.
14. THE system SHALL set a request to `Cancelled` only via an explicit user/admin action.
15. THE system SHALL accept attachments of type PDF, JPG, or PNG up to 5 MB, stored in a private bucket and accessed via signed URL; attachments SHALL be optional for all leave types in v1.
16. THE system SHALL record `approve_leave`, `reject_leave`, and `cancel_leave` in the audit log.

---

### Requirement 12: Reports & Export

**User Story:** As an HR Admin, I want to generate and export attendance reports filtered by period and scope, so that I can complete monthly recaps quickly and safely.

#### Acceptance Criteria

1. THE system SHALL provide report types: Attendance Summary, Daily Attendance Detail, Late Employees, Missing Checkout, Leave & Permit, and Department Attendance.
2. WHEN a user generates a report THEN the system SHALL allow filtering by period, department, location, shift, status, and employee, processed server-side.
3. BEFORE exporting THE system SHALL display a preview showing data count summary (total present, late, absent, leave) and sample rows.
4. WHERE a user has `export_reports` THE system SHALL allow exporting to Excel/XLSX and CSV; PDF SHALL be deferred to v1.1.
5. THE system SHALL include in each report: employee name, Employee ID, department, date, shift, check-in, check-out, status, work mode, location, and notes.
6. THE system SHALL restrict exported data to the user's permission, scope, and Active Workspace.
7. IF the result set is 5,000 rows or fewer THEN the system SHALL process the export synchronously.
8. IF the result set exceeds 5,000 rows THEN the system SHALL process the export asynchronously as an ExportJob with statuses `Queued`, `Processing`, `Completed`, `Failed`, `Expired`.
9. IF the result set exceeds 50,000 rows THEN the system SHALL reject the export and prompt the user to narrow filters.
10. WHEN an async export completes THEN the system SHALL store the file in private Supabase Storage AND provide a signed URL valid for 24 hours, shown on the Export History page.
11. THE system SHALL retain export files for 7 days, after which a scheduled cleanup job SHALL delete them; WHILE the file is within retention THE system SHALL allow regenerating the signed URL.
12. THE system SHALL retain export history for at least 30 days, recording: requesting user, filters used, file format, row count, job status, request timestamp, and completion timestamp.
13. IF a result period is empty THEN the system SHALL still produce a file containing headers.
14. THE system SHALL record every `export_report` action in the audit log.

---

### Requirement 13: Workspace Settings

**User Story:** As a Stakeholder, I want to configure workspace rules, so that attendance behavior matches company policy without affecting historical data.

#### Acceptance Criteria

1. THE system SHALL provide settings: workspace name, default timezone, default geofence radius, default grace period, WFH mode enable/disable, hybrid mode enable/disable, late calculation policy, missing checkout policy, export permissions, and role management.
2. WHERE a user is Stakeholder THE system SHALL allow changing all workspace settings.
3. WHERE a Support Admin lacks the specific permission for an operational setting THE system SHALL display that setting in a disabled state rather than hiding it.
4. WHEN a Support Admin with the specific operational permission changes a permitted setting THEN the system SHALL allow the change.
5. THE system SHALL treat the following as effective-dated (not altering history): grace period, attendance calculation policy, shift rule, checkout tolerance, absence cut-off, and work day policy.
6. THE system SHALL treat the following as immediately effective (new attendance/assignment only): workspace name, dashboard display, export permission, role permission, WFH mode enable/disable, geofence radius, and location active/inactive.
7. THE system SHALL NOT allow setting changes to alter historical attendance results.
8. WHERE the timezone changes THE system SHALL keep stored timestamps in UTC AND display them in the new workspace timezone.
9. WHERE WFH mode is disabled THE system SHALL prevent selecting WFH mode for new attendance.
10. IF removing the last Stakeholder role would leave the workspace without an owner THEN the system SHALL reject the operation.
11. THE system SHALL record `update_workspace_setting` and `update_role_permission` in the audit log.
12. THE system SHALL allow HR to maintain a manual Holiday Calendar in v1; automatic national-holiday integration SHALL be deferred to v1.1.

---

### Requirement 14: Audit Log

**User Story:** As a Stakeholder or authorized admin, I want an append-only audit log of important actions, so that changes and security events are traceable.

#### Acceptance Criteria

1. THE system SHALL record the following actions: login_success, login_failed_due_to_lockout, logout, create/update/archive/reactivate employee, create/update/deactivate department, create/update location, change_geofence_radius, deactivate location, create/update/deactivate shift, assign_shift, assign_location, approve/reject/cancel leave, export_report, update_workspace_setting, update_role_permission, unauthorized_cross_workspace_access_attempt, and failed_permission_check_for_sensitive_action.
2. THE system SHALL store changes as JSON in `old_value`/`new_value`, including only the fields that changed.
3. THE system SHALL NOT record sensitive fields (password, token, session secret, credentials) in the audit log.
4. THE system SHALL treat audit logs as append-only AND SHALL NOT allow editing or deletion via the dashboard.
5. WHEN a user with `view_audit_logs` opens the audit log THEN the system SHALL display a list, simple filters (date, actor, action), and a detail view (read-only).
6. WHERE a user is a Support Admin THE system SHALL limit visible audit logs to their scope.
7. THE system SHALL include `workspace_id`, actor, action, entity reference, IP address, user agent, request_id, and timestamp in each entry.
8. THE system SHALL defer audit log export to v1.1.

---

### Requirement 15: Attendance Status Calculation (Backend)

**User Story:** As the system, I want attendance status to be computed authoritatively in the backend, so that the dashboard always shows consistent, tamper-resistant results.

#### Acceptance Criteria

1. THE backend SHALL be the source of truth for attendance status; the dashboard SHALL only read final status.
2. WHEN a valid check-in is recorded THEN the system SHALL compute Present (valid check-in, face passed, location valid for the work mode).
3. WHEN a check-in occurs after shift start + grace period THEN the system SHALL compute Late.
4. WHEN face verification fails, spoofing is detected, the location is outside geofence, or offline sync is suspicious THEN the system SHALL compute Invalid.
5. WHERE a valid check-in exists without a check-out THE system SHALL show Pending Checkout.
6. WHEN the attendance cut-off job runs (every 15 minutes) THEN the system SHALL compute Absent for active employees with no valid check-in past the absence cut-off and no approved leave.
7. WHEN the missing-checkout job runs (every 30 minutes) THEN the system SHALL compute Missing Checkout after shift end + checkout tolerance.
8. THE system SHALL run a daily summary job each night per the workspace timezone.
9. WHERE a shift crosses midnight THE system SHALL anchor late/absent calculation and attendance date to the shift start.
10. WHEN duplicate check-ins occur THEN the system SHALL use the first valid check-in and mark the rest as duplicate logs.
11. THE system SHALL apply the rules that were effective on the attendance date, so historical results remain stable when settings change.
12. THE dashboard MAY compute temporary display labels but SHALL NOT treat them as source of truth.

---

### Requirement 16: Non-Functional — Performance

**User Story:** As a user, I want the dashboard to be responsive, so that monitoring and reporting are efficient.

#### Acceptance Criteria

1. THE system SHALL load the initial dashboard in under 3 seconds under normal data volumes.
2. THE system SHALL apply attendance table filters in under 1.5 seconds under normal data volumes.
3. THE system SHALL complete a monthly export of up to 5,000 rows in under 10 seconds.
4. THE system SHALL reflect new attendance within at most 10 seconds (via 10-second polling).
5. THE system SHALL keep p95 response time under 500 ms for common read endpoints.
6. THE system SHALL achieve a Lighthouse performance score of at least 85 on the main dashboard.
7. THE system SHALL use server-side pagination (default 25; options 10/25/50/100) and server-side filtering/sorting for large datasets (employees, attendance, reports, audit log).

---

### Requirement 17: Non-Functional — Security & Reliability

**User Story:** As a platform operator, I want strong security and reliability safeguards, so that attendance data is protected and never lost.

#### Acceptance Criteria

1. THE system SHALL require a valid session/JWT for all API requests, verified at the backend.
2. THE middleware SHALL check authentication, workspace access, role permission, and department/location scope in sequence.
3. THE system SHALL apply rate limiting on sensitive endpoints (login, export, role management).
4. THE system SHALL NOT store user passwords in the application database (handled by better-auth).
5. THE system SHALL NOT display face data freely; only verification status SHALL be shown.
6. THE system SHALL store export files and leave attachments in private buckets accessible only via expiring signed URLs, restricted to the creator/authorized users.
7. THE system SHALL restrict uploads by file type and size (PDF/JPG/PNG, max 5 MB); virus scanning SHALL be deferred to v1.1.
8. THE system SHALL NOT permanently delete employees, shifts, locations, departments, or attendance; it SHALL use lifecycle statuses (Active, Inactive, Archived, Cancelled, Suspended).
9. THE system SHALL preserve original attendance timestamps including offline-synced original times.
10. IF an export fails THEN the system SHALL allow retrying it.
11. THE system SHALL recommend daily database backups for production (Supabase managed backups).

---

### Requirement 18: Non-Functional — API Contract & Observability

**User Story:** As a developer, I want consistent API responses and traceable requests, so that integration and debugging are reliable.

#### Acceptance Criteria

1. THE API SHALL be served under base path `/api/v1` from the Express backend.
2. THE API SHALL return success responses in the form `{ "success": true, "data": {}, "message": "OK" }`.
3. THE API SHALL return error responses in the form `{ "success": false, "error": { "code": "...", "message": "..." } }` with consistent error codes (e.g., `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`).
4. THE system SHALL assign a `request_id` to every API request and use it for debugging, audit logging, and unauthorized-access investigation.
5. THE system SHALL emit structured JSON server logs.
6. THE system SHALL provide a client-side error boundary in the dashboard.
7. THE web dashboard SHALL call the Express API through a Next.js BFF/proxy so that session/cookies are handled securely and backend internals are not exposed to the client.
8. THE system SHALL validate inputs using Zod at the backend (and reuse schemas on the frontend where feasible) with React Hook Form.
9. THE system SHALL provide a minimal CI pipeline (install, lint, type check, test, build) via GitHub Actions.
10. THE system SHALL provide automated tests using Vitest (unit/integration), Supertest (API), and Playwright (E2E), prioritizing auth guard, role permission, workspace isolation, attendance status calculation, leave approval permission, export permission, and forbidden cross-workspace access.

---

### Requirement 19: Non-Functional — UI/UX, Accessibility & Responsiveness

**User Story:** As a user, I want a clear, accessible, and responsive dashboard, so that I can work effectively across desktop, laptop, and tablet.

#### Acceptance Criteria

1. THE system SHALL optimize layouts for desktop (≥1280px) and laptop (≥1024px), remain usable on tablet (≥768px), and provide basic responsive layout on mobile.
2. THE system SHALL support modern browsers: Chrome, Edge, Firefox, and current Safari.
3. THE system SHALL default the UI language to Indonesian while keeping the structure ready for bilingual support in v1.1.
4. THE system SHALL provide clear labels on all important buttons.
5. THE system SHALL NOT use color as the only indicator of status (e.g., include text/icon).
6. THE system SHALL provide text for all form errors.
7. THE system SHALL present tables with a clear, readable structure.
8. THE system SHALL meet at least basic WCAG text-contrast guidelines.
9. WHERE data is empty THE system SHALL present an empty state rather than an error.


---

### Requirement 20: User Account & Profile

**User Story:** As a dashboard user, I want a basic account/profile page, so that I can view my profile, change my password, and see my active workspace.

#### Acceptance Criteria

1. WHEN a logged-in user opens their account page THEN the system SHALL display their profile and the active workspace.
2. THE system SHALL allow the user to change their own password via better-auth.
3. WHEN a user changes their password THEN the system SHALL invalidate other existing sessions of that user.
4. THE system SHALL provide a logout action.
5. THE system SHALL defer full profile editing to v1.1.

---

### Requirement 21: In-App Notifications

**User Story:** As an HR/Admin, I want simple in-app notifications, so that I am aware of new leave requests and completed export jobs.

#### Acceptance Criteria

1. THE system SHALL display a simple in-app badge/count for new leave requests within the user's scope.
2. WHEN an export job completes THEN the system SHALL surface an in-app indicator for the requesting user.
3. THE system SHALL scope notification counts to the user's Active Workspace and permission/scope.
4. THE system SHALL defer a complex notification system (email/push/notification center) to v1.1.
