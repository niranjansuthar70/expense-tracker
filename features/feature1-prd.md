# PRD: Feature 1 — Login & Welcome Gate

**Status:** Ready for implementation  
**Source:** [feature1.txt](./feature1.txt)  
**Last updated:** 2026-07-11

---

## 1. Overview

Build a minimal UI shell for the expense tracker: a login-only entry point backed by Supabase Auth and an email allowlist. After successful authentication, users land on a protected welcome page with a personalized time-based greeting.

This feature establishes auth, routing, and Supabase integration. Expense-tracking functionality is explicitly out of scope.

---

## 2. Goals

- Provide a simple, polished login experience for pre-approved users only.
- Integrate Supabase Auth (email + password) with no public signup.
- Enforce access via an `admin_users` allowlist table.
- Deliver a protected welcome page that confirms successful login.
- Deploy to Vercel with a new dedicated Supabase project.

---

## 3. Non-Goals (v1)

- Expense tracking UI or data models
- Signup / registration flow
- Password reset UI
- OAuth (Google, GitHub, etc.)
- In-app admin UI for user management
- Email invitations or automated provisioning

---

## 4. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth & DB | Supabase (new project) |
| Hosting | Vercel |

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Store locally in `.env.local`. Mirror the same variables in the Vercel project settings.

---

## 5. Supabase Setup

### 5.1 Project configuration

1. Create a **new** Supabase project for the expense tracker.
2. Enable **Email** provider under Authentication.
3. **Disable public signups** so only manually created auth users can exist.
4. Copy project URL and anon key into env vars.

### 5.2 `admin_users` table

```sql
CREATE TABLE admin_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  name        text NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
```

| Column | Purpose |
|--------|---------|
| `email` | Must match the Supabase Auth user email |
| `name` | Display name for time-based greeting (e.g. `Niranjan`) |
| `is_active` | `false` blocks login without deleting the auth account |

### 5.3 Row Level Security (RLS)

- Enable RLS on `admin_users`.
- **SELECT policy:** authenticated users may read **only their own row**:

```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own admin row"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');
```

- No INSERT, UPDATE, or DELETE policies for client roles — user management is dashboard/SQL only.

### 5.4 User provisioning (manual, v1)

For each allowed user:

1. **Authentication → Users:** create user with email + password.
2. **Table Editor / SQL:** insert matching row in `admin_users` with same `email` and `name`.

To revoke access: set `is_active = false` on their `admin_users` row.

---

## 6. Authentication Flow

```
┌─────────────┐     credentials      ┌──────────────┐
│  /login     │ ──────────────────►  │ Supabase Auth│
│  (form)     │                      │ signIn       │
└─────────────┘                      └──────┬───────┘
                                            │ success
                                            ▼
                                   ┌──────────────────┐
                                   │ Query admin_users│
                                   │ (own row via RLS)│
                                   └────────┬─────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         ▼                  ▼                  ▼
                   row found +        row missing or      auth failure
                   is_active=true     is_active=false
                         │                  │                  │
                         ▼                  ▼                  ▼
                   redirect to        sign out +          show error
                   /welcome           access denied       invalid creds
```

### Login rules

- **Email + password only** — no signup button or link.
- Allowlist check runs **server-side** (Server Action or Route Handler) after Supabase Auth succeeds.
- If auth succeeds but allowlist fails: sign the user out immediately and show access-denied message.

### Error messages

| Situation | Message |
|-----------|---------|
| Wrong email or password | `Invalid email or password` |
| Valid auth, not in `admin_users` or `is_active = false` | `Access denied. Contact your administrator.` |
| Network / server error | `Something went wrong. Please try again.` |

Do not reveal whether an email exists in the system beyond the two primary cases above.

---

## 7. Routes & Navigation

| Route | Access | Behavior |
|-------|--------|----------|
| `/` | Public | Redirect to `/welcome` if authenticated + allowlisted; otherwise `/login` |
| `/login` | Public | Login form. Redirect to `/welcome` if already authenticated + allowlisted |
| `/welcome` | Protected | Requires valid session + active `admin_users` row; else redirect to `/login` |
| Unknown paths | — | Redirect to `/login` (v1) |

### Redirects

- **After login success** → `/welcome`
- **After logout** → `/login`

### Route protection

