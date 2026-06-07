# AttendX Backend (Express.js) — Implementation Plan

> **For Hermes:** Gunakan skill `subagent-driven-development` untuk mengeksekusi plan ini task-by-task. Setiap task = 2–5 menit kerja fokus. Frequent commits. TDD untuk logic, integration test untuk endpoint.

**Goal:** Membangun REST API backend AttendX berbasis Express.js + TypeScript + Prisma + PostgreSQL yang memenuhi seluruh kontrak API di PRD section 5.3, mendukung multi-tenant (workspace) isolation, RBAC + scope-based permission, dan siap di konsumsi oleh Web Dashboard (Next.js) dan Mobile App (Flutter).

**Architecture:**
- Monorepo tetap, `Apps/backend/` adalah service Node.js terpisah.
- Layered architecture: `routes → controllers → services → repositories (Prisma)`.
- JWT-based auth (access token + refresh token), stateless API.
- Semua query wajib filter `workspace_id` lewat middleware/service guard.
- Audit log ditulis via middleware untuk write actions.
- Validation via Zod schema di setiap endpoint.
- Error response mengikuti standard PRD section 5.3.

**Tech Stack:**
- Runtime: Node.js 20+ LTS, TypeScript 5
- Framework: Express 5 (sudah terinstall)
- Database: PostgreSQL 16 (lokal via Docker, atau Supabase) + Prisma 5 ORM
- Auth: `jsonwebtoken` + `bcrypt` (password admin/stakeholder); Firebase/Supabase Auth integration untuk end-user disediain adapter (v1.1)
- Validation: `zod`
- Logging: `pino` + `pino-http`
- Security: `helmet`, `cors`, `express-rate-limit`
- Testing: `vitest` + `supertest` + test DB terpisah
- Date: `date-fns` + `date-fns-tz`
- Excel/CSV export: `exceljs` (xlsx) + `papaparse` (csv)
- File upload (attachment cuti): `multer` + local storage (`uploads/`) untuk v1
- Process manager: `tsx` (dev), `node` (prod)

---

## Catatan Penting dari PRD

1. **Multi-tenant isolation:** semua tabel bisnis WAJIB punya `workspace_id`. Query WAJIB difilter. PRD section 7.3.
2. **RBAC + scope:** Stakeholder (workspace-wide), Support Admin (department/location scope), End User (self only).
3. **Data attendance tidak boleh dihapus.** Koreksi hanya via admin note + audit log (PRD 4.2 rule 8-9).
4. **Karyawan tidak dihapus permanen.** Status: Active / Inactive / Suspended / Archived (PRD 4.3 rule 4).
5. **Lokasi tidak boleh dihapus jika ada history.** Hanya deactivate (PRD 4.4 rule 6).
6. **Shift tidak boleh dihapus jika ada history.** Hanya inactive (PRD 4.5 edge case).
7. **Setting tidak mengubah history.** `effective_from` selalu dipakai (PRD 4.5, 4.8).
8. **Default grace period 10 menit, default WFO radius 100m, WFH 150m** (PRD 4.2).
9. **Export harus respect permission user** (PRD 4.7 rule 2).
10. **Face recognition & validasi attendance terjadi di mobile app** — backend terima data final saja (PRD 8.6).
11. **PDF export v1.1, fokus CSV + XLSX dulu** (PRD 4.7 rule 4).
12. **Real-time update: polling 10 detik cukup, websocket v1.1** (PRD open question 10).

---

## Struktur Target `Apps/backend/`

```
Apps/backend/
├── package.json
├── tsconfig.json
├── .env.example
├── .env                  (gitignored)
├── .gitignore
├── vitest.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/      (auto)
├── src/
│   ├── index.ts                 # entry: bootstrap server
│   ├── app.ts                   # express app factory (untuk test)
│   ├── server.ts                # listen()
│   ├── config/
│   │   ├── env.ts               # parse & validate env
│   │   ├── database.ts          # prisma client singleton
│   │   ├── logger.ts            # pino instance
│   │   └── cors.ts              # allowed origins
│   ├── lib/
│   │   ├── jwt.ts               # sign/verify access+refresh
│   │   ├── password.ts          # hash/compare
│   │   ├── errors.ts            # AppError, ValidationError, AuthError, NotFoundError, ForbiddenError, ConflictError
│   │   ├── response.ts          # success()/error() helpers + standard shape
│   │   ├── async-handler.ts     # wrap async controller
│   │   ├── request-id.ts        # generate request id
│   │   ├── date.ts              # timezone utils
│   │   ├── geo.ts               # haversine distance, in-radius check
│   │   └── pagination.ts        # parse page/limit, build meta
│   ├── middleware/
│   │   ├── request-id.ts
│   │   ├── request-logger.ts
│   │   ├── error-handler.ts     # central error → standard response
│   │   ├── not-found.ts
│   │   ├── auth.ts              # verify JWT, attach req.user
│   │   ├── workspace.ts         # resolve workspace by slug/id
│   │   ├── role.ts              # require role(s)
│   │   ├── scope.ts             # inject scope filter (department/location)
│   │   ├── validate.ts          # zod schema validator
│   │   ├── rate-limit.ts
│   │   └── audit.ts             # write audit log after mutation
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── me/
│   │   │   ├── me.routes.ts
│   │   │   ├── me.controller.ts
│   │   │   └── me.service.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── dashboard.service.ts
│   │   ├── attendance/
│   │   │   ├── attendance.routes.ts
│   │   │   ├── attendance.controller.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── attendance.repository.ts
│   │   │   ├── attendance.export.ts
│   │   │   └── attendance.schema.ts
│   │   ├── employees/
│   │   │   ├── employees.routes.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── employees.service.ts
│   │   │   └── employees.schema.ts
│   │   ├── departments/
│   │   │   ├── departments.routes.ts
│   │   │   ├── departments.controller.ts
│   │   │   ├── departments.service.ts
│   │   │   └── departments.schema.ts
│   │   ├── locations/
│   │   │   ├── locations.routes.ts
│   │   │   ├── locations.controller.ts
│   │   │   ├── locations.service.ts
│   │   │   └── locations.schema.ts
│   │   ├── shifts/
│   │   │   ├── shifts.routes.ts
│   │   │   ├── shifts.controller.ts
│   │   │   ├── shifts.service.ts
│   │   │   └── shifts.schema.ts
│   │   ├── leave-requests/
│   │   │   ├── leave-requests.routes.ts
│   │   │   ├── leave-requests.controller.ts
│   │   │   ├── leave-requests.service.ts
│   │   │   └── leave-requests.schema.ts
│   │   ├── reports/
│   │   │   ├── reports.routes.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   └── reports.export.ts
│   │   ├── settings/
│   │   │   ├── settings.routes.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   └── settings.schema.ts
│   │   └── audit/
│   │       ├── audit.routes.ts
│   │       ├── audit.controller.ts
│   │       └── audit.service.ts
│   ├── jobs/
│   │   ├── jobs.ts                # registry
│   │   ├── mark-absent.job.ts    # cron: hitung absent harian
│   │   └── mark-missing-checkout.job.ts
│   └── types/
│       ├── express.d.ts          # extend Request: user, workspace, scope
│       └── api.ts                # shared response types
├── tests/
│   ├── setup.ts
│   ├── helpers/
│   │   ├── factories.ts          # test data builders
│   │   ├── auth.ts               # generate test token
│   │   └── db.ts                 # truncate between tests
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── employees.test.ts
│   │   ├── attendance.test.ts
│   │   ├── reports.test.ts
│   │   └── multi-tenant.test.ts
│   └── unit/
│       ├── geo.test.ts
│       ├── jwt.test.ts
│       └── date.test.ts
├── uploads/                       (gitignored, attachment cuti)
└── README.md
```

---

# PHASE 0 — Project & Technical Setup

Target: repo siap, env validated, Prisma bisa connect, health check hidup, test infra jalan.

## Task 0.1 — Init TypeScript + dependencies

**Files:**
- Modify: `Apps/backend/package.json`
- Create: `Apps/backend/tsconfig.json`
- Create: `Apps/backend/.env.example`
- Create: `Apps/backend/.gitignore`

**Step 1: Install dependencies**

Run dari `Apps/backend/`:
```bash
pnpm add express@5 cors helmet pino pino-http pino-pretty \
  jsonwebtoken bcrypt zod dotenv express-rate-limit \
  prisma @prisma/client date-fns date-fns-tz \
  exceljs papaparse multer uuid cookie-parser compression

pnpm add -D typescript tsx @types/node @types/express @types/cors \
  @types/jsonwebtoken @types/bcrypt @types/papaparse @types/multer \
  @types/uuid @types/cookie-parser @types/compression \
  vitest supertest @types/supertest
```

**Step 2: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: `package.json` scripts**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "typecheck": "tsc --noEmit",
    "lint": "echo 'add eslint later'"
  }
}
```

**Step 4: `.env.example`**
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://attendx:attendx@localhost:5432/attendx
DATABASE_URL_TEST=postgresql://attendx:attendx@localhost:5432/attendx_test
JWT_ACCESS_SECRET=change-me-32-chars-minimum-secret
JWT_REFRESH_SECRET=change-me-different-32-chars-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

**Step 5: `.gitignore`**
```
node_modules
dist
.env
.env.local
uploads
*.log
coverage
.tsbuildinfo
```

**Step 6: Commit**
```bash
cd "Apps/backend" && git add . && git commit -m "chore(backend): init express+ts project skeleton"
```

## Task 0.2 — Start PostgreSQL via Docker

**Step 1:** Buat `docker-compose.yml` di root repo (skip jika sudah ada DB):
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: attendx-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: attendx
      POSTGRES_PASSWORD: attendx
      POSTGRES_DB: attendx
    ports:
      - "5432:5432"
    volumes:
      - attendx_pgdata:/var/lib/postgresql/data
volumes:
  attendx_pgdata:
```

