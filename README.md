# Expense Tracker — Feature 1

Login-only gate with Supabase Auth and an email allowlist. After login, users see a personalized welcome page.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

## Docs

- [PRD](features/feature1-prd.md)
- [Implementation plan](features/feature1-implementation-plan.md)
- [Deployment guide](DEPLOYMENT.md)
- [Supabase setup](supabase/README.md)

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (or anon) key |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server locally |
| `npm run lint` | ESLint |
