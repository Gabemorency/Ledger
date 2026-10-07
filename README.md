# Ledger

My personal financial tracker: accounts, a spending plan, fixed costs, goals and trends.
Built with Next.js, deployed on Vercel, with data in Supabase.

## Status

1. **Port:** done.
2. **Model + tests:** done. The money math lives in `src/lib/model`.
3. **Vercel:** connected. `main` deploys to production; branches get previews.
4. **Supabase (current):** email sign-in and cloud storage with row-level
   security. Without Supabase settings (local dev, CI) the app runs as an
   on-device demo.

## How data is stored

- Tables (`supabase/migrations/0001_init.sql`): `accounts`, `categories`,
  `fixed_costs`, `goals`, `entries`, `snapshots`, plus one `settings` row per
  user. Money is `numeric(12,2)`.
- Row Level Security on every table: a signed-in user can only read and write
  their own rows; signed-out requests are refused.
- The app is local-first (`src/lib/sync`): each change is kept on the device
  immediately, then only the changed rows are uploaded. Offline changes upload
  when the connection returns. When another device has saved, the app reloads
  on return to pick it up.

## Supabase setup (once)

1. **Create the tables:** Supabase dashboard → SQL Editor → paste
   `supabase/migrations/0001_init.sql` → Run. Safe to run again.
2. **Sign-in links:** Authentication → URL Configuration → set Site URL to the
   production address and add your previews under Redirect URLs as
   `https://ledger-*-<team>.vercel.app/**` (your Vercel team's suffix). Avoid
   `https://*.vercel.app/**`: it would accept anyone's vercel.app site.
3. **Sign-in code:** Authentication → Emails → in both the Confirm signup and
   Magic Link templates, add the code so it can be typed into the app:
   `<p>Your Ledger code: <strong>{{ .Token }}</strong></p>`
4. **After creating your own account:** Authentication → Sign In / Providers →
   Email → turn off "Allow new users to sign up".

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/model` | Balances, budgets, fixed-cost schedules, goals, plan check, debt payoff. Pure functions, no UI. |
| `src/lib/sync` | Maps app state to database rows, uploads changes, loads from the cloud. |
| `src/lib/supabase`, `src/proxy.ts`, `src/app/login`, `src/app/auth` | Sign-in and session handling. |
| `supabase/migrations` | Database schema and access rules. |
| `src/legacy` | The original screens, being replaced by React components. |
| `e2e/` | Screen regression check: renders every screen at a fixed date and compares with `baseline.json`. |
| `e2e/cloud` | Cloud-mode test against real Postgres + PostgREST: sign-in, sync, isolation, offline, sign-out. |

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # model unit tests
npm run typecheck
npm run lint
```

Screen check (needs a running build):

```bash
npm run build && npx next start -p 3000 &
npm run e2e -- http://localhost:3000            # compare
npm run e2e -- http://localhost:3000 --update   # accept intended changes
```