**Step 2:** `cp .env.example .env` (Apps/backend/), edit DATABASE_URL kalau perlu.

**Step 3:** `docker compose up -d postgres`

**Step 4:** Verify: `docker compose ps` (postgres healthy).

## Task 0.3 — Config layer (env + logger + db)

**Files:**
- Create: `Apps/backend/src/config/env.ts`
- Create: `Apps/backend/src/config/logger.ts`
- Create: `Apps/backend/src/config/database.ts`
- Create: `Apps/backend/src/config/cors.ts`

**Step 1: Test dulu — `tests/unit/env.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadEnv } from '../../src/config/env';

describe('loadEnv', () => {
  beforeEach(() => { delete process.env.PORT; });

  it('throws when DATABASE_URL missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow(/DATABASE_URL/);
  });

  it('returns parsed config with defaults', () => {
    process.env.DATABASE_URL = 'postgresql://x@y/z';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
    const env = loadEnv();
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
  });
});
```

**Step 2: Run test — expect FAIL** (file belum ada).
```bash
cd Apps/backend && pnpm test
```

**Step 3: Implementasi `src/config/env.ts`**
```ts
import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  DATABASE_URL_TEST: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
  CORS_ORIGINS: z.string().default(''),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
});

export type Env = z.infer<typeof EnvSchema>;
let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
```

**Step 4: `src/config/logger.ts`**
```ts
import pino from 'pino';
import { loadEnv } from './env.js';
import 'dotenv/config';

const env = process.env.NODE_ENV ?? 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: env === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});

// Re-export type to satisfy callers that import before env fully loads
export type Logger = typeof logger;
```

**Step 5: `src/config/database.ts`**
```ts
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const isTest = process.env.NODE_ENV === 'test';
const url = isTest && process.env.DATABASE_URL_TEST
  ? process.env.DATABASE_URL_TEST
  : process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient({
  datasources: { db: { url } },
  log: isTest ? [] : [{ level: 'warn', emit: 'event' }, { level: 'error', emit: 'event' }],
});

if (!isTest) global.__prisma = prisma;

logger.info({ url: url?.replace(/:[^:@]+@/, ':***@') }, 'prisma client initialized');
```

**Step 6: `src/config/cors.ts`**
```ts
import cors from 'cors';
import { loadEnv } from './env.js';

export function buildCors() {
  const env = loadEnv();
  const origins = env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
      cb(new Error('CORS: origin not allowed'));
    },
    credentials: true,
  });
}
```

**Step 7: Run test — expect PASS.** `pnpm test`

**Step 8: Commit**
```bash
git add . && git commit -m "feat(backend): config layer (env, logger, db, cors)"
```

## Task 0.4 — Prisma schema (semua entity PRD section 5.2)

**Files:**
- Create: `Apps/backend/prisma/schema.prisma`

**Step 1: Schema**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Platform ---

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  status    String   @default("active")
  plan      String   @default("free")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  workspaces Workspace[]
}

model Workspace {
  id                    String   @id @default(cuid())
  tenantId              String
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Restrict)
  name                  String
  slug                  String
  timezone              String   @default("Asia/Jakarta")
  defaultGeofenceRadius Int      @default(100)
  defaultGracePeriod    Int      @default(10)
  wfhEnabled            Boolean  @default(true)
  hybridEnabled         Boolean  @default(true)
  status                String   @default("active")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  employees         Employee[]
  departments       Department[]
  locations         Location[]
  shifts            Shift[]
  attendanceLogs    AttendanceLog[]
  leaveRequests     LeaveRequest[]
  roleAssignments   RoleAssignment[]
  auditLogs         AuditLog[]

  @@unique([tenantId, slug])
  @@index([tenantId])
}

// --- Auth ---

enum GlobalRole {
  SUPER_ADMIN
  ADMIN_PLATFORM
  USER
}

model User {
  id            String     @id @default(cuid())
  firebaseUid   String?    @unique
  email         String     @unique
  phone         String?
  fullName      String
  passwordHash  String?
  globalRole    GlobalRole @default(USER)
  status        String     @default("active")
  lastLoginAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  employees        Employee[]
  roleAssignments  RoleAssignment[]
  approvedRequests LeaveRequest[] @relation("Approver")
  auditLogs        AuditLog[]

  @@index([email])
}

enum WorkspaceRole {
  STAKEHOLDER
  SUPPORT_ADMIN
  END_USER
}

enum ScopeType {
  WORKSPACE
  DEPARTMENT
  LOCATION
}

model RoleAssignment {
  id          String       @id @default(cuid())
  workspaceId String
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        WorkspaceRole
  scopeType   ScopeType    @default(WORKSPACE)
  scopeId     String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([workspaceId, userId, role, scopeType, scopeId])
  @@index([userId])
  @@index([workspaceId, role])
}

// --- Workforce ---

model Department {
  id               String   @id @default(cuid())
  workspaceId      String
  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name             String
  parentDepartmentId String?
  parent           Department? @relation("DeptTree", fields: [parentDepartmentId], references: [id], onDelete: SetNull)
  children         Department[] @relation("DeptTree")
  status           String   @default("active")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  employees        Employee[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

enum EmploymentStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ARCHIVED
}

enum WorkMode {
  WFO
  WFH
  HYBRID
}

enum FaceProfileStatus {
  NOT_REGISTERED
  REGISTERED
  NEED_REENROLLMENT
}

model Employee {
  id                  String   @id @default(cuid())
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  userId              String?  @unique
  user                User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  employeeCode        String
  fullName            String
  email               String
  phone               String?
  departmentId        String?
  department          Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  position            String?
  employmentStatus    EmploymentStatus @default(ACTIVE)
  assignedLocationId  String?
  assignedLocation    Location? @relation(fields: [assignedLocationId], references: [id], onDelete: SetNull)
  assignedShiftId     String?
  assignedShift       Shift? @relation(fields: [assignedShiftId], references: [id], onDelete: SetNull)
  workMode            WorkMode @default(WFO)
  faceProfileStatus   FaceProfileStatus @default(NOT_REGISTERED)
  joinedAt            DateTime @default(now())
  inactiveAt          DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  attendanceLogs AttendanceLog[]
  leaveRequests  LeaveRequest[]

  @@unique([workspaceId, employeeCode])
  @@unique([workspaceId, email])
  @@index([workspaceId, employmentStatus])
  @@index([workspaceId, departmentId])
}

// --- Locations ---

enum LocationType {
  OFFICE
  BRANCH
  WFH_APPROVED
}

model Location {
  id           String   @id @default(cuid())
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name         String
  type         LocationType
  address      String?
  latitude     Decimal  @db.Decimal(10, 7)
  longitude    Decimal  @db.Decimal(10, 7)
  radiusMeters Int      @default(100)
  status       String   @default("active")
  createdBy    String?
  updatedBy    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  employees     Employee[]
  attendanceLogs AttendanceLog[]

  @@index([workspaceId, status])
}

// --- Shifts ---

model Shift {
  id                       String   @id @default(cuid())
  workspaceId              String
  workspace                Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name                     String
  startTime                String   // "HH:mm" 24h
  endTime                  String
  gracePeriodMinutes       Int      @default(10)
  checkoutToleranceMinutes Int      @default(60)
  workDays                 Int[]    @default([1,2,3,4,5]) // 0=Sun, 6=Sat
  effectiveFrom            DateTime @default(now())
  status                   String   @default("active")
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  employees      Employee[]
  attendanceLogs AttendanceLog[]

  @@unique([workspaceId, name])
  @@index([workspaceId, status])
}

// --- Attendance ---

enum AttendanceStatus {
  PRESENT
  LATE
  ABSENT
  LEAVE
  PENDING_CHECKOUT
  MISSING_CHECKOUT
  INVALID
}

enum FaceCheckStatus {
  NOT_CHECKED
  PASSED
  FAILED
}

enum GeofenceStatus {
  NOT_CHECKED
  INSIDE
  OUTSIDE
}

enum SpoofingStatus {
  CLEAN
  SUSPECTED
  DETECTED
}

enum SyncStatus {
  LIVE
  SYNCED_LATE
  DUPLICATE
}

model AttendanceLog {
  id                  String   @id @default(cuid())
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Restrict)
  employeeId          String
  employee            Employee @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  attendanceDate      DateTime @db.Date
  shiftId             String?
  shift               Shift?   @relation(fields: [shiftId], references: [id], onDelete: SetNull)
  checkInAt           DateTime?
  checkOutAt          DateTime?
  checkInLatitude     Decimal? @db.Decimal(10, 7)
  checkInLongitude    Decimal? @db.Decimal(10, 7)
  checkOutLatitude    Decimal? @db.Decimal(10, 7)
  checkOutLongitude   Decimal? @db.Decimal(10, 7)
  locationId          String?
  location            Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
  workMode            WorkMode?
  faceCheckStatus     FaceCheckStatus @default(NOT_CHECKED)
  geofenceStatus      GeofenceStatus  @default(NOT_CHECKED)
  spoofingStatus      SpoofingStatus  @default(CLEAN)
  syncStatus          SyncStatus      @default(LIVE)
  syncedAt            DateTime?
  status              AttendanceStatus
  notes               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([workspaceId, attendanceDate])
  @@index([employeeId, attendanceDate])
  @@index([workspaceId, status, attendanceDate])
}

