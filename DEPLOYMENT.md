# Deployment — Vercel + Supabase

Deploy Feature 1 (login + welcome gate) to production.

## Prerequisites

- GitHub account
- [Vercel](https://vercel.com) account (sign in with GitHub)
- Supabase project already set up (Phase 1)
- Local app working (`npm run build` passes)

---

## Step 1: Push code to GitHub

From the project root:

```bash
git init
git add .
git commit -m "feat: login and welcome gate with Supabase auth"
```

Create a new repo on GitHub (e.g. `expense-tracker`), then:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```

---

## Step 2: Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your `expense-tracker` GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. **Do not** deploy yet — add env vars first

---

## Step 3: Set environment variables in Vercel

In **Project Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Production, Preview, Development |

Copy values from your local `.env.local` (same Supabase project).

> Use the **publishable** or **anon** key — never the `service_role` / secret key.

Click **Deploy**.

---

## Step 4: Configure Supabase Auth URLs

After the first deploy, copy your Vercel URL (e.g. `https://expense-tracker-abc123.vercel.app`).

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `https://your-app.vercel.app` |
| **Redirect URLs** | `https://your-app.vercel.app/**` |

Save changes.

---

## Step 5: Production smoke test

Replace `your-app.vercel.app` with your real domain:

| # | Test | Expected |
|---|------|----------|
| 1 | Open `/login` | Login form with app title |
| 2 | Wrong password | `Invalid email or password` |
| 3 | Valid allowlisted user | `/welcome` + time-based greeting |
| 4 | Refresh `/welcome` | Stays logged in |
| 5 | Logout | Lands on `/login` |
| 6 | Visit `/welcome` logged out | Redirects to `/login` |
| 7 | Visit `/` logged out / logged in | `/login` / `/welcome` |

---

## Optional: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel --prod
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Run `npm run build` locally; fix errors first |
| Login works locally, not in prod | Check Vercel env vars match `.env.local` |
| Redirect loop | Add Vercel URL to Supabase Redirect URLs |
| Access denied for valid user | Confirm `admin_users` row exists with matching email |
| Session not persisting | Verify Supabase Site URL matches Vercel domain |

---

## Phase 6 checkpoint

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Env vars set in Vercel
- [ ] Supabase Site URL + Redirect URLs updated
- [ ] Production smoke tests pass
