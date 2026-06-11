# 08 — Platform-Admin Console: Real Backend Build

> Mengubah konsol `/admin/*` dari mock/local-state menjadi DB-backed nyata.
> Tanggal: 2026-06-11. Semua perubahan = edit file (belum di-build/migrate — perlu kamu jalankan).

## Yang dibangun

### 1. Schema (`Apps/backend/prisma/schema.prisma`)
- Model baru: `Invoice`, `SupportTicket`, `TicketMessage`.
- Enum baru: `InvoiceStatus`, `TicketStatus`, `TicketPriority`, `TicketCategory`, `TicketSender`.
- Relasi ditambah ke `Tenant` (`invoices`, `tickets`). `Tenant` & `GlobalRole` sudah ada sebelumnya.

### 2. Middleware (`src/middleware/requirePlatformAdmin.ts`)
- Gate berdasarkan `User.globalRole ∈ {super_admin, admin_platform}`. Fail-closed (403).
- Platform routes TIDAK scoped workspace (lintas tenant).

### 3. Modul backend (`src/modules/platform/`)
DB-backed penuh, prefix `/api/v1/platform/*`, di-mount di `index.ts`:
| Method | Endpoint | Aksi |
|---|---|---|
| GET | /platform/tenants | list (users count + MRR dihitung) |
| POST | /platform/tenants | create |
| PATCH | /platform/tenants/:id/status | Active/Suspended/Inactive |
| GET/POST | /platform/invoices | list / create |
| PATCH | /platform/invoices/:id/status | Paid/Pending/Overdue |
| GET | /platform/admin-users | list (globalRole != user) |
| POST | /platform/admin-users/invite | promote user existing by email |
| POST | /platform/admin-users/:id/deactivate | globalRole → user |
| GET | /platform/tickets | list + messages |
| POST | /platform/tickets/:id/reply | tambah pesan agent |
| PATCH | /platform/tickets/:id/status | Open/In Progress/Closed |

### 4. Seed (`src/prisma/seed.ts`)
- `stakeholder@attendx.dev` → `globalRole: super_admin` (bisa akses /admin).
- Tenant utama → plan Enterprise; +2 tenant demo (Globex/Pro, Stark/Basic-Suspended).
- 3 invoice (Paid/Pending/Overdue), 2 tiket (+pesan client awal).

### 5. Frontend disambungkan (`app/admin/*`)
Semua `useState(mock)` diganti `createClientApiClient` + fetch + refetch:
- **tenants/page.tsx** — list, add, suspend/delete (→Inactive, karena tenant tak hard-delete).
- **users/page.tsx** + types/modal/table — list, invite (by email), deactivate. Role union diubah → `Super Admin | Platform Admin`.
- **billing/page.tsx** — list, create (resolve nama tenant→id), update status. Stat MRR/ARR/outstanding **dihitung dari invoice nyata** (bukan hardcoded). Tombol "Export Report" no-op dihapus.
- **tickets/page.tsx** — list, reply, close/reopen via API. Avatar initials diturunkan dari nama.

## ⚠️ Belum diverifikasi (perlu dijalankan saat bangun)
```
cd Apps/backend && npm run build           # cek TS backend (modul platform + seed)
cd Apps/backend && npx prisma generate      # WAJIB: model baru (Invoice/Ticket) → Prisma Client
cd Apps/website && npx next build           # cek TS frontend admin
docker compose up --build                   # db push schema baru + seed + jalan
```
Login `/admin`: `stakeholder@attendx.dev` / `Attendx2024!` (kini super_admin).

## Risiko / catatan
- **Prisma Client belum di-generate** untuk model baru → backend `tsc` mungkin mengeluh `prisma.invoice`/`prisma.supportTicket` belum ada tipe sampai `prisma generate` dijalankan. Service pakai cast aman di beberapa titik tapi tidak semua — generate dulu sebelum menilai error.
- **Invite admin** hanya mempromosikan user yang SUDAH terdaftar (by email); tidak membuat user baru / kirim email. Field "name" di modal diabaikan backend. (Bisa ditingkatkan nanti.)
- **Yang masih mock/no-op di admin** (di luar 4 modul ini): `admin/platform` (KPI/chart statis), `admin/system-health` (latency Math.random), `RevenueChart` di billing (SVG statis), `InvoiceDrawer` "email invoice" alert, `UserTable` "Edit role/Reset password" alert. Semua P2.
- **Tenant "users" count** = jumlah employee semua workspace tenant (dihitung real).