// --- Leave ---

enum LeaveType {
  ANNUAL
  SICK
  PERMIT
  UNPAID
  OTHER
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model LeaveRequest {
  id            String      @id @default(cuid())
  workspaceId   String
  workspace     Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  employeeId    String
  employee      Employee    @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  type          LeaveType
  startDate     DateTime    @db.Date
  endDate       DateTime    @db.Date
  reason        String
  attachmentUrl String?
  status        LeaveStatus @default(PENDING)
  approverId    String?
  approver      User?       @relation("Approver", fields: [approverId], references: [id], onDelete: SetNull)
  approvedAt    DateTime?
  rejectedAt    DateTime?
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([workspaceId, status])
  @@index([employeeId, startDate])
}

// --- Audit ---

model AuditLog {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  actorUserId   String?
  actor         User?    @relation(fields: [actorUserId], references: [id], onDelete: SetNull)
  action        String   // "create" | "update" | "delete" | "approve" | "reject" | "status_change" | ...
  entityType    String
  entityId      String
  oldValue      Json?
  newValue      Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  @@index([workspaceId, createdAt])
  @@index([entityType, entityId])
}
```

**Step 2: Generate + push**
```bash
cd Apps/backend
pnpm prisma generate
pnpm prisma db push
```

**Step 3: Commit**
```bash
git add . && git commit -m "feat(backend): prisma schema (all PRD entities)"
```

## Task 0.5 — Express bootstrap (app.ts + index.ts + health check)

**Files:**
- Create: `Apps/backend/src/app.ts`
- Create: `Apps/backend/src/index.ts`
- Create: `Apps/backend/src/lib/response.ts`
- Create: `Apps/backend/src/lib/errors.ts`
- Create: `Apps/backend/src/middleware/error-handler.ts`
- Create: `Apps/backend/src/middleware/not-found.ts`
- Create: `Apps/backend/tests/integration/health.test.ts`

**Step 1: Test dulu — `tests/integration/health.test.ts`**
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

let app: ReturnType<typeof createApp>;

beforeAll(() => { app = createApp(); });
afterAll(async () => { /* prisma.$disconnect() if needed */ });

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
  });

  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
```

**Step 2: Run — expect FAIL.** `pnpm test`

**Step 3: `src/lib/response.ts`**
```ts
import type { Response } from 'express';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(res: Response, data: T, message?: string, meta?: Record<string, unknown>) {
  const body: SuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.json(body);
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data } satisfies SuccessResponse<T>);
}

export function fail(res: Response, status: number, code: string, message: string, details?: unknown) {
  const body: ErrorResponse = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}
```

**Step 4: `src/lib/errors.ts`**
```ts
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export class ValidationError extends AppError { constructor(msg='Invalid input', details?: unknown) { super(400, 'VALIDATION_ERROR', msg, details); } }
export class UnauthorizedError extends AppError { constructor(msg='Unauthorized') { super(401, 'UNAUTHORIZED', msg); } }
export class ForbiddenError extends AppError { constructor(msg='Forbidden') { super(403, 'FORBIDDEN', msg); } }
export class NotFoundError extends AppError { constructor(msg='Resource not found') { super(404, 'NOT_FOUND', msg); } }
export class ConflictError extends AppError { constructor(msg='Conflict', details?: unknown) { super(409, 'CONFLICT', msg, details); } }
```

**Step 5: `src/middleware/error-handler.ts`**
```ts
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../lib/errors.js';
import { logger } from '../config/logger.js';
import { fail } from '../lib/response.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const e = new ValidationError('Invalid input', err.flatten());
    logger.warn({ err: e, path: req.path }, 'validation error');
    return fail(res, e.status, e.code, e.message, e.details);
  }
  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, path: req.path }, 'app error');
    return fail(res, err.status, err.code, err.message, err.details);
  }
  logger.error({ err, path: req.path }, 'unhandled error');
  return fail(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
```

**Step 6: `src/middleware/not-found.ts`**
```ts
import type { Request, Response } from 'express';
import { fail } from '../lib/response.js';
export function notFound(_req: Request, res: Response) {
  return fail(res, 404, 'NOT_FOUND', 'Route not found');
}
```

**Step 7: `src/app.ts`**
```ts
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { buildCors } from './config/cors.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { ok } from './lib/response.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(buildCors());
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => ok(res, { status: 'ok', uptime: process.uptime() }));

  // mount module routers here in later tasks

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
```

**Step 8: `src/index.ts`**
```ts
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';

async function main() {
  const env = loadEnv();
  const app = createApp();

  await prisma.$connect();
  logger.info('database connected');

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'attendx backend started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => logger.info('http server closed'));
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch(err => {
  logger.fatal({ err }, 'fatal bootstrap error');
  process.exit(1);
});
```

**Step 9: Run test — expect PASS.** `pnpm test`

**Step 10: Smoke test server**
```bash
cd Apps/backend && pnpm dev
# di terminal lain: curl http://localhost:4000/health
```
Expected: `{"success":true,"data":{"status":"ok","uptime":...}}`

**Step 11: Commit**
```bash
git add . && git commit -m "feat(backend): express bootstrap + health check + error handler"
```

## Task 0.6 — Seed data minimal (1 tenant, 1 workspace, 1 stakeholder)

**Files:**
- Create: `Apps/backend/prisma/seed.ts`

**Step 1: Script**
```ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-tenant' },
    update: {},
    create: { name: 'Demo Tenant', slug: 'demo-tenant' },
  });

  const ws = await prisma.workspace.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'demo' } },
    update: {},
    create: { name: 'Demo Workspace', slug: 'demo', tenantId: tenant.id, timezone: 'Asia/Jakarta' },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const stakeholder = await prisma.user.upsert({
    where: { email: 'stakeholder@demo.test' },
    update: {},
    create: {
      email: 'stakeholder@demo.test',
      fullName: 'Demo Stakeholder',
      passwordHash,
    },
  });

  await prisma.roleAssignment.upsert({
    where: { workspaceId_userId_role_scopeType_scopeId: {
      workspaceId: ws.id, userId: stakeholder.id, role: 'STAKEHOLDER', scopeType: 'WORKSPACE', scopeId: null,
    }},
    update: {},
    create: { workspaceId: ws.id, userId: stakeholder.id, role: 'STAKEHOLDER', scopeType: 'WORKSPACE' },
  });

  console.log('Seeded:', { tenant: tenant.slug, workspace: ws.slug, user: stakeholder.email });
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

**Step 2: Run + verify**
```bash
cd Apps/backend && pnpm db:seed
```
Expected: print seeded info.

**Step 3: Commit**
```bash
git add . && git commit -m "feat(backend): seed demo tenant+workspace+stakeholder"
```

---

# PHASE 1 — Auth + Workspace Foundation + Overview Dashboard

Target: HR bisa login, dapat JWT, hit endpoint `/me`, lihat workspace, dashboard summary.

## Task 1.1 — JWT lib

**Files:**
- Create: `Apps/backend/src/lib/jwt.ts`
- Create: `Apps/backend/tests/unit/jwt.test.ts`

**Step 1: Test**
```ts
import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/lib/jwt';

const ACCESS = 'a'.repeat(32);
const REFRESH = 'b'.repeat(32);

describe('jwt', () => {
  it('signs and verifies access token', () => {
    const token = signAccessToken({ sub: 'u1', email: 'a@b.c' }, ACCESS);
    const payload = verifyAccessToken(token, ACCESS);
    expect(payload.sub).toBe('u1');
    expect(payload.email).toBe('a@b.c');
  });

  it('throws on wrong secret', () => {
    const token = signAccessToken({ sub: 'u1', email: 'a@b.c' }, ACCESS);
    expect(() => verifyAccessToken(token, 'wrong'.repeat(8))).toThrow();
  });

  it('refresh token round-trip', () => {
    const t = signRefreshToken({ sub: 'u1' }, REFRESH);
    expect(verifyRefreshToken(t, REFRESH).sub).toBe('u1');
  });
});
```

**Step 2: Implementasi**
```ts
import jwt from 'jsonwebtoken';

export interface AccessPayload { sub: string; email: string; globalRole?: string; }
export interface RefreshPayload { sub: string; }

export function signAccessToken(p: AccessPayload, secret: string, ttl = '15m') {
  return jwt.sign(p, secret, { expiresIn: ttl });
}
export function verifyAccessToken(t: string, secret: string): AccessPayload & { iat: number; exp: number } {
  return jwt.verify(t, secret) as any;
}
export function signRefreshToken(p: RefreshPayload, secret: string, ttl = '7d') {
  return jwt.sign(p, secret, { expiresIn: ttl });
}
export function verifyRefreshToken(t: string, secret: string): RefreshPayload & { iat: number; exp: number } {
  return jwt.verify(t, secret) as any;
}
```

**Step 3: Run test, expect PASS.** `pnpm test`

**Step 4: Commit.**

## Task 1.2 — Password lib + login service

**Files:**
- Create: `Apps/backend/src/lib/password.ts`
- Create: `Apps/backend/src/modules/auth/auth.schema.ts`
- Create: `Apps/backend/src/modules/auth/auth.service.ts`
- Create: `Apps/backend/tests/integration/auth.test.ts`

**Step 1: Test login happy + wrong password**
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import bcrypt from 'bcrypt';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  app = createApp();
  // ensure seed user
  const ws = await prisma.workspace.findFirst();
  if (!ws) throw new Error('seed first');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  await prisma.user.upsert({
    where: { email: 'test-login@demo.test' },
    update: { passwordHash },
    create: { email: 'test-login@demo.test', fullName: 'Test Login', passwordHash },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'test-login@demo.test' } });
  await prisma.roleAssignment.upsert({
    where: { workspaceId_userId_role_scopeType_scopeId: {
      workspaceId: ws.id, userId: user.id, role: 'STAKEHOLDER', scopeType: 'WORKSPACE', scopeId: null,
    }},
    update: {},
    create: { workspaceId: ws.id, userId: user.id, role: 'STAKEHOLDER', scopeType: 'WORKSPACE' },
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns tokens on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-login@demo.test', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('test-login@demo.test');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test-login@demo.test', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

**Step 2: `src/lib/password.ts`**
```ts
import bcrypt from 'bcrypt';
export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
```

**Step 3: `src/modules/auth/auth.schema.ts`**
```ts
import { z } from 'zod';
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  workspaceSlug: z.string().optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({ refreshToken: z.string().min(10) });
```

**Step 4: `src/modules/auth/auth.service.ts`**
```ts
import { prisma } from '../../config/database.js';
import { verifyPassword } from '../../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { loadEnv } from '../../config/env.js';
import type { LoginInput } from './auth.schema.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; fullName: string; globalRole: string };
  workspace: { id: string; slug: string; name: string };
  roles: { role: string; scopeType: string; scopeId: string | null }[];
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const env = loadEnv();
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { roleAssignments: { include: { workspace: true } } },
  });
  if (!user || !user.passwordHash || user.status !== 'active') {
    throw new UnauthorizedError('Invalid email or password');
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Invalid email or password');

  let assignments = user.roleAssignments;
  if (input.workspaceSlug) {
    assignments = assignments.filter(a => a.workspace.slug === input.workspaceSlug);
  }
  if (assignments.length === 0) throw new UnauthorizedError('No workspace access');

  const ws = assignments[0]!.workspace;
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, globalRole: user.globalRole }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_TTL);
  const refreshToken = signRefreshToken({ sub: user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_TTL);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, fullName: user.fullName, globalRole: user.globalRole },
    workspace: { id: ws.id, slug: ws.slug, name: ws.name },
    roles: assignments.map(a => ({ role: a.role, scopeType: a.scopeType, scopeId: a.scopeId })),
  };
}

