# Implementation Plan: Feature 1 — Login & Welcome Gate

**PRD:** [feature1-prd.md](./feature1-prd.md)  
**Status:** Ready to execute  
**Estimated effort:** 1–2 days (solo developer)

---

## Summary

Build in **6 phases**, each ending in a verifiable checkpoint. Phases 1–2 can run in parallel if two people are available; otherwise do them sequentially (Supabase first, then scaffold).

```
Phase 1: Supabase backend
    ↓
Phase 2: Next.js scaffold + Supabase clients
    ↓
Phase 3: Auth core (login, allowlist, logout)
    ↓
Phase 4: Routes + middleware
    ↓
Phase 5: UI (login + welcome pages)
    ↓
Phase 6: Deploy to Vercel + smoke test
```

---

## Target File Structure

```
expense-tracker/
├── .env.local                          # gitignored — Supabase keys
├── .env.example                        # committed — key names only
├── middleware.ts                       # session + route guards
├── app/
│   ├── layout.tsx                      # root layout, global styles
│   ├── page.tsx                        # / → redirect
│   ├── login/
│   │   └── page.tsx                    # login form
│   ├── welcome/
│   │   └── page.tsx                    # protected welcome page
│   └── actions/
│       └── auth.ts                     # login + logout server actions
├── components/
│   ├── LoginForm.tsx
│   ├── WelcomeGreeting.tsx             # client component — time-based greeting
│   └── LogoutButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # browser client
│   │   ├── server.ts                   # server component / action client
│   │   └── middleware.ts               # middleware session refresh
│   ├── auth/
│   │   └── allowlist.ts                # check admin_users row
│   └── greeting.ts                     # pure fn — time bucket logic
└── supabase/
    └── migrations/
        └── 001_admin_users.sql         # table + RLS (optional, for version control)
```

---

## Phase 1: Supabase Backend

**Goal:** Database and auth ready before any app code depends on it.

### Tasks

| # | Task | Details |
|---|------|---------|
| 1.1 | Create Supabase project | [supabase.com/dashboard](https://supabase.com/dashboard) → New project |
| 1.2 | Disable public signups | Authentication → Providers → Email → disable "Enable sign ups" |
| 1.3 | Run migration SQL | Execute `001_admin_users.sql` (below) in SQL Editor |
| 1.4 | Create test auth user | Authentication → Users → Add user (email + password) |
| 1.5 | Insert allowlist row | SQL: `INSERT INTO admin_users (email, name) VALUES (...)` |
| 1.6 | Create negative test case | Optional: auth user *without* `admin_users` row for access-denied testing |
| 1.7 | Save credentials | Copy Project URL + anon key for `.env.local` |

### Migration: `supabase/migrations/001_admin_users.sql`

```sql
CREATE TABLE admin_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  name        text NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own admin row"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');
```

### Repo artifacts (done)

- [x] `supabase/migrations/001_admin_users.sql` — table, email normalization trigger, RLS
- [x] `supabase/seed.sql` — allowlist seed template
- [x] `supabase/README.md` — dashboard walkthrough
- [x] `.env.example` — env var template
- [x] `.gitignore` — excludes `.env.local`

### Checkpoint ✓ (complete in Supabase Dashboard)

- [ ] `admin_users` table exists with RLS enabled
- [ ] Test user exists in **both** Auth and `admin_users`
- [ ] In SQL Editor, `SELECT * FROM admin_users` returns the test row
- [ ] Project URL and anon key copied to `.env.local`

---

## Phase 2: Next.js Scaffold + Supabase Clients

**Goal:** Runnable Next.js app with Supabase wired for browser, server, and middleware.

### Tasks

| # | Task | Command / notes |
|---|------|-----------------|
| 2.1 | Scaffold project | `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"` |
| 2.2 | Install Supabase | `npm install @supabase/supabase-js @supabase/ssr` |
| 2.3 | Add `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 2.4 | Add `.env.example` | Same keys, placeholder values — safe to commit |
| 2.5 | Create `lib/supabase/client.ts` | Browser client via `createBrowserClient` |
| 2.6 | Create `lib/supabase/server.ts` | Server client via `createServerClient` + cookies |
| 2.7 | Create `lib/supabase/middleware.ts` | `updateSession` helper for middleware |
| 2.8 | Strip default Next.js boilerplate | Clean `app/page.tsx`, minimal `layout.tsx` |

### `lib/supabase/client.ts` (sketch)

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` (sketch)

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* getAll / setAll */ } }
  )
}
```

### Checkpoint ✓

- [x] `npm run dev` / `npm run build` starts without errors
- [x] Env vars load from `.env.local`
- [x] `.env.local` is in `.gitignore`
- [x] Supabase clients: `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- [x] Session refresh via root `middleware.ts`

---

## Phase 3: Auth Core

**Goal:** Login, allowlist verification, and logout work server-side before UI polish.

