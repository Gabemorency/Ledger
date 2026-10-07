# Ledger

My personal financial tracker: accounts, a spending plan, fixed costs, goals and trends.
Built with Next.js, deployed on Vercel, with data in Supabase.

## Status

1. **Port:** done. The original prototype runs inside Next.js; data stays in
   the browser's localStorage for now.
2. **Model + tests (current):** the money math lives in typed modules under
   `src/lib/model` with unit tests. The original screens (`src/legacy`) call
   into it, so there is one copy of every calculation.
3. **Vercel:** connected. `main` deploys to production; branches get previews.
4. **Supabase:** sign-in plus a database, with a one-time import of existing
   browser data, a backup file, or the original spreadsheet.

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/model` | Balances, budgets, fixed-cost schedules, goals, plan check, debt payoff. Pure functions, no UI. |
| `src/legacy` | The original screens, being replaced by React components. |
| `e2e/` | Screen regression check: renders every screen at a fixed date and compares with `baseline.json`. |

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