export async function refresh(refreshToken: string) {
  const env = loadEnv();
  const payload = verifyRefreshToken(refreshToken, env.JWT_REFRESH_SECRET);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'active') throw new UnauthorizedError('Invalid refresh token');
  const accessToken = signAccessToken({ sub: user.id, email: user.email, globalRole: user.globalRole }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_TTL);
  return { accessToken };
}
```

**Step 5: Controller + routes — `src/modules/auth/auth.controller.ts` + `auth.routes.ts`**
```ts
// controller
import type { Request, Response } from 'express';
import { LoginSchema, RefreshSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { ok, created } from '../../lib/response.js';
import { asyncHandler } from '../../lib/async-handler.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = LoginSchema.parse(req.body);
  const result = await authService.login(input);
  return ok(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = RefreshSchema.parse(req.body);
  const result = await authService.refresh(refreshToken);
  return ok(res, result, 'Token refreshed');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // stateless: client drops token. v1.1: token blacklist.
  return ok(res, { ok: true }, 'Logged out');
});
```
```ts
// routes
import { Router } from 'express';
import * as ctrl from './auth.controller.js';
const r = Router();
r.post('/login',  ctrl.login);
r.post('/refresh', ctrl.refresh);
r.post('/logout', ctrl.logout);
export default r;
```

**Step 6: `src/lib/async-handler.ts`**
```ts
import type { RequestHandler } from 'express';
type AsyncHandler = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => Promise<unknown>;
export const asyncHandler = (fn: AsyncHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Step 7: Mount router di `src/app.ts`** (tambah sebelum `notFound`):
```ts
import authRoutes from './modules/auth/auth.routes.js';
// ...
app.use('/api/v1/auth', authRoutes);
```

**Step 8: Run test, expect PASS.**

**Step 9: Commit.**
```bash
git add . && git commit -m "feat(backend): auth login + refresh + logout (jwt)"
```

## Task 1.3 — Auth middleware + express type augmentation

**Files:**
- Create: `Apps/backend/src/types/express.d.ts`
- Create: `Apps/backend/src/middleware/auth.ts`
- Create: `Apps/backend/src/middleware/workspace.ts`
- Create: `Apps/backend/src/middleware/role.ts`

**Step 1: `src/types/express.d.ts`**
```ts
import 'express';
declare global {
  namespace Express {
    interface UserPayload {
      id: string; email: string; globalRole: string;
    }
    interface Request {
      user?: UserPayload;
      workspace?: { id: string; slug: string; name: string; tenantId: string };
      workspaceRole?: 'STAKEHOLDER' | 'SUPPORT_ADMIN' | 'END_USER';
      scope?: { departmentIds: string[]; locationIds: string[]; isWorkspaceWide: boolean };
    }
  }
}
export {};
```

**Step 2: `src/middleware/auth.ts`**
```ts
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { loadEnv } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing token');
  const token = header.slice(7);
  try {
    const env = loadEnv();
    const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, email: payload.email, globalRole: payload.globalRole ?? 'USER' };
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

**Step 3: `src/middleware/workspace.ts`**
```ts
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';

export async function requireWorkspace(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new ForbiddenError('Not authenticated');
  const slug = (req.query.workspace ?? req.headers['x-workspace-slug']) as string | undefined;
  if (!slug) throw new NotFoundError('Workspace slug required');
  const ws = await prisma.workspace.findFirst({
    where: { slug, roleAssignments: { some: { userId: req.user.id } } },
    include: { roleAssignments: { where: { userId: req.user.id } } },
  });
  if (!ws) throw new ForbiddenError('No access to workspace');
  req.workspace = { id: ws.id, slug: ws.slug, name: ws.name, tenantId: ws.tenantId };
  const ra = ws.roleAssignments[0];
  req.workspaceRole = ra?.role;
  next();
}
```

**Step 4: `src/middleware/role.ts`**
```ts
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../lib/errors.js';

export function requireRole(...roles: Array<'STAKEHOLDER' | 'SUPPORT_ADMIN' | 'END_USER'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.workspaceRole || !roles.includes(req.workspaceRole)) {
      throw new ForbiddenError(`Requires role: ${roles.join(' or ')}`);
    }
    next();
  };
}
```

**Step 5: Commit.**

## Task 1.4 — `/me` + `/workspaces/current` endpoints

**Files:**
- Create: `Apps/backend/src/modules/me/me.service.ts`
- Create: `Apps/backend/src/modules/me/me.controller.ts`
- Create: `Apps/backend/src/modules/me/me.routes.ts`
- Update: `src/app.ts` (mount + 401 handler untuk missing token)

**Step 1: `me.service.ts`**
```ts
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../lib/errors.js';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, phone: true, globalRole: true, status: true, lastLoginAt: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function listMyWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { roleAssignments: { some: { userId } }, status: 'active' },
    select: { id: true, slug: true, name: true, timezone: true },
    orderBy: { name: 'asc' },
  });
}

export async function getCurrentWorkspace(userId: string, workspaceId: string) {
  const ws = await prisma.workspace.findFirst({
    where: { id: workspaceId, roleAssignments: { some: { userId } } },
    include: { roleAssignments: { where: { userId }, select: { role: true, scopeType: true, scopeId: true } } },
  });
  if (!ws) throw new NotFoundError('Workspace not found or no access');
  return {
    id: ws.id, slug: ws.slug, name: ws.name, timezone: ws.timezone,
    defaultGeofenceRadius: ws.defaultGeofenceRadius, defaultGracePeriod: ws.defaultGracePeriod,
    wfhEnabled: ws.wfhEnabled, hybridEnabled: ws.hybridEnabled,
    roles: ws.roleAssignments,
  };
}
```

**Step 2: `me.controller.ts`**
```ts
import type { Request, Response } from 'express';
import * as svc from './me.service.js';
import { ok } from '../../lib/response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { UnauthorizedError } from '../../lib/errors.js';

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return ok(res, await svc.getMe(req.user.id));
});

export const myWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  return ok(res, await svc.listMyWorkspaces(req.user.id));
});

export const currentWorkspace = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const id = (req.query.id ?? req.workspace?.id) as string;
  return ok(res, await svc.getCurrentWorkspace(req.user.id, id));
});
```

**Step 3: `me.routes.ts`**
```ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspace } from '../../middleware/workspace.js';
import * as ctrl from './me.controller.js';
const r = Router();
r.get('/me', requireAuth, ctrl.me);
r.get('/workspaces', requireAuth, ctrl.myWorkspaces);
r.get('/workspaces/current', requireAuth, requireWorkspace, ctrl.currentWorkspace);
export default r;
```

**Step 4: Mount di `app.ts`**
```ts
import meRoutes from './modules/me/me.routes.js';
app.use('/api/v1', meRoutes);
```

**Step 5: Test (extend `tests/integration/auth.test.ts` atau buat baru)**
Tambah test: login → pakai accessToken → GET /api/v1/me → 200; GET /api/v1/workspaces/current?workspace=demo → 200.

**Step 6: Commit.**

## Task 1.5 — Scope middleware (inject department/location filter)

**Files:**
- Create: `Apps/backend/src/middleware/scope.ts`

**Step 1:**
```ts
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { ForbiddenError } from '../lib/errors.js';

