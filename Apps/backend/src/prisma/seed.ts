/**
 * seed.ts — Bootstrap seed for AttendX Web Dashboard dev environment.
 *
 * Creates:
 *   - Tenant + Workspace (timezone Asia/Jakarta)
 *   - Stakeholder user + HR Admin user
 *   - RoleAssignments (stakeholder, support_admin)
 *   - Permission catalog (15 keys)
 *   - RoleAssignmentPermissions (HR Admin gets all 15)
 *   - 3 Departments, 2 Locations, 2 Shifts
 *   - 5 Employees (Engineering dept, Kantor Jakarta Pusat + Shift Pagi)
 *   - AttendanceLogs — last 7 weekdays for emp-001 and emp-002
 *
 * Idempotent: upsert for Tenant (slug) and User (email);
 *             deleteMany + createMany for relations without unique constraints.
 *
 * Requirements: 4.7
 *
 * Run via: npm run db:seed   (tsx src/prisma/seed.ts)
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { ALL_PERMISSIONS } from '../lib/permissions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the last N weekdays (Mon–Fri) relative to today, sorted ascending */
function lastNWeekdays(n: number): Date[] {
  const days: Date[] = []
  const cursor = new Date()
  // strip time component
  cursor.setHours(0, 0, 0, 0)
  while (days.length < n) {
    const day = cursor.getDay() // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) {
      days.unshift(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return days
}

/** Build a Date at a specific HH:MM on the given date */
function dateAtTime(base: Date, hh: number, mm: number): Date {
  const d = new Date(base)
  d.setHours(hh, mm, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main(): Promise<void> {
  console.log('🌱 Starting seed...')

  // ── 1. Tenant ──────────────────────────────────────────────────────────────
  const tenant = await (prisma as any).tenant.upsert({
    where: { slug: 'pt-inovasi-kerja-digital' },
    update: {},
    create: {
      name: 'PT Inovasi Kerja Digital',
      slug: 'pt-inovasi-kerja-digital',
      status: 'Active',
      plan: 'enterprise',
    },
  })
  console.log(`✅ Tenant: ${tenant.name}`)

  // ── 2. Workspace ───────────────────────────────────────────────────────────
  const existingWorkspace = await (prisma as any).workspace.findFirst({
    where: { tenantId: tenant.id, name: 'AttendX Demo Workspace' },
  })

  const workspace = existingWorkspace
    ? existingWorkspace
    : await (prisma as any).workspace.create({
        data: {
          tenantId: tenant.id,
          name: 'AttendX Demo Workspace',
          timezone: 'Asia/Jakarta',
          defaultGeofenceRadius: 100,
          defaultGracePeriod: 10,
          absenceCutoffMinutes: 120,
          wfhEnabled: true,
          hybridEnabled: true,
          status: 'Active',
        },
      })
  console.log(`✅ Workspace: ${workspace.name}`)

  // ── 3. Better-auth accounts + App Users ────────────────────────────────────
  // Insert better-auth user+account rows directly into the shared DB so the
  // seed doesn't depend on HTTP servers being up.
  //
  // Uses better-auth's own hashPassword() for full compatibility.
  // Credentials: password = "Attendx2024!" for all seed accounts.

  const { hashPassword: baHashPassword } = await import('better-auth/crypto')
  const { randomBytes } = await import('crypto')

  async function ensureBetterAuthUser(
    email: string,
    name: string,
    password: string,
  ): Promise<string> {
    // Check if user already exists in better-auth `user` table
    const existing = await (prisma as any).$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "user" WHERE email = ${email} LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`  ℹ️  Better-auth user already exists: ${email}`)
      return (existing[0] as { id: string }).id
    }

    // Create the better-auth user row (camelCase columns — better-auth convention)
    const userId = randomBytes(16).toString('hex')
    const now = new Date()
    await (prisma as any).$executeRaw`
      INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email}, true, ${now}, ${now})
    `

    // Create the email+password account row with better-auth-compatible hash
    const hashedPassword = await baHashPassword(password)
    const accountId = randomBytes(16).toString('hex')
    await (prisma as any).$executeRaw`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES (${accountId}, ${email}, 'credential', ${userId}, ${hashedPassword}, ${now}, ${now})
    `

    console.log(`  ✅ Better-auth account created: ${email}`)
    return userId
  }

  console.log('Creating better-auth accounts...')
  const stakeholderAuthId = await ensureBetterAuthUser(
    'stakeholder@attendx.dev',
    'Admin Stakeholder',
    'Attendx2024!',
  )
  const hrAdminAuthId = await ensureBetterAuthUser(
    'hradmin@attendx.dev',
    'HR Admin',
    'Attendx2024!',
  )

  // ── 3b. App Users ──────────────────────────────────────────────────────────
  const stakeholderUser = await (prisma as any).user.upsert({
    where: { email: 'stakeholder@attendx.dev' },
    update: { authUserId: stakeholderAuthId },
    create: {
      authUserId: stakeholderAuthId,
      email: 'stakeholder@attendx.dev',
      fullName: 'Admin Stakeholder',
      globalRole: 'user',
      status: 'Active',
    },
  })
  console.log(`✅ User: ${stakeholderUser.fullName} (authUserId: ${stakeholderAuthId.slice(0, 8)}...)`)

  const hrAdminUser = await (prisma as any).user.upsert({
    where: { email: 'hradmin@attendx.dev' },
    update: { authUserId: hrAdminAuthId },
    create: {
      authUserId: hrAdminAuthId,
      email: 'hradmin@attendx.dev',
      fullName: 'HR Admin',
      globalRole: 'user',
      status: 'Active',
    },
  })
  console.log(`✅ User: ${hrAdminUser.fullName} (authUserId: ${hrAdminAuthId.slice(0, 8)}...)`)

  // ── 4. Permissions catalog ─────────────────────────────────────────────────
  console.log('Seeding permissions...')
  const permissionDescriptions: Record<string, string> = {
    manage_employees: 'Create, update, archive employees',
    manage_locations: 'Create and manage office/WFH locations',
    manage_shifts: 'Create and assign work shifts',
    manage_geofence: 'Modify geofence radius for locations',
    manage_wfh_mode: 'Toggle WFH / hybrid mode for workspace',
    manage_grace_period: 'Change grace period and attendance policy settings',
    manage_attendance_policy: 'Manage global attendance policy settings',
    approve_leave: 'Approve or reject employee leave requests',
    export_reports: 'Export attendance and report data',
    manage_roles: 'Assign and manage roles (Stakeholder only)',
    view_dashboard: 'View overview dashboard',
    view_live_attendance: 'View live attendance table',
    view_reports: 'View and preview attendance reports',
    view_employees: 'View employee list and details',
    view_audit_logs: 'View audit log entries',
  }

  const permissionMap: Record<string, string> = {}
  for (const key of ALL_PERMISSIONS) {
    const perm = await (prisma as any).permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: permissionDescriptions[key] ?? key,
      },
    })
    permissionMap[key] = perm.id
  }
  console.log(`✅ Permissions seeded: ${Object.keys(permissionMap).length}`)

  // ── 5. RoleAssignments ─────────────────────────────────────────────────────
  // Stakeholder
  const stakeholderAssignment = await (prisma as any).roleAssignment.upsert({
    where: {
      workspaceId_userId_role_scopeType_scopeId: {
        workspaceId: workspace.id,
        userId: stakeholderUser.id,
        role: 'stakeholder',
        scopeType: 'workspace',
        scopeId: '',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: stakeholderUser.id,
      role: 'stakeholder',
      scopeType: 'workspace',
      scopeId: null,
    },
  })
  console.log(`✅ RoleAssignment: stakeholder → ${stakeholderUser.fullName}`)

  // HR Admin
  const hrAdminAssignment = await (prisma as any).roleAssignment.upsert({
    where: {
      workspaceId_userId_role_scopeType_scopeId: {
        workspaceId: workspace.id,
        userId: hrAdminUser.id,
        role: 'support_admin',
        scopeType: 'workspace',
        scopeId: '',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: hrAdminUser.id,
      role: 'support_admin',
      scopeType: 'workspace',
      scopeId: null,
    },
  })
  console.log(`✅ RoleAssignment: support_admin → ${hrAdminUser.fullName}`)

  // ── 6. RoleAssignmentPermissions for HR Admin ──────────────────────────────
  // Delete + recreate for idempotency (no unique-safe upsert path here)
  await (prisma as any).roleAssignmentPermission.deleteMany({
    where: { roleAssignmentId: hrAdminAssignment.id },
  })
  const rapData = Object.values(permissionMap).map((permissionId) => ({
    roleAssignmentId: hrAdminAssignment.id,
    permissionId,
  }))
  await (prisma as any).roleAssignmentPermission.createMany({ data: rapData })
  console.log(`✅ RoleAssignmentPermissions: HR Admin granted ${rapData.length} permissions`)

  // ── 7. Clean slate: wipe all workspace-scoped data in FK-safe order ──────────
  // Use raw DELETE in the correct dependency order so FK constraints are never violated.
  // Order: leaf tables first → parent tables last
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM attendance_raw_logs WHERE workspace_id = $1`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM attendance_logs WHERE workspace_id = $1`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM leave_requests WHERE workspace_id = $1`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM notifications WHERE workspace_id = $1`, workspace.id
  )
  // employee_wfh_locations has no workspace_id, delete via employee join
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM employee_wfh_locations WHERE employee_id IN (SELECT id FROM employees WHERE workspace_id = $1)`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM employees WHERE workspace_id = $1`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM departments WHERE workspace_id = $1`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM locations WHERE workspace_id = $1`, workspace.id
  )
  await (prisma as any).$executeRawUnsafe(
    `DELETE FROM shifts WHERE workspace_id = $1`, workspace.id
  )
  console.log(`✅ Workspace data cleared (FK-safe)`)
  const departmentNames = ['Engineering', 'Human Resources', 'Operations']
  const departments: Array<{ id: string; name: string }> = []
  for (const name of departmentNames) {
    const dept = await (prisma as any).department.create({
      data: { workspaceId: workspace.id, name, status: 'Active' },
    })
    departments.push(dept)
  }
  const engineeringDept = departments.find((d) => d.name === 'Engineering')!
  console.log(`✅ Departments: ${departments.map((d) => d.name).join(', ')}`)

  // ── 8. Locations ───────────────────────────────────────────────────────────
  const locationKantorJakarta = await (prisma as any).location.create({
    data: {
      workspaceId: workspace.id,
      name: 'Kantor Jakarta Pusat',
      type: 'Office',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
      latitude: -6.2088,
      longitude: 106.8456,
      radiusMeters: 100,
      status: 'Active',
    },
  })
  const locationRemoteWfh = await (prisma as any).location.create({
    data: {
      workspaceId: workspace.id,
      name: 'Remote WFH',
      type: 'WFHApproved',
      address: 'Jakarta',
      latitude: -6.2,
      longitude: 106.8167,
      radiusMeters: 150,
      status: 'Active',
    },
  })
  console.log(
    `✅ Locations: ${locationKantorJakarta.name}, ${locationRemoteWfh.name}`,
  )

  // ── 9. Shifts ──────────────────────────────────────────────────────────────
  const workDaysWeekday = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ]
  const shiftPagi = await (prisma as any).shift.create({
    data: {
      workspaceId: workspace.id,
      name: 'Shift Pagi',
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 60,
      gracePeriodMinutes: 10,
      checkoutToleranceMinutes: 60,
      absenceCutoffMinutes: 120,
      workDays: workDaysWeekday,
      effectiveFrom: new Date('2024-01-01'),
      status: 'Active',
    },
  })
  const shiftSiang = await (prisma as any).shift.create({
    data: {
      workspaceId: workspace.id,
      name: 'Shift Siang',
      startTime: '13:00',
      endTime: '22:00',
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      checkoutToleranceMinutes: 60,
      absenceCutoffMinutes: 120,
      workDays: workDaysWeekday,
      effectiveFrom: new Date('2024-01-01'),
      status: 'Active',
    },
  })
  console.log(`✅ Shifts: ${shiftPagi.name}, ${shiftSiang.name}`)


  type EmployeeInput = {
    code: string
    fullName: string
    email: string
    workMode: string
    employmentStatus: string
    accountStatus: string
  }

  const employeeSeedData: EmployeeInput[] = [
    {
      code: 'EMP-2024-0001',
      fullName: 'Budi Santoso',
      email: 'budi@attendx.dev',
      workMode: 'WFO',
      employmentStatus: 'Active',
      accountStatus: 'Active',
    },
    {
      code: 'EMP-2024-0002',
      fullName: 'Siti Rahayu',
      email: 'siti@attendx.dev',
      workMode: 'WFO',
      employmentStatus: 'Active',
      accountStatus: 'Active',
    },
    {
      code: 'EMP-2024-0003',
      fullName: 'Ahmad Fauzi',
      email: 'ahmad@attendx.dev',
      workMode: 'WFH',
      employmentStatus: 'Active',
      accountStatus: 'Active',
    },
    {
      code: 'EMP-2024-0004',
      fullName: 'Dewi Lestari',
      email: 'dewi@attendx.dev',
      workMode: 'Hybrid',
      employmentStatus: 'Active',
      accountStatus: 'Active',
    },
    {
      code: 'EMP-2024-0005',
      fullName: 'Rizki Pratama',
      email: 'rizki@attendx.dev',
      workMode: 'WFO',
      employmentStatus: 'Inactive',
      accountStatus: 'Disabled',
    },
  ]

  const createdEmployees: Array<{ id: string; fullName: string; email: string }> =
    []
  for (const emp of employeeSeedData) {
    const created = await (prisma as any).employee.create({
      data: {
        workspaceId: workspace.id,
        employeeCode: emp.code,
        fullName: emp.fullName,
        email: emp.email,
        departmentId: engineeringDept.id,
        workMode: emp.workMode,
        employmentStatus: emp.employmentStatus,
        accountStatus: emp.accountStatus,
        assignedLocationId: locationKantorJakarta.id,
        assignedShiftId: shiftPagi.id,
        joinedAt: new Date('2024-01-01'),
      },
    })
    createdEmployees.push(created)
  }
  console.log(
    `✅ Employees: ${createdEmployees.map((e) => e.fullName).join(', ')}`,
  )

  // ── 10b. Mobile demo employee (loginable end user) ─────────────────────────
  // Unlike the employees above, this one has a better-auth account + app User +
  // end_user role assignment, so it can sign in to the Flutter mobile app.
  const mobileAuthId = await ensureBetterAuthUser(
    'karyawan@attendx.dev',
    'David Boy',
    'Attendx2024!',
  )
  const mobileUser = await (prisma as any).user.upsert({
    where: { email: 'karyawan@attendx.dev' },
    update: { authUserId: mobileAuthId },
    create: {
      authUserId: mobileAuthId,
      email: 'karyawan@attendx.dev',
      fullName: 'David Boy',
      globalRole: 'user',
      status: 'Active',
    },
  })
  await (prisma as any).roleAssignment.upsert({
    where: {
      workspaceId_userId_role_scopeType_scopeId: {
        workspaceId: workspace.id,
        userId: mobileUser.id,
        role: 'end_user',
        scopeType: 'workspace',
        scopeId: '',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: mobileUser.id,
      role: 'end_user',
      scopeType: 'workspace',
      scopeId: null,
    },
  })
  const mobileEmployee = await (prisma as any).employee.create({
    data: {
      workspaceId: workspace.id,
      userId: mobileUser.id,
      employeeCode: 'EMP-2024-0010',
      fullName: 'David Boy',
      email: 'karyawan@attendx.dev',
      departmentId: engineeringDept.id,
      position: 'Software Engineer',
      workMode: 'WFO',
      employmentStatus: 'Active',
      accountStatus: 'Active',
      faceProfileStatus: 'Registered',
      assignedLocationId: locationKantorJakarta.id,
      assignedShiftId: shiftPagi.id,
      joinedAt: new Date('2024-01-01'),
    },
  })
  createdEmployees.push(mobileEmployee)
  console.log(`✅ Mobile demo employee: ${mobileEmployee.fullName} (karyawan@attendx.dev)`)

  // ── 11. AttendanceLogs — last 7 weekdays for emp-001 and emp-002 ───────────
  const emp001 = createdEmployees.find((e) => e.email === 'budi@attendx.dev')!
  const emp002 = createdEmployees.find((e) => e.email === 'siti@attendx.dev')!

  const weekdays = lastNWeekdays(7)
  const attendanceLogs: object[] = []

  weekdays.forEach((day, index) => {
    // emp-001: always Present, check-in 08:05, check-out 17:00
    attendanceLogs.push({
      workspaceId: workspace.id,
      employeeId: emp001.id,
      attendanceDate: day,
      shiftId: shiftPagi.id,
      checkInAt: dateAtTime(day, 8, 5),
      checkOutAt: dateAtTime(day, 17, 0),
      checkInLatitude: -6.2088,
      checkInLongitude: 106.8456,
      checkOutLatitude: -6.2088,
      checkOutLongitude: 106.8456,
      locationId: locationKantorJakarta.id,
      workMode: 'WFO',
      faceCheckStatus: 'Passed',
      geofenceStatus: 'Valid',
      syncStatus: 'Synced',
      originalCheckInAt: dateAtTime(day, 8, 5),
      syncedAt: dateAtTime(day, 8, 6),
      status: 'Present',
    })

    // emp-002: Late on index 0 (first/oldest day), Present on the rest
    const isLate = index === 0
    attendanceLogs.push({
      workspaceId: workspace.id,
      employeeId: emp002.id,
      attendanceDate: day,
      shiftId: shiftPagi.id,
      checkInAt: dateAtTime(day, isLate ? 8 : 8, isLate ? 35 : 5),
      checkOutAt: dateAtTime(day, 17, 0),
      checkInLatitude: -6.2088,
      checkInLongitude: 106.8456,
      checkOutLatitude: -6.2088,
      checkOutLongitude: 106.8456,
      locationId: locationKantorJakarta.id,
      workMode: 'WFO',
      faceCheckStatus: 'Passed',
      geofenceStatus: 'Valid',
      syncStatus: 'Synced',
      originalCheckInAt: dateAtTime(day, isLate ? 8 : 8, isLate ? 35 : 5),
      syncedAt: dateAtTime(day, isLate ? 8 : 8, isLate ? 36 : 6),
      status: isLate ? 'Late' : 'Present',
    })
  })

  await (prisma as any).attendanceLog.createMany({ data: attendanceLogs })
  console.log(
    `✅ AttendanceLogs: ${attendanceLogs.length} records for last 7 weekdays`,
  )

  // ── 11b. LeaveTypes — configurable leave types per workspace (R11.3) ────────
  // Idempotent via the @@unique([workspaceId, name]) constraint.
  const leaveTypeSeed = [
    { name: 'Sakit', requiresAttachment: true },
    { name: 'Cuti Tahunan', requiresAttachment: false },
    { name: 'Izin Pribadi', requiresAttachment: false },
    { name: 'Dinas Luar', requiresAttachment: false },
    { name: 'WFH Request', requiresAttachment: false },
    { name: 'Lainnya', requiresAttachment: false },
  ]
  await (prisma as any).leaveType.createMany({
    data: leaveTypeSeed.map((t) => ({
      workspaceId: workspace.id,
      name: t.name,
      requiresAttachment: t.requiresAttachment,
      status: 'Active',
    })),
    skipDuplicates: true,
  })
  console.log(`✅ LeaveTypes: ${leaveTypeSeed.length} types seeded`)

  // ── 12. Platform-admin seed (tenants, invoices, tickets) ───────────────────
  // Make the stakeholder a platform super_admin so /admin is reachable.
  await (prisma as any).user.update({
    where: { id: stakeholderUser.id },
    data: { globalRole: 'super_admin' },
  })
  // Give the primary tenant a plan.
  await (prisma as any).tenant.update({
    where: { id: tenant.id },
    data: { plan: 'Enterprise' },
  })

  // A couple of extra demo tenants (idempotent by slug).
  const demoTenants = [
    { name: 'Globex Inc.', slug: 'globex', plan: 'Pro', status: 'Active' },
    { name: 'Stark Industries', slug: 'stark', plan: 'Basic', status: 'Suspended' },
  ]
  const tenantIds: Record<string, string> = { [tenant.slug]: tenant.id }
  for (const t of demoTenants) {
    const row = await (prisma as any).tenant.upsert({
      where: { slug: t.slug },
      update: { plan: t.plan, status: t.status },
      create: { name: t.name, slug: t.slug, plan: t.plan, status: t.status },
    })
    tenantIds[t.slug] = row.id
  }

  // Invoices (reset + recreate for idempotency).
  await (prisma as any).invoice.deleteMany({})
  const now2 = new Date()
  const day = 86400000
  await (prisma as any).invoice.createMany({
    data: [
      { tenantId: tenant.id, plan: 'Enterprise', amountCents: 49900, status: 'Paid', issuedDate: new Date(now2.getTime() - 20 * day), dueDate: new Date(now2.getTime() - 6 * day) },
      { tenantId: tenantIds['globex'], plan: 'Pro', amountCents: 19900, status: 'Pending', issuedDate: new Date(now2.getTime() - 5 * day), dueDate: new Date(now2.getTime() + 9 * day) },
      { tenantId: tenantIds['stark'], plan: 'Basic', amountCents: 4900, status: 'Overdue', issuedDate: new Date(now2.getTime() - 40 * day), dueDate: new Date(now2.getTime() - 26 * day) },
    ],
  })

  // Support tickets + initial client message (reset for idempotency).
  await (prisma as any).ticketMessage.deleteMany({})
  await (prisma as any).supportTicket.deleteMany({})
  const ticket1 = await (prisma as any).supportTicket.create({
    data: {
      tenantId: tenant.id,
      title: 'Geofencing check-in issues on Android 14',
      description: 'Beberapa karyawan melaporkan koordinat GPS tidak terambil saat check-in di perangkat Android 14.',
      priority: 'High', status: 'Open', category: 'Technical',
    },
  })
  await (prisma as any).ticketMessage.create({
    data: { ticketId: ticket1.id, sender: 'Client', senderName: 'Admin Acme', body: 'Halo tim support, kami menemui masalah check-in di Android 14. Mohon dicek.' },
  })
  await (prisma as any).supportTicket.create({
    data: {
      tenantId: tenantIds['globex'],
      title: 'Export rekap bulanan timeout',
      description: 'Spinner berputar lama hingga timeout saat mengunduh rekap bulanan.',
      priority: 'Medium', status: 'InProgress', category: 'Billing',
    },
  })
  console.log('✅ Platform seed: stakeholder→super_admin, 3 tenants, 3 invoices, 2 tickets')

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completed successfully!')
  console.log(`   Tenant  : ${tenant.name}`)
  console.log(`   Workspace: ${workspace.name} (${workspace.timezone})`)
  console.log(
    `   Users   : stakeholder@attendx.dev, hradmin@attendx.dev`,
  )
  console.log(
    `   Employees: ${createdEmployees.length} (Engineering, Kantor Jakarta Pusat, Shift Pagi)`,
  )
  console.log(
    `   Attendance logs: ${attendanceLogs.length} records`,
  )
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
