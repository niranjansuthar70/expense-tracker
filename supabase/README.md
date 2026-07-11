# Supabase Setup (Phase 1)

## 1. Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick org, name (e.g. `expense-tracker`), password, region
3. Wait for the project to finish provisioning

## 2. Disable public signups

1. **Authentication** → **Providers** → **Email**
2. Turn **off** “Enable sign ups” (confirm email can stay on or off for v1)
3. Save

## 3. Run migration

1. **SQL Editor** → **New query**
2. Paste contents of [`migrations/001_admin_users.sql`](./migrations/001_admin_users.sql)
3. **Run**

Verify:

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_users';
-- rowsecurity should be true
```

## 4. Create auth users (Dashboard)

**Authentication** → **Users** → **Add user** → **Create new user**

| User | Purpose |
|------|---------|
| Primary test user | Your real email + password — will be allowlisted |
| Optional second user | Auth only, **no** `admin_users` row — tests “Access denied” |

## 5. Seed allowlist rows

1. Edit [`seed.sql`](./seed.sql) — set email and name to match your primary test user
2. Run in **SQL Editor**

Verify:

```sql
SELECT * FROM admin_users;
```

## 6. Copy API credentials

**Project Settings** → **API**:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon `public` key |

Copy [`.env.example`](../.env.example) to `.env.local` at the repo root and paste values.

## Phase 1 checkpoint

- [ ] `admin_users` exists with RLS enabled
- [ ] Primary user in **Auth** and **`admin_users`** (same email)
- [ ] Optional: second auth user **without** allowlist row
- [ ] `.env.local` has URL + anon key

Next: **Phase 2** — Next.js scaffold + Supabase clients.