/**
 * Resolves the user's effective scope inside the current workspace.
 * - STAKEHOLDER → workspace-wide (no filter).
 * - SUPPORT_ADMIN → list of department/location ids dari RoleAssignment mereka.
 * - END_USER → self only (filter by employee.userId === req.user.id di service).
 */
export async function attachScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || !req.workspace) throw new ForbiddenError('Workspace required');

  const assignments = await prisma.roleAssignment.findMany({
    where: { workspaceId: req.workspace.id, userId: req.user.id },
  });

  if (assignments.some(a => a.role === 'STAKEHOLDER' && a.scopeType === 'WORKSPACE')) {
    req.scope = { departmentIds: [], locationIds: [], isWorkspaceWide: true };
    return next();
  }

  const departmentIds: string[] = [];
  const locationIds: string[] = [];
  for (const a of assignments) {
    if (a.scopeType === 'DEPARTMENT' && a.scopeId) departmentIds.push(a.scopeId);
    if (a.scopeType === 'LOCATION' && a.scopeId) locationIds.push(a.scopeId);
  }
  req.scope = { departmentIds, locationIds, isWorkspaceWide: false };
  next();
}

/**
 * Helper: build Prisma where fragment yang memfilter Employee by scope.
 */
export function scopeEmployeeFilter(scope: Express.Request['scope']) {
  if (!scope || scope.isWorkspaceWide) return {};
  const ors: any[] = [];
  if (scope.departmentIds.length) ors.push({ departmentId: { in: scope.departmentIds } });
  if (scope.locationIds.length) ors.push({ assignedLocationId: { in: scope.locationIds } });
  return ors.length ? { OR: ors } : { id: '__no_access__' }; // empty set
}
```

**Step 2: Commit.**

## Task 1.6 — Dashboard summary endpoint (PRD 4.1)

**Files:**
- Create: `Apps/backend/src/modules/dashboard/dashboard.service.ts`
- Create: `Apps/backend/src/modules/dashboard/dashboard.controller.ts`
- Create: `Apps/backend/src/modules/dashboard/dashboard.routes.ts`
- Create: `Apps/backend/src/lib/date.ts`
- Create: `Apps/backend/src/lib/geo.ts`
- Create: `Apps/backend/tests/integration/dashboard.test.ts`

**Step 1: `src/lib/date.ts`**
```ts
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, addMinutes, differenceInMinutes, startOfDay, isBefore, isAfter, parse, format } from 'date-fns';

export const DATE_FMT = 'yyyy-MM-dd';

export function todayInTz(tz: string): string {
  return formatInTimeZone(new Date(), tz, DATE_FMT);
}

export function startOfDayUtc(dateStr: string, tz: string): Date {
  // dateStr: 'yyyy-MM-dd' in given tz
  return fromZonedTime(`${dateStr}T00:00:00`, tz);
}

export function parseTimeOnDate(dateStr: string, timeStr: string, tz: string): Date {
  // timeStr: 'HH:mm'
  return fromZonedTime(`${dateStr}T${timeStr}:00`, tz);
}

export function diffMinutes(a: Date, b: Date): number {
  return differenceInMinutes(a, b);
}

export function addMinutesUtc(d: Date, m: number) { return addMinutes(d, m); }

export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = startOfDay(new Date(`${start}T00:00:00Z`));
  const last = startOfDay(new Date(`${end}T00:00:00Z`));
  while (cur <= last) { out.push(format(cur, DATE_FMT)); cur = addDays(cur, 1); }
  return out;
}
```

**Step 2: `src/lib/geo.ts`**
```ts
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function isInsideRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusMeters: number): boolean {
  return haversineMeters(lat1, lon1, lat2, lon2) <= radiusMeters;
}
```

**Step 3: Unit tests `tests/unit/geo.test.ts` + `tests/unit/date.test.ts`** (3-4 test each, TDD).

**Step 4: `dashboard.service.ts`**
```ts
import { prisma } from '../../config/database.js';
import { startOfDayUtc, parseTimeOnDate, diffMinutes, addMinutesUtc, dateRange } from '../../lib/date.js';
import { scopeEmployeeFilter } from '../../middleware/scope.js';
import { ForbiddenError } from '../../lib/errors.js';
import type { Request } from 'express';

export async function getSummary(req: Request, date: string) {
  if (!req.workspace) throw new ForbiddenError();
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { id: req.workspace.id } });
  const tz = ws.timezone;
  const dayStart = startOfDayUtc(date, tz);
  const dayEnd = addMinutesUtc(dayStart, 24 * 60);

  const empWhere: any = { workspaceId: ws.id, employmentStatus: 'ACTIVE', joinedAt: { lte: dayEnd }, ...scopeEmployeeFilter(req.scope) };
  const totalActive = await prisma.employee.count({ where: empWhere });

  const logs = await prisma.attendanceLog.findMany({
    where: { workspaceId: ws.id, attendanceDate: new Date(date), employee: empWhere },
    include: { employee: { include: { assignedShift: true } } },
  });

  let present = 0, late = 0, pendingCheckout = 0, missingCheckout = 0;
  for (const l of logs) {
    if (l.status === 'PRESENT') present++;
    else if (l.status === 'LATE') late++;
    else if (l.status === 'PENDING_CHECKOUT') pendingCheckout++;
    else if (l.status === 'MISSING_CHECKOUT') missingCheckout++;
  }

  const approvedLeave = await prisma.leaveRequest.count({
    where: { workspaceId: ws.id, status: 'APPROVED', startDate: { lte: new Date(date) }, endDate: { gte: new Date(date) }, employee: empWhere },
  });

  const invalid = logs.filter(l => l.status === 'INVALID').length;
  const absent = Math.max(0, totalActive - present - late - approvedLeave - invalid);

  return { date, totalEmployees: totalActive, present, late, onLeave: approvedLeave, absent, pendingCheckout, missingCheckout, invalid };
}

export async function getTrend(req: Request, startDate: string, endDate: string) {
  if (!req.workspace) throw new ForbiddenError();
  const days = dateRange(startDate, endDate);
  const out: { date: string; present: number; late: number; absent: number }[] = [];
  for (const d of days) {
    const s = await getSummary(req, d);
    out.push({ date: d, present: s.present, late: s.late, absent: s.absent });
  }
  return out;
}

export async function getDepartmentBreakdown(req: Request, date: string) {
  if (!req.workspace) throw new ForbiddenError();
  const empWhere: any = { workspaceId: req.workspace.id, employmentStatus: 'ACTIVE', ...scopeEmployeeFilter(req.scope) };
  const depts = await prisma.department.findMany({ where: { workspaceId: req.workspace.id, status: 'active' }, orderBy: { name: 'asc' } });
  const out: { departmentId: string | null; departmentName: string; total: number; present: number; late: number; absent: number }[] = [];
  for (const d of depts) {
    const total = await prisma.employee.count({ where: { ...empWhere, departmentId: d.id } });
    const logs = await prisma.attendanceLog.findMany({
      where: { workspaceId: req.workspace.id, attendanceDate: new Date(date), employee: { ...empWhere, departmentId: d.id } },
      select: { status: true },
    });
    const present = logs.filter(l => l.status === 'PRESENT').length;
    const late = logs.filter(l => l.status === 'LATE').length;
    const absent = Math.max(0, total - present - late);
    out.push({ departmentId: d.id, departmentName: d.name, total, present, late, absent });
  }
  // unassigned
  const unassignedTotal = await prisma.employee.count({ where: { ...empWhere, departmentId: null } });
  if (unassignedTotal > 0) {
    out.push({ departmentId: null, departmentName: 'Unassigned', total: unassignedTotal, present: 0, late: 0, absent: unassignedTotal });
  }
  return out;
}

export async function getLivePreview(req: Request, limit = 10) {
  if (!req.workspace) throw new ForbiddenError();
  return prisma.attendanceLog.findMany({
    where: { workspaceId: req.workspace.id, attendanceDate: { gte: new Date(Date.now() - 24*60*60*1000) }, employee: scopeEmployeeFilter(req.scope) ? { workspaceId: req.workspace.id, ...scopeEmployeeFilter(req.scope) } : { workspaceId: req.workspace.id } },
    orderBy: { checkInAt: 'desc' },
    take: limit,
    include: { employee: { select: { fullName: true, employeeCode: true, department: { select: { name: true } } } } },
  });
}
```

**Step 5: Controller + routes**
```ts
// controller
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './dashboard.service.js';
import { ok } from '../../lib/response.js';
import { asyncHandler } from '../../lib/async-handler.js';

