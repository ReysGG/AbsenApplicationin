# Performance Notes — AttendX Web Dashboard

## Server-Side Pagination & Filtering

- All list endpoints use server-side pagination (`manualPagination: true` in TanStack Table).
  This means the browser never downloads the full dataset; Express/PostgreSQL handles
  `LIMIT`/`OFFSET` and applies all filter/sort clauses before returning data.
- Default page size: 25 rows (configurable via query param `page_size`).
- Sorting and filtering are passed as query params and executed server-side.

## React Component Patterns

- `app/workspace/layout.tsx` is a **React Server Component** — initial HTML is fully
  rendered on the server, eliminating client-side data waterfalls for layout.
- List pages (attendance, workforce, leave, reports, exports) fetch initial data in Server
  Components; subsequent filter/sort/page changes go through the BFF client-side.
- Client Components use `useCallback` / `useMemo` where expensive computations or stable
  callback references are required to avoid unnecessary re-renders in TanStack Table and
  Recharts.

## Polling Strategy

- **Live Attendance** polling interval: **10 seconds** with `clearInterval` cleanup on
  component unmount (avoids ghost intervals after navigation).
- **Export History** polls every **15 seconds**, but only when at least one job is in
  `Queued` or `Processing` state — no unnecessary network calls when all jobs are settled.
- **Dashboard summary** refreshes on initial load; optional manual refresh button.

## Large Exports

- Exports ≤ 5 000 rows are handled synchronously (inline response).
- Exports > 5 000 rows (up to 50 000) are processed **asynchronously** via `ExportJob`
  queue to avoid blocking the request thread or exhausting connection pool.
- Exports > 50 000 rows are rejected with a clear error message.

## Targets (Requirements 16.1–16.7)

| Metric | Target |
|---|---|
| Initial page load (dashboard) | < 3 s |
| Filter / search response | < 1.5 s |
| Export 5 000 rows | < 10 s |
| p95 read endpoint latency | < 500 ms |
| Lighthouse performance score | ≥ 85 |

> **Note:** Full Lighthouse and p95 latency measurements require a production-equivalent
> environment with a seeded database. The patterns above are designed to meet these targets
> under normal load conditions.
