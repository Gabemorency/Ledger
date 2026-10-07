# Security

Ledger holds personal financial data, so security issues are taken seriously.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through
[GitHub private vulnerability reporting](../../security/advisories/new)
on this repository. You should get a reply within a few days.

## Handling data

- Never commit real financial data (spreadsheets, exports, backups) or
  secrets. `.gitignore` blocks the common file types; keys belong in Vercel
  environment variables, not in the code.
- Supabase tables must have Row Level Security enabled so each user can
  only read and write their own rows.
- The service-role key is server-only and must never be exposed to the browser.