const DateQuery = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });
const TrendQuery = z.object({ start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const q = DateQuery.parse(req.query);
  return ok(res, await svc.getSummary(req, q.date ?? new Date().toISOString().slice(0,10)));
});
export const trend = asyncHandler(async (req: Request, res: Response) => {
  const q = TrendQuery.parse(req.query);
  return ok(res, await svc.getTrend(req, q.start_date, q.end_date));
});
export const departmentBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const q = DateQuery.parse(req.query);
  return ok(res, await svc.getDepartmentBreakdown(req, q.date ?? new Date().toISOString().slice(0,10)));
});
export const livePreview = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 10) || 10, 50);
  return ok(res, await svc.getLivePreview(req, limit));
});
```
```ts
// routes
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspace } from '../../middleware/workspace.js';
import { attachScope } from '../../middleware/scope.js';
import * as ctrl from './dashboard.controller.js';
const r = Router();
r.use(requireAuth, requireWorkspace, attachScope);
r.get('/summary', ctrl.summary);
r.get('/attendance-trend', ctrl.trend);
r.get('/department-breakdown', ctrl.departmentBreakdown);
r.get('/live-preview', ctrl.livePreview);
export default r;
```

**Step 6: Mount di app.ts** `app.use('/api/v1/dashboard', dashboardRoutes)`.

**Step 7: Integration test** — seed lebih banyak data (employees, shifts, attendance logs) lalu hit summary, expect counts match. (Bisa skip detail, fokus shape.)

**Step 8: Commit.**

---

# PHASE 2 — Workforce + Departments + Locations + Shifts

## Task 2.1 — Departments CRUD (READ + LIST dulu, no full TDD cycle to keep moving)

**Files:**
- Create: `Apps/backend/src/modules/departments/*`

Schema, service, controller, routes, audit integration, tests minimal 1 happy + 1 conflict.

Routes: `GET /api/v1/departments`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`.

Pattern: lihat PRD 4.3 acceptance criteria + 5.3 endpoints + edge cases.

**Service skeleton (simplified):**
```ts
// departments.service.ts
import { prisma } from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import type { Request } from 'express';

export async function list(req: Request) {
  return prisma.department.findMany({
    where: { workspaceId: req.workspace!.id, status: { not: 'archived' } },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
}
export async function create(req: Request, input: { name: string; parentDepartmentId?: string }) {
  const exists = await prisma.department.findUnique({ where: { workspaceId_name: { workspaceId: req.workspace!.id, name: input.name } } });
  if (exists) throw new ConflictError('Department name already exists in this workspace');
  return prisma.department.create({ data: { ...input, workspaceId: req.workspace!.id } });
}
export async function update(req: Request, id: string, input: { name?: string; parentDepartmentId?: string | null }) { /* similar */ }
export async function setStatus(req: Request, id: string, status: 'active' | 'inactive') { /* ... */ }
```

**Commit:** `feat(backend): departments CRUD`.

## Task 2.2 — Locations CRUD (PRD 4.4)

Routes: `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`.

**Business rules di service:**
- Latitude: -90 to 90. Longitude: -180 to 180.
- Radius: min 50, max 500.
- WFO default 100, WFH_APPROVED default 150.
- Tidak bisa delete jika ada attendance history → return error 409 (kita expose hanya status endpoint).
- Hanya Stakeholder yang bisa create (cek `req.workspaceRole`).

Service:
```ts
// locations.service.ts
import { prisma } from '../../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors.js';
import type { Request } from 'express';

const RADIUS_MIN = 50, RADIUS_MAX = 500;

export async function list(req: Request) {
  return prisma.location.findMany({
    where: { workspaceId: req.workspace!.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, attendanceLogs: true } } },
  });
}

export async function create(req: Request, input: {
  name: string; type: 'OFFICE'|'BRANCH'|'WFH_APPROVED'; address?: string;
  latitude: number; longitude: number; radiusMeters?: number;
}) {
  if (req.workspaceRole !== 'STAKEHOLDER') throw new ForbiddenError('Only Stakeholder can manage locations');
  if (input.latitude < -90 || input.latitude > 90) throw new ValidationError('Invalid latitude');
  if (input.longitude < -180 || input.longitude > 180) throw new ValidationError('Invalid longitude');
  const radius = input.radiusMeters ?? (input.type === 'WFH_APPROVED' ? 150 : 100);
  if (radius < RADIUS_MIN || radius > RADIUS_MAX) throw new ValidationError(`Radius must be ${RADIUS_MIN}-${RADIUS_MAX} meters`);
  return prisma.location.create({
    data: { ...input, radiusMeters: radius, workspaceId: req.workspace!.id, createdBy: req.user!.id, updatedBy: req.user!.id },
  });
}

export async function update(req: Request, id: string, input: Partial<{ name: string; address: string; latitude: number; longitude: number; radiusMeters: number }>) {
  if (req.workspaceRole !== 'STAKEHOLDER') throw new ForbiddenError();
  const radius = input.radiusMeters;
  if (radius !== undefined && (radius < RADIUS_MIN || radius > RADIUS_MAX)) throw new ValidationError(`Radius must be ${RADIUS_MIN}-${RADIUS_MAX}`);
  return prisma.location.update({ where: { id }, data: { ...input, updatedBy: req.user!.id } });
}

export async function setStatus(req: Request, id: string, status: 'active' | 'inactive') {
  if (req.workspaceRole !== 'STAKEHOLDER') throw new ForbiddenError();
  // kalau mau deactivate, cek ada employee assigned
  if (status === 'inactive') {
    const count = await prisma.employee.count({ where: { assignedLocationId: id, employmentStatus: 'ACTIVE' } });
    if (count > 0) throw new ConflictError(`Cannot deactivate: ${count} active employees still assigned`);
  }
  return prisma.location.update({ where: { id }, data: { status, updatedBy: req.user!.id } });
}
```

Schema `locations.schema.ts`: zod schemas matching fields. Routes mounted under `/api/v1/locations`, middleware: `requireAuth, requireWorkspace, attachScope, requireRole('STAKEHOLDER','SUPPORT_ADMIN')`.

**Commit:** `feat(backend): locations CRUD with geofence validation`.

## Task 2.3 — Shifts CRUD + assign (PRD 4.5)

**Routes:** `GET`, `POST`, `GET /:id`, `PATCH /:id`, `POST /:id/assign`.

**Business rules:**
- `startTime` != `endTime` (kalau shift tidak lintas hari). Untuk shift malam, endTime < startTime diperbolehkan; dokumentasi: `effectiveFrom` adalah tanggal mulai attendance date ikut shift start.
- Grace period default 10.
- `workDays` array of 0-6.
- Assign: body `{ employeeIds: string[] }`. Update `Employee.assignedShiftId` di transaction.

Service:
```ts
// shifts.service.ts
export async function create(req: Request, input: {
  name: string; startTime: string; endTime: string;
  gracePeriodMinutes?: number; checkoutToleranceMinutes?: number; workDays: number[];
}) {
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) throw new ValidationError('Time must be HH:mm');
  if (input.startTime === input.endTime) throw new ValidationError('startTime and endTime cannot be the same');
  return prisma.shift.create({ data: { ...input, workspaceId: req.workspace!.id, effectiveFrom: new Date() } });
}

export async function assign(req: Request, shiftId: string, employeeIds: string[]) {
  if (req.workspaceRole === 'END_USER') throw new ForbiddenError();
  // verify all employees are in this workspace
  const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds }, workspaceId: req.workspace!.id }, select: { id: true } });
  if (employees.length !== employeeIds.length) throw new ValidationError('Some employees not in workspace');
  return prisma.$transaction(employeeIds.map(id => prisma.employee.update({ where: { id }, data: { assignedShiftId: shiftId } })));
}
```

**Commit:** `feat(backend): shifts CRUD + assignment`.

## Task 2.4 — Employees CRUD (PRD 4.3)

**Routes:** `GET /api/v1/employees`, `POST`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`.

**Business rules (wajib di service):**
1. `email` unique per workspace → 409 ConflictError.
2. `employeeCode` unique per workspace → 409.
3. Saat create, jika tidak ada `userId` dan `email` belum terdaftar di `User`, buat `User` baru + `RoleAssignment` END_USER (auto-link).
4. Status default ACTIVE. Set ke INACTIVE/ARCHIVED via status endpoint.
5. Support Admin hanya boleh akses employee sesuai scope (cek `req.scope` di WHERE clause).
6. Face profile default NOT_REGISTERED.

Service skeleton:
```ts
export async function list(req: Request, q: { departmentId?: string; locationId?: string; status?: EmploymentStatus; search?: string; page?: number; limit?: number }) {
  const page = q.page ?? 1, limit = Math.min(q.limit ?? 20, 100);
  const where: any = { workspaceId: req.workspace!.id, ...scopeEmployeeFilter(req.scope) };
  if (q.departmentId) where.departmentId = q.departmentId;
  if (q.locationId) where.assignedLocationId = q.locationId;
  if (q.status) where.employmentStatus = q.status;
  if (q.search) where.OR = [{ fullName: { contains: q.search, mode: 'insensitive' } }, { employeeCode: { contains: q.search, mode: 'insensitive' } }, { email: { contains: q.search, mode: 'insensitive' } }];
  const [rows, total] = await Promise.all([
    prisma.employee.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { fullName: 'asc' }, include: { department: true, assignedLocation: true, assignedShift: true } }),
    prisma.employee.count({ where }),
  ]);
  return { rows, meta: { page, limit, total } };
}

export async function create(req: Request, input: CreateEmployeeInput) {
  // uniqueness check
  const dupEmail = await prisma.employee.findUnique({ where: { workspaceId_email: { workspaceId: req.workspace!.id, email: input.email } } });
  if (dupEmail) throw new ConflictError('Email already exists in this workspace');
  const dupCode = await prisma.employee.findUnique({ where: { workspaceId_employeeCode: { workspaceId: req.workspace!.id, employeeCode: input.employeeCode } } });
  if (dupCode) throw new ConflictError('Employee code already exists in this workspace');

  return prisma.$transaction(async tx => {
    // ensure user
    let user = await tx.user.findUnique({ where: { email: input.email } });
    if (!user) {
      const passwordHash = await hashPassword(randomPassword(12));
      user = await tx.user.create({ data: { email: input.email, fullName: input.fullName, passwordHash } });
    }
    return tx.employee.create({
      data: {
        workspaceId: req.workspace!.id,
        userId: user.id,
        employeeCode: input.employeeCode,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        departmentId: input.departmentId,
        position: input.position,
        assignedLocationId: input.assignedLocationId,
        assignedShiftId: input.assignedShiftId,
        workMode: input.workMode ?? 'WFO',
        joinedAt: input.joinedAt ?? new Date(),
      },
    });
  });
}
```

