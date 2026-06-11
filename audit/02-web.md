# 02 — Web Dashboard Audit (`Apps/website`)

## A. Workspace pages (HR dashboard) — SEMUA REAL

13 halaman di `app/workspace/*` fetch data nyata via `createClientApiClient`/`createServerApiClient` ke Express, dengan state loading/error/empty dan form yang memanggil POST/PATCH nyata.

| Page | Data Source | Status | Evidence |
|---|---|---|---|
| overview | `/v1/dashboard/{summary,attendance-trend,department-breakdown,live-preview}` | Functional | overview/page.tsx:136-143 |
| attendance | `/v1/attendance` (polling + TanStack) | Functional | attendance/page.tsx:24-38 |
| workforce | `/v1/employees` + refdata | Functional | workforce/page.tsx:703,724-727 |
| departments | `/v1/departments` | Functional | departments/page.tsx:43 |
| locations | `/v1/locations` CRUD | Functional | locations/page.tsx:188,341-343 |
| shifts | `/v1/shifts` + `/assign` | Functional | shifts/page.tsx:231,352,396 |
| leave | `/v1/leave-requests` + approve/reject | Functional | leave/page.tsx:971,1007,1085 |
| reports | `/v1/reports/*`, `/v1/exports` | Functional | reports/page.tsx:11-25 |
| exports | `/v1/exports` + polling status | Functional | exports/page.tsx:42 |
| audit-log | `/v1/audit-logs` | Functional | audit-log/page.tsx:38 |
| settings | `/v1/me`, `/v1/settings/*` | Functional | settings/page.tsx:58 |
| account | better-auth `changePassword` | Functional | account/page.tsx:24 |
| my-workspace | `/v1/me`, dashboard summary | Functional | my-workspace/page.tsx:18 |

Sidebar (`components/dashboard/Sidebar.tsx:64-137`): semua nav link menuju halaman yang ada. **Tidak ada dead link.** Item tanpa permission di-*disable*, bukan disembunyikan. Sidebar workspace **tidak** menautkan ke `/admin/*`.

## B. Admin console (`app/admin/*`) — UI ONLY / EMPTY

BFF (`app/api/[[...path]]/route.ts`) meneruskan semua ke Express; **tidak ada route `/admin` di backend**. Halaman admin merender array hardcoded dan diberi banner "Demo Mode".

| Page | Status | Evidence |
|---|---|---|
| admin/users | UI Only | `const initialUsers` 5 user palsu (users/page.tsx:12-53); invite/deactivate hanya `useState` (62-87) |
| admin/tenants | UI Only | `const initialTenants` (tenants/page.tsx:11-62); add/delete/suspend local-only (86-118) |
| admin/billing | UI Only | `const initialInvoices` (billing/page.tsx:13-68); MRR/ARR hardcoded `"$124,500"` (144-173) |
| admin/platform | UI Only | KPI hardcoded `"1,248"`,`"45.2k"`,`"$84.5k"` (platform/page.tsx:13-62); chart SVG statis (GrowthChart.tsx:47-51) |
| admin/tickets | UI Only | `const initialTickets` + thread palsu (tickets/page.tsx:28-133); reply/close local-only |
| admin/system-health | Partial | audit feed real `/v1/audit` (system-health.tsx:84-95); sisanya fake + `Math.random()` latency (125-128) |
| admin (index) | **Functional** | `_components/DashboardPage.tsx:398-402` real `/v1/dashboard/*`. Caveat: quickActions `href="#"` (285-288) = dead link |

## C. No-op / Dead link
- `admin` DashboardPage quickActions: "Rekap Harian / Export Excel / Sync Data" → `href="#"` (DashboardPage.tsx:285-288). **No-op.**
- `system-health` latency chart `Math.random()` → fake real-time.

## D. Rekomendasi
- **P1**: Sembunyikan/disable seluruh route `/admin/*` di produksi sampai backend platform-admin ada, ATAU bangun backend-nya. Saat ini halaman terlihat "jadi" padahal kosong.
- **P2**: Ganti chart admin statis dengan data nyata bila modul admin dilanjutkan.
- **P2**: Hapus `href="#"` quickActions atau sambungkan ke route nyata.

## E. Catatan positif
Bagian workspace sudah memenuhi Definition of Done audit: validasi, API nyata, persistence, loading/error/empty, feedback, dan (sejak sesi ini) guard per-halaman server-side + backend `requirePermission`.
