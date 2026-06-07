# Supabase RLS Policies for AttendX

> **Status:** Documentation only — RLS must be enabled before production deployment.
> The backend ALWAYS enforces workspace isolation and permission checks independently of RLS (defense in depth, R4.3–4.4).

---

## Why RLS?

Supabase exposes a direct PostgREST API. Without RLS, any client that obtains your `anon` key can query tables directly, bypassing the Express backend. Enabling RLS ensures that even direct Supabase queries are workspace-scoped.

The backend uses the **service role key** (bypasses RLS) for all server-side operations. The **anon key** is used only for client-side operations and must obey RLS.

---

## Tables Requiring RLS Before Production

### 1. `workspaces`

```sql
-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users can only read their own workspace
CREATE POLICY "workspace_select_own" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM role_assignments
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### 2. `employees`

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Filter by workspace membership
CREATE POLICY "employees_select_workspace" ON employees
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM role_assignments
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### 3. `attendance_logs`

```sql
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_logs_select_workspace" ON attendance_logs
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM role_assignments
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### 4. `leave_requests`

```sql
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_requests_select_workspace" ON leave_requests
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM role_assignments
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### 5. `locations`

```sql
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_select_workspace" ON locations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM role_assignments
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### 6. `shifts`

```sql
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_select_workspace" ON shifts
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM role_assignments
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### 7. `role_assignments`

```sql
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- Users can only see role assignments in their own workspace
CREATE POLICY "role_assignments_select_workspace" ON role_assignments
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM role_assignments ra2
      WHERE ra2.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );
```

---

## Storage Buckets — Private Access

Both export and leave-attachment buckets must be set to **private** (not public):

```sql
-- exports bucket: only the requester can read their own files via signed URLs
-- Bucket policy (set via Supabase dashboard or CLI):
--   Private bucket: yes
--   Allowed MIME types: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv
--   Max file size: 50 MB

-- leave-attachments bucket:
--   Private bucket: yes
--   Allowed MIME types: application/pdf, image/jpeg, image/png
--   Max file size: 5 MB
```

All file access is via **signed URLs** with expiry:
- Export files: 24-hour signed URL (R12.10)
- Leave attachments: generated on-demand per request

The backend (service role) generates signed URLs. The client never has direct bucket access.

---

## Implementation Notes

1. **Backend always filters by `workspace_id`** — this is the primary enforcement layer regardless of RLS state.
2. **RLS is a second layer** — protects against direct DB/PostgREST access that bypasses Express.
3. **Use service role key for backend** — server-side operations use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. Never expose this key to the client.
4. **Use anon key for client-side only** — if you ever use Supabase directly from the client (not recommended for this architecture), the anon key obeys RLS.
5. **Cross-workspace access** — any request attempting to read data from another workspace is blocked at the backend with `403 FORBIDDEN` and an audit log entry (`unauthorized_cross_workspace_access_attempt`).

---

## Checklist Before Production

- [ ] Enable RLS on all 7 tables listed above
- [ ] Apply SELECT policies for each table
- [ ] Set `exports` bucket to private
- [ ] Set `leave-attachments` bucket to private
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is in server environment only (not exposed to client)
- [ ] Verify `SUPABASE_URL` anon key is NOT used in backend operations
- [ ] Run integration tests against the RLS-enabled DB to confirm no regressions

---

## References

- Requirements: 4.3, 4.4, 4.5, 17.6
- Design: Security Design section, Storage & File Handling section