### Tasks

| # | Task | File |
|---|------|------|
| 3.1 | Allowlist helper | `lib/auth/allowlist.ts` |
| 3.2 | Login server action | `app/actions/auth.ts` → `login(email, password)` |
| 3.3 | Logout server action | `app/actions/auth.ts` → `logout()` |
| 3.4 | Greeting utility | `lib/greeting.ts` — pure function, unit-testable |

### `lib/auth/allowlist.ts` logic

```ts
// Returns { allowed: true, name } or { allowed: false }
// 1. Query admin_users for authenticated user's email (RLS scopes to own row)
// 2. allowed = row exists AND is_active === true
```

### `app/actions/auth.ts` — login flow

```
1. signInWithPassword(email, password)
   → fail: return { error: 'Invalid email or password' }

2. getUser() to confirm session

3. query admin_users (via allowlist helper)
   → not allowed: signOut() + return { error: 'Access denied. Contact your administrator.' }

4. redirect('/welcome')
```

### `app/actions/auth.ts` — logout flow

```
1. signOut()
2. redirect('/login')
```

### Error handling

| Case | Return value |
|------|--------------|
| Bad credentials | `{ error: 'Invalid email or password' }` |
| Not allowlisted / inactive | `{ error: 'Access denied. Contact your administrator.' }` |
| Unexpected failure | `{ error: 'Something went wrong. Please try again.' }` |

### Checkpoint ✓

- [x] `lib/auth/allowlist.ts` — allowlist check via RLS
- [x] `app/actions/auth.ts` — login + logout server actions
- [x] `lib/greeting.ts` — time-based greeting utility
- [x] Minimal `/login` and `/welcome` pages for manual testing
- [ ] Valid user → redirect to `/welcome` (test at `/login`)
- [ ] Wrong password → invalid credentials message
- [ ] Auth user without `admin_users` row → access denied + signed out
- [ ] Logout clears session

---

## Phase 4: Routes + Middleware

**Goal:** Correct redirects and protection on every route.

### Tasks

| # | Task | File |
|---|------|------|
| 4.1 | Middleware | `middleware.ts` — refresh session, guard `/welcome` |
| 4.2 | Root redirect | `app/page.tsx` — `/` → `/welcome` or `/login` |
| 4.3 | Login page shell | `app/login/page.tsx` — server check: redirect if already authed + allowed |
| 4.4 | Welcome page shell | `app/welcome/page.tsx` — server allowlist check, pass `name` to client |
| 4.5 | Catch-all redirect | Optional `app/[...slug]/page.tsx` → `/login` for unknown routes |

### Middleware matcher

```ts
export const config = {
  matcher: ['/welcome/:path*', '/login', '/'],
}
```

### Middleware logic (high level)

```
1. updateSession(request) — refresh Supabase cookies
2. If path is /welcome and no session → redirect /login
3. If path is /login and session exists → (defer full allowlist check to page server component, or check here)
4. Return response with updated cookies
```

> **Note:** Full allowlist check on `/welcome` should happen in the **server component** (can query DB with user session). Middleware only needs to verify session cookie exists for `/welcome`.

### Route behavior matrix

| Route | Logged out | Logged in + allowed | Logged in + not allowed |
|-------|------------|---------------------|-------------------------|
| `/` | → `/login` | → `/welcome` | → `/login` (after sign-out) |
| `/login` | show form | → `/welcome` | show form + error on next login attempt |
| `/welcome` | → `/login` | show page | → `/login` |

### Checkpoint ✓

- [x] Middleware guards `/welcome` — no session → `/login`
- [x] `/` redirects to `/welcome` (allowed) or `/login`
- [x] `/login` redirects to `/welcome` when already allowlisted
- [x] `/welcome` allowlist check + sign-out on failure
- [x] Unknown routes → `/login` via catch-all
- [ ] Session persists on page refresh (manual test)

---

## Phase 5: UI

**Goal:** PRD-compliant login and welcome pages.

### Tasks

| # | Task | File |
|---|------|------|
| 5.1 | Login form component | `components/LoginForm.tsx` — client form calling `login` action |
| 5.2 | Login page layout | Centered card, app title, error display |
| 5.3 | Greeting component | `components/WelcomeGreeting.tsx` — client, uses `lib/greeting.ts` |
| 5.4 | Logout button | `components/LogoutButton.tsx` — calls `logout` action |
| 5.5 | Welcome page layout | Top bar (greeting + logout), centered welcome copy |
| 5.6 | Global styles | Neutral background, responsive card width, system font |

### `lib/greeting.ts`

```ts
export function getGreeting(date: Date): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 22) return 'Evening'
  return 'Night'
}

export function formatGreeting(name: string, date = new Date()): string {
  return `${getGreeting(date)} ${name}`
}
```

### UI copy (fixed)