Use **Next.js middleware** to validate the Supabase session cookie. Combine with server-side allowlist verification before rendering `/welcome`.

---

## 8. UI Specification

### 8.1 Global styling

- Clean, minimal design using Tailwind defaults and system font stack.
- Full-viewport neutral background.
- Responsive: works on mobile and desktop.

### 8.2 Login page (`/login`)

- Centered card with subtle shadow and rounded corners.
- **App title:** `Your Personalize AI Expense Tracker`
- Form fields:
  - Email (text input)
  - Password (masked input)
- Primary **Login** button.
- **No** signup link or button.
- Inline error text below the form (red) when login fails.

### 8.3 Welcome page (`/welcome`)

**Top bar:**

- Left: time-based greeting — `{Greeting} {name}` (e.g. `Evening Niranjan`)
- Right: **Logout** button

**Greeting time buckets** (browser local time):

| Local time | Greeting |
|------------|----------|
| 05:00 – 11:59 | Morning |
| 12:00 – 16:59 | Afternoon |
| 17:00 – 21:59 | Evening |
| 22:00 – 04:59 | Night |

Greeting is computed client-side from `admin_users.name` and `Date` in the user's timezone.

**Main content (centered):**

- Heading: `Welcome`
- Subtext: `You're logged in. Expense tracker coming soon.`

---

## 9. Implementation Checklist

### Project scaffold

- [ ] Initialize Next.js (App Router) + TypeScript + Tailwind
- [ ] Add `@supabase/supabase-js` and `@supabase/ssr` (or equivalent SSR helpers)
- [ ] Configure Supabase client for browser, server, and middleware

### Supabase

- [ ] Create new Supabase project
- [ ] Disable public signups
- [ ] Create `admin_users` table
- [ ] Enable RLS and SELECT-own-row policy
- [ ] Provision at least one test user (auth + `admin_users` row)

### App routes

- [ ] `/login` — form + server-side login action
- [ ] `/welcome` — protected page with greeting + logout
- [ ] `/` — redirect logic
- [ ] Middleware for session checks

### Auth logic

- [ ] Login: Supabase `signInWithPassword` → allowlist check → redirect
- [ ] Logout: Supabase `signOut` → redirect to `/login`
- [ ] Allowlist failure: sign out + access-denied error

### UI

- [ ] Login card with app title and error states
- [ ] Welcome page with greeting component and logout
- [ ] Mobile-responsive layout

### Deployment

- [ ] Push to GitHub
- [ ] Import project in Vercel
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verify login flow on production URL

---

## 10. Acceptance Criteria

1. **Unauthenticated user** visiting `/welcome` is redirected to `/login`.
2. **Login page** shows email + password fields, Login button, and app title. No signup option.
3. **Invalid credentials** show `Invalid email or password`.
4. **Valid auth but not allowlisted** (or `is_active = false`) shows `Access denied. Contact your administrator.` and does not grant session access to `/welcome`.
5. **Allowlisted user** with correct credentials reaches `/welcome`.
6. **Welcome page** displays `{Greeting} {name}` using local time and the user's `name` from `admin_users`.
7. **Logout** returns user to `/login`; `/welcome` is no longer accessible without re-login.
8. **Authenticated allowlisted user** visiting `/login` is redirected to `/welcome`.
9. **`admin_users` RLS** prevents users from reading other users' rows.
10. **App deploys** to Vercel and auth works with production env vars.

---

## 11. Open Questions / Future Work

Deferred to later features:

- Password reset flow
- Admin UI for user management
- Expense tracker core functionality
- "Personalized AI" capabilities referenced in the app title

---

## 12. Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Next.js + TypeScript + Tailwind | SSR/middleware support, type safety, fast minimal UI |
| 2 | Email + password auth | Matches login form UX; no signup needed |
| 3 | `admin_users` allowlist table | Deactivate users without deleting auth accounts |
| 4 | Manual dashboard provisioning | Simplest path for v1 small user set |
| 5 | Four-bucket time greeting | Personal touch without complexity |
| 6 | Two error message types | Balance security and user clarity |
| 7 | New Supabase project | Isolation from other apps |
| 8 | RLS read-own-row | Prevents allowlist enumeration |
| 9 | Vercel deployment | Native Next.js hosting |