**Tests minimum:** 1 test create happy, 1 test conflict email, 1 test list dengan scope.

**Commit:** `feat(backend): employees CRUD with workspace uniqueness`.

## Task 2.5 — Audit log middleware + helper

**Files:**
- Create: `Apps/backend/src/lib/audit.ts`
- Create: `Apps/backend/src/middleware/audit.ts` (optional, or panggil manual di service)

**Step 1: `lib/audit.ts`**
```ts
import { prisma } from '../config/database.js';
import type { Request } from 'express';

export interface AuditInput {
  action: 'create' | 'update' | 'delete' | 'status_change' | 'approve' | 'reject' | 'login' | 'logout' | 'assign';
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export async function writeAudit(req: Request, input: AuditInput) {
  if (!req.workspace || !req.user) return; // skip if no context
  return prisma.auditLog.create({
    data: {
      workspaceId: req.workspace.id,
      actorUserId: req.user.id,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: input.oldValue as any,
      newValue: input.newValue as any,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    },
  });
}
```

**Step 2: Panggil di service mutasi** (employees, locations, shifts, settings, leave-requests).

**Commit:** `feat(backend): audit log writer`.

---

# PHASE 3 — Live Attendance

## Task 3.1 — Attendance list endpoint (PRD 4.2 + 5.3)

**Files:**
- Create: `Apps/backend/src/modules/attendance/*`

**Service:**
```ts
// attendance.service.ts
export async function list(req: Request, q: AttendanceListQuery) {
  if (!req.workspace) throw new ForbiddenError();
  const where: any = { workspaceId: req.workspace.id };
  if (q.start_date || q.end_date) where.attendanceDate = { gte: q.start_date ? new Date(q.start_date) : undefined, lte: q.end_date ? new Date(q.end_date) : undefined };
  if (q.status) where.status = q.status;
  if (q.shiftId) where.shiftId = q.shiftId;
  if (q.departmentId) where.employee = { ...(where.employee ?? {}), departmentId: q.departmentId };
  if (q.locationId) where.locationId = q.locationId;
  if (q.employeeId) where.employeeId = q.employeeId;

  // gabung dengan scope filter
  const empFilter = scopeEmployeeFilter(req.scope);
  if (Object.keys(empFilter).length) {
    where.employee = { ...(where.employee ?? {}), ...empFilter };
  }

  const page = q.page ?? 1, limit = Math.min(q.limit ?? 25, 100);
  const [rows, total] = await Promise.all([
    prisma.attendanceLog.findMany({
      where, skip: (page-1)*limit, take: limit,
      orderBy: [{ attendanceDate: 'desc' }, { checkInAt: 'desc' }],
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true, department: { select: { name: true } } } },
        shift: { select: { name: true, startTime: true, endTime: true } },
        location: { select: { id: true, name: true } },
      },
    }),
    prisma.attendanceLog.count({ where }),
  ]);
  return { rows, meta: { page, limit, total } };
}

export async function getById(req: Request, id: string) {
  const row = await prisma.attendanceLog.findFirst({
    where: { id, workspaceId: req.workspace!.id, employee: scopeEmployeeFilter(req.scope) ? { workspaceId: req.workspace!.id, ...scopeEmployeeFilter(req.scope) } : { workspaceId: req.workspace!.id } },
    include: { employee: true, shift: true, location: true },
  });
  if (!row) throw new NotFoundError('Attendance log not found');
  return row;
}
```

**Routes:**
```ts
r.get('/', ctrl.list);
r.get('/:id', ctrl.getById);
r.post('/:id/adjustment-note', ctrl.addNote);
r.get('/export', ctrl.export);
```

**addNote:** body `{ notes: string }`. Tulis audit + update `AttendanceLog.notes` (tidak ubah data lain). PRD 4.2 rule 8-9.

**Commit:** `feat(backend): attendance list + detail + adjustment note`.

## Task 3.2 — Attendance export (CSV + XLSX, PRD 4.7)

**Files:**
- Create: `Apps/backend/src/modules/attendance/attendance.export.ts`

```ts
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import type { AttendanceLog } from '@prisma/client';

const COLUMNS = [
  { key: 'employeeCode', header: 'Employee ID' },
  { key: 'fullName', header: 'Employee Name' },
  { key: 'department', header: 'Department' },
  { key: 'attendanceDate', header: 'Date' },
  { key: 'shiftName', header: 'Shift' },
  { key: 'checkInAt', header: 'Check In' },
  { key: 'checkOutAt', header: 'Check Out' },
  { key: 'locationName', header: 'Location' },
  { key: 'workMode', header: 'Work Mode' },
  { key: 'status', header: 'Status' },
  { key: 'faceCheckStatus', header: 'Face' },
  { key: 'geofenceStatus', header: 'Geofence' },
  { key: 'syncStatus', header: 'Sync' },
  { key: 'notes', header: 'Notes' },
];

type Row = Record<string, any>;

export function toExportRows(logs: any[]): Row[] {
  return logs.map(l => ({
    employeeCode: l.employee.employeeCode,
    fullName: l.employee.fullName,
    department: l.employee.department?.name ?? '',
    attendanceDate: l.attendanceDate instanceof Date ? l.attendanceDate.toISOString().slice(0,10) : l.attendanceDate,
    shiftName: l.shift?.name ?? '',
    checkInAt: l.checkInAt?.toISOString() ?? '',
    checkOutAt: l.checkOutAt?.toISOString() ?? '',
    locationName: l.location?.name ?? '',
    workMode: l.workMode ?? '',
    status: l.status,
    faceCheckStatus: l.faceCheckStatus,
    geofenceStatus: l.geofenceStatus,
    syncStatus: l.syncStatus,
    notes: l.notes ?? '',
  }));
}

export function toCsv(rows: Row[]): Buffer {
  const csv = Papa.unparse({ fields: COLUMNS.map(c => c.header), data: rows.map(r => COLUMNS.map(c => r[c.key] ?? '')) });
  // prepend original headers → sudah benar
  return Buffer.from(csv, 'utf-8');
}

export async function toXlsx(rows: Row[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Attendance');
  ws.columns = COLUMNS.map(c => ({ header: c.header, key: c.key, width: 18 }));
  rows.forEach(r => ws.addRow(r));
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
```