| Element | Text |
|---------|------|
| App title | `Your Personalize AI Expense Tracker` |
| Login button | `Login` |
| Welcome heading | `Welcome` |
| Welcome subtext | `You're logged in. Expense tracker coming soon.` |
| Logout button | `Logout` |

### Styling guidelines

- Login card: `max-w-md`, centered, `shadow`, `rounded-lg`, `p-8`
- Page background: `bg-gray-50` (or dark equivalent)
- Error text: `text-red-600 text-sm mt-2`
- Welcome top bar: `flex justify-between items-center p-4`

### Checkpoint ✓

- [x] Login page matches PRD (title, fields, button, no signup)
- [x] Errors render inline on failed login
- [x] Welcome shows `{Greeting} {name}` with correct time bucket
- [x] Mobile-responsive layout (header stacks on small screens)
- [x] System font + neutral `bg-gray-50` global styling
- [ ] All 10 PRD acceptance criteria pass locally (manual test)

---

## Phase 6: Deploy to Vercel

**Goal:** Production deployment with working auth.

### Tasks

| # | Task | Details |
|---|------|---------|
| 6.1 | Init git repo | `git init`, `.gitignore` includes `.env.local` |
| 6.2 | Push to GitHub | Create remote repo, push `main` |
| 6.3 | Import in Vercel | vercel.com → Import Git repository |
| 6.4 | Set env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 6.5 | Deploy | Trigger first production deploy |
| 6.6 | Supabase auth config | Add Vercel production URL to Supabase → Authentication → URL Configuration (Site URL + Redirect URLs) |
| 6.7 | Smoke test production | Full login / logout / access-denied flow on live URL |

### Supabase URL configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://<your-app>.vercel.app` |
| Redirect URLs | `https://<your-app>.vercel.app/**` |

### Production smoke test script

1. Open production `/login` — form renders with correct title
2. Wrong password — `Invalid email or password`
3. Allowlisted user — reaches `/welcome`, greeting shows correct name
4. Refresh `/welcome` — still authenticated
5. Logout — lands on `/login`, `/welcome` redirects away
6. Direct `/welcome` while logged out — redirects to `/login`

### Checkpoint ✓

- [ ] Production deploy succeeds
- [ ] Auth flow works on production URL
- [ ] PRD acceptance criterion #10 satisfied

---

## Suggested Commit Sequence

Small, reviewable commits — one per completed sub-phase:

| Commit | Scope |
|--------|-------|
| 1 | `chore: scaffold Next.js with Tailwind and Supabase deps` |
| 2 | `feat: add Supabase client utilities for browser, server, middleware` |
| 3 | `feat: add admin_users migration and allowlist helper` |
| 4 | `feat: add login and logout server actions` |
| 5 | `feat: add middleware and route redirects` |
| 6 | `feat: add login page UI` |
| 7 | `feat: add welcome page with time-based greeting` |
| 8 | `chore: add .env.example and deployment docs` |

---

## Manual Test Matrix

Run after Phase 5 (local) and again after Phase 6 (production).

| # | Steps | Expected |
|---|-------|----------|
| T1 | Visit `/welcome` logged out | Redirect to `/login` |
| T2 | Submit wrong password | `Invalid email or password` |
| T3 | Submit valid creds, no `admin_users` row | `Access denied...`, not on `/welcome` |
| T4 | Submit valid creds, `is_active = false` | `Access denied...`, signed out |
| T5 | Submit valid allowlisted creds | `/welcome`, greeting with name |
| T6 | Check greeting at different hours | Correct Morning/Afternoon/Evening/Night bucket |
| T7 | Refresh `/welcome` | Stays logged in |
| T8 | Click Logout | `/login`, `/welcome` blocked |
| T9 | Visit `/login` while logged in | Redirect to `/welcome` |
| T10 | Visit `/` logged out / logged in | `/login` / `/welcome` respectively |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Supabase session not persisting in middleware | Follow `@supabase/ssr` cookie `getAll`/`setAll` pattern exactly; test refresh early in Phase 4 |
| Allowlist check race after login | Run allowlist check in same server action before `redirect()`; sign out immediately on failure |
| RLS blocks allowlist query | Ensure query runs as `authenticated` role after `signInWithPassword` succeeds |
| Vercel env vars missing | Add `.env.example`; verify in Vercel dashboard before smoke test |
| Email case mismatch (`User@X.com` vs `user@x.com`) | Normalize email to lowercase on insert and at login |

---

## Out of Scope Reminder

Do **not** implement in this plan:

- Expense CRUD or dashboards
- Signup or password reset pages
- Admin user management UI
- OAuth providers
- Automated tests CI (optional nice-to-have, not required for v1)

---

## Next Step

Start **Phase 1** (Supabase) and **Phase 2** (scaffold) — Supabase first if working solo. Say when you want to begin implementation and which phase to start with.
