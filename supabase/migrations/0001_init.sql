-- Ledger schema. Run once in the Supabase SQL editor (safe to re-run).
--
-- Every row belongs to one signed-in user. Row Level Security lets a user
-- read and write only their own rows; signed-out (anon) requests get nothing.
-- Money is numeric(12,2): exact cents, never floating point.
-- Each table keeps its core fields as typed columns; less-used optional
-- fields live in `data`.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Bank accounts, cash, retirement and debts. For debts, balance is the amount owed.
create table if not exists public.accounts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  name text not null,
  type text not null check (type in ('checking', 'cash', 'savings', 'retirement', 'debt')),
  balance numeric(12, 2) not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Spending categories with a monthly or yearly budget.
create table if not exists public.categories (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  name text not null,
  type text not null check (type in ('monthly', 'annual')),
  budget numeric(12, 2) not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Bills and automatic transfers: a fixed amount, or a percent of income.
create table if not exists public.fixed_costs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  name text not null,
  amount numeric(12, 2),
  pct numeric(6, 3),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Savings goals, in priority order. A sub-goal points at its parent.
create table if not exists public.goals (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  name text not null,
  target numeric(12, 2) not null default 0,
  saved numeric(12, 2) not null default 0,
  due_date date,
  done boolean not null default false,
  parent_id text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Every expense, paycheck, transfer, payment and adjustment.
create table if not exists public.entries (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  position integer not null default 0,
  kind text not null check (kind in ('expense', 'fixed', 'income', 'transfer', 'adjust', 'interest', 'goalbuy', 'assign', 'unassign', 'gmove')),
  date date not null,
  amount numeric(12, 2) not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists entries_user_date on public.entries (user_id, date);

-- Closed months: balances as they stood at month end. id is the month, e.g. 2026-09.
create table if not exists public.snapshots (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (id ~ '^\d{4}-\d{2}$'),
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Everything else: income plan, dashboard layout, notifications, budget moves.
-- rev changes on every save so other devices can tell something changed.
create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  rev text not null default '',
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'categories', 'fixed_costs', 'goals', 'entries', 'snapshots', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists "Own rows only" on public.%I', t);
    execute format(
      'create policy "Own rows only" on public.%I for all to authenticated '
      'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