Controller export:
```ts
export const export_ = asyncHandler(async (req, res) => {
  const q = ExportQuery.parse(req.query);
  const { rows } = await svc.listRaw(req, q); // list tanpa pagination, dengan limit 5000
  const data = toExportRows(rows);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  if (q.format === 'xlsx') {
    const buf = await toXlsx(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${ts}.xlsx"`);
    return res.send(buf);
  } else {
    const buf = toCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${ts}.csv"`);
    return res.send(buf);
  }
});
```

**Commit:** `feat(backend): attendance export CSV/XLSX`.

## Task 3.3 — Late / Absent / Missing-Checkout calculator service (dipakai dashboard + reports)

**Files:**
- Create: `Apps/backend/src/lib/attendance-calc.ts`

Fungsi:
- `calculateStatus({ checkInAt, checkOutAt, shift, gracePeriod, leaveApproved, workMode, geofenceStatus, faceCheckStatus }): AttendanceStatus`
- Rules: jika `faceCheckStatus === FAILED` atau `spoofingStatus === DETECTED` atau `geofenceStatus === OUTSIDE` → `INVALID`. Jika `leaveApproved` → `LEAVE`. Else jika tidak ada check-in → `ABSENT`. Else hitung `lateMinutes = (checkInAt - shift.startTime) / 60000`; jika > gracePeriod → `LATE` else `PRESENT`. Jika check-in ada tapi check-out null dan now > shift.endTime + checkoutTolerance → `MISSING_CHECKOUT`. Else `PENDING_CHECKOUT`.

Pakai di service saat read (computed) atau di write saat mobile sync (disimpan di DB). Untuk v1: simpan saat write.

**TDD:** Tulis test cases untuk tiap rule (10 case).

**Commit:** `feat(backend): attendance status calculator (pure function) + tests`.

## Task 3.4 — Mobile check-in/check-out ingestion endpoint (v1 mobile)

**Files:**
- Create: `Apps/backend/src/modules/attendance/attendance.ingest.ts`
- Mount route: `POST /api/v1/attendance/check-in`, `POST /api/v1/attendance/check-out`

Body:
```ts
const CheckInSchema = z.object({
  employeeId: z.string(),
  shiftId: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  workMode: z.enum(['WFO','WFH','HYBRID']),
  faceCheckStatus: z.enum(['PASSED','FAILED','NOT_CHECKED']).default('PASSED'),
  geofenceStatus: z.enum(['INSIDE','OUTSIDE','NOT_CHECKED']),
  spoofingStatus: z.enum(['CLEAN','SUSPECTED','DETECTED']).default('CLEAN'),
  clientTimestamp: z.string().datetime(), // waktu asli di device
  syncedAt: z.string().datetime().optional(),
});
```

Logic:
- Tentukan `attendanceDate` = tanggal `clientTimestamp` di timezone workspace (shift start date jika shift lintas hari).
- Cari `Location` assigned → hitung `inRadius`. Override `geofenceStatus` jika perlu.
- `syncStatus = LIVE` jika `syncedAt - clientTimestamp < 60s`, else `SYNCED_LATE`.
- Hitung status via `calculateStatus`.
- Cek duplikat: hanya 1 check-in valid per employee per attendanceDate (yang paling awal `clientTimestamp`); duplikat masuk `syncStatus=DUPLICATE` dan status=`PENDING_CHECKOUT`/INVALID (PRD edge case 4.2).

**Tests:** 6-8 test cases untuk late/present/absent/duplicate/missing-checkout.

**Commit:** `feat(backend): mobile check-in/check-out ingestion`.

---

# PHASE 4 — Leave & Permit + Reports + Export

## Task 4.1 — Leave requests endpoints (PRD 4.6)

**Routes:** `GET`, `GET /:id`, `PATCH /:id/approve`, `PATCH /:id/reject`. (Submit dari mobile app di PRD terpisah; untuk web dashboard, list + approval cukup.)

**Service:**
```ts
export async function list(req: Request, q: { status?: LeaveStatus; employeeId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
  const where: any = { workspaceId: req.workspace!.id };
  if (q.status) where.status = q.status;
  if (q.employeeId) where.employeeId = q.employeeId;
  if (q.startDate) where.OR = [{ startDate: { lte: new Date(q.startDate) }, endDate: { gte: new Date(q.startDate) } }];
  // ... dst
  const empFilter = scopeEmployeeFilter(req.scope);
  if (Object.keys(empFilter).length) where.employee = { ...(where.employee ?? {}), ...empFilter };
  return prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' }, include: { employee: { select: { fullName: true, employeeCode: true } }, approver: { select: { fullName: true } } } });
}

export async function approve(req: Request, id: string, notes?: string) {
  const lr = await prisma.leaveRequest.findFirst({ where: { id, workspaceId: req.workspace!.id } });
  if (!lr) throw new NotFoundError();
  if (lr.status !== 'PENDING') throw new ConflictError('Only pending requests can be approved');
  const updated = await prisma.leaveRequest.update({
    where: { id }, data: { status: 'APPROVED', approverId: req.user!.id, approvedAt: new Date(), notes },
  });
  await writeAudit(req, { action: 'approve', entityType: 'LeaveRequest', entityId: id, oldValue: { status: lr.status }, newValue: { status: 'APPROVED' } });
  return updated;
}

export async function reject(req: Request, id: string, notes: string) {
  // symmetric
}
```

**Commit:** `feat(backend): leave requests list + approve/reject + audit`.

## Task 4.2 — Reports endpoints (PRD 4.7)

**Routes:**
- `GET /api/v1/reports/attendance-summary?start_date&end_date&department_id&location_id&employee_id`
- `GET /api/v1/reports/daily-detail?...`
- `GET /api/v1/reports/late?...`
- `GET /api/v1/reports/missing-checkout?...`
- `GET /api/v1/reports/export?type=attendance-summary&format=csv|xlsx&...`

Service pakai query aggregation + reuse `scopeEmployeeFilter`.

**Export pattern sama dengan attendance export** (refactor ke `reports.export.ts`).

**Commit:** `feat(backend): reports aggregation + export`.

---

# PHASE 5 — Settings + Role Management + Audit + Hardening

## Task 5.1 — Workspace settings endpoints (PRD 4.8)

**Routes:** `GET /api/v1/settings/workspace`, `PATCH /api/v1/settings/workspace`.

**Rules:** hanya Stakeholder. Field bisa diubah: `name`, `timezone`, `defaultGeofenceRadius`, `defaultGracePeriod`, `wfhEnabled`, `hybridEnabled`, `lateCalculationPolicy`, `missingCheckoutPolicy`, `exportPermissions`. Audit log wajib.

## Task 5.2 — Role management endpoints

**Routes:** `GET /api/v1/settings/roles`, `POST /api/v1/settings/roles`, `DELETE /api/v1/settings/roles/:id`.

**Rules:** hanya Stakeholder. Tidak boleh hapus role Stakeholder terakhir di workspace (cek `count(role === STAKEHOLDER) > 1` sebelum delete).

## Task 5.3 — Audit log read endpoint

**Routes:** `GET /api/v1/audit-logs?entity_type=Employee&entity_id=&from=&to=&page=&limit=`.

**Service:** list dengan filter, paginated, hanya Stakeholder boleh akses.

## Task 5.4 — Rate limiting + security headers

- Terapkan `express-rate-limit` global (default dari env) + stricter untuk `/auth/login` (5 req / menit / IP).
- `helmet` sudah ada.
- CORS whitelist dari env.
- Request body size limit 2mb (sudah).

## Task 5.5 — Multi-tenant isolation test

**File:** `tests/integration/multi-tenant.test.ts`

Buat 2 workspace, 2 user, login sebagai user A, coba akses resource workspace B → expect 403/404. Tulis test untuk:
- GET `/employees` di workspace B dari user A → 0 row.
- GET `/attendance/:id` log workspace B dari user A → 404.
- POST `/settings/workspace` di workspace B dari user A → 403.

## Task 5.6 — Dockerfile + docker-compose integration

**Files:**
- Create: `Apps/backend/Dockerfile`
- Update: root `docker-compose.yml` tambah service `backend`.

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile || npm install
COPY . .
RUN pnpm prisma generate && pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

## Task 5.7 — OpenAPI / Postman collection

**Files:**
- Create: `docs/api/attendx-openapi.yaml` (OpenAPI 3.1 spec, generated manually atau via `zod-to-openapi`)

Export kontrak untuk frontend & mobile dev paralel.

## Task 5.8 — README + developer guide

**Files:**
- Create: `Apps/backend/README.md`

Sections: prerequisites, env setup, `pnpm dev`, testing, Docker, struktur folder, menambah module baru, deployment notes.

---

# TESTING STRATEGY

- **Unit:** `tests/unit/*.test.ts` — pure functions (geo, date, attendance-calc, jwt, password).
- **Integration:** `tests/integration/*.test.ts` — pakai supertest + test DB (truncate tables between describe blocks via helper `resetDb()`).
- **Coverage target:** 70%+ untuk service layer, 90%+ untuk pure functions.
- **Pre-commit:** `pnpm typecheck && pnpm test` (tambah husky + lint-staged jika perlu).

---

# DEFINITION OF DONE PER MODULE

1. Service + controller + routes lengkap sesuai PRD.
2. Zod schema valid untuk semua input.
3. Workspace isolation enforced (query selalu filter `workspaceId`).
4. RBAC: Support Admin hanya akses data sesuai scope (cek `req.scope`).
5. Audit log ditulis untuk semua mutasi (employees, locations, shifts, leave, settings).
6. Standard response shape `{ success, data, message? }` / `{ success:false, error:{code,message,details?} }`.
7. Minimal 1 integration test happy + 1 negative.
8. Tidak ada `console.log` (pakai logger).
9. Tidak ada `any` di service layer (boleh di boundary types seperti Prisma include).
10. Commit per task, conventional commits.

---

# DEPENDENCIES RINGKAS

Production:
```
express@5 cors helmet pino pino-http pino-pretty
jsonwebtoken bcrypt zod dotenv express-rate-limit
prisma @prisma/client date-fns date-fns-tz
exceljs papaparse multer uuid cookie-parser compression
```

Dev:
```
typescript tsx @types/node @types/express @types/cors
@types/jsonwebtoken @types/bcrypt @types/papaparse @types/multer
@types/uuid @types/cookie-parser @types/compression
vitest supertest @types/supertest
```

---

# CATATAN EKSEKUSI

1. **Jalankan plan ini dengan skill `subagent-driven-development`** — fresh subagent per task, two-stage review (spec compliance + code quality).
2. **Urutan eksekusi:** Phase 0 → Phase 1 → Phase 2 → ... → Phase 5. Task dalam satu phase boleh paralel jika tidak depend satu sama lain.
3. **Setiap commit = 1 task.** Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`).
4. **Setelah Phase 1 selesai**, frontend bisa mulai consume `/me` dan `/dashboard/*`.
5. **Setelah Phase 2 selesai**, frontend bisa mulai halaman Workforce, Locations, Shifts.
6. **Setelah Phase 3 selesai**, frontend Live Attendance + Reports.
7. **Jangan lupa update memory** jika ada keputusan arsitektur baru (mis. pakai zod untuk validation, pakai calculator service, dsb).
8. **Open questions PRD section 10**: Sebelum mulai implement, konfirmasi ke user:
   - Auth: Better Auth (yang dipakai website Next.js) atau JWT only?
   - Database: local Postgres Docker atau Supabase?
   - Face profile: ada backend integration dengan provider atau hanya simpan status?
   - Mobile check-in ingestion: ada di v1 backend ini atau PRD mobile terpisah?
   - Export size limit: 5.000 row synchronous atau queue (BullMQ)?

Jawaban 5 pertanyaan ini akan mempengaruhi task di Phase 1, 3, 4, dan 5.
