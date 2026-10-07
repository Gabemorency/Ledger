# Ledger

My personal financial tracker: accounts, a spending plan, fixed costs, goals and trends.
Built with Next.js, deployed on Vercel, with data in Supabase.

## Status

1. **Port (current):** the original single-file prototype runs unchanged inside
   Next.js. Data stays in the browser's localStorage.
2. **Model + tests:** move the balance and budget math into typed modules under
   `src/lib` with unit tests.
3. **Vercel:** connect this repo so `main` deploys and branches get previews.
4. **Supabase:** sign-in plus a database, with a one-time import of existing
   browser data or a backup file.

## Develop

```bash
npm install
npm run dev   # http://localhost:3000
```
