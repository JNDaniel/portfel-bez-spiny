-- Monthly budget limits, one row per user and month.
-- effective_from is the day the limit starts to apply; the DB enforces the 1st day of a month.
-- currency is PLN-only for now (the domain cannot represent others); multi-currency needs a new migration.
-- Ownership is enforced by RLS on user_id. The unique (user_id, effective_from) index starts with
-- user_id, so it also serves the RLS predicate (no separate user_id index needed).
create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  effective_from date not null check (extract(day from effective_from) = 1),
  limit_minor integer not null check (limit_minor > 0),
  currency text not null default 'PLN' check (currency = 'PLN'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, effective_from)
);

create trigger monthly_budgets_set_updated_at
  before update on public.monthly_budgets
  for each row execute function public.set_updated_at();

alter table public.monthly_budgets enable row level security;

revoke all on public.monthly_budgets from anon, authenticated;
grant select, insert, update, delete on public.monthly_budgets to authenticated;

create policy monthly_budgets_select on public.monthly_budgets
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy monthly_budgets_insert on public.monthly_budgets
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy monthly_budgets_update on public.monthly_budgets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy monthly_budgets_delete on public.monthly_budgets
  for delete to authenticated
  using ((select auth.uid()) = user_id);
