begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- Fixtures as postgres: two users, one budget row each (A has an old updated_at on purpose,
-- because now() is constant inside a transaction).
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

insert into public.monthly_budgets (id, user_id, effective_from, limit_minor, updated_at)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '2026-10-01', 100000, '2026-01-01 00:00:00+00'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', '2026-10-01', 200000, '2026-01-01 00:00:00+00');

-- ===== User A =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is((select count(*)::int from public.monthly_budgets), 1, 'SELECT: A sees exactly one row');
select is((select id from public.monthly_budgets), 'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'SELECT: A sees only own row');

-- INSERT without user_id: the column default auth.uid() fills it.
select lives_ok(
  $$insert into public.monthly_budgets (effective_from, limit_minor) values ('2026-11-01', 150000)$$,
  'INSERT: A inserts a row without user_id'
);
select is(
  (select user_id from public.monthly_budgets where effective_from = '2026-11-01'),
  '00000000-0000-0000-0000-00000000000a'::uuid,
  'INSERT: user_id defaults to A'
);
select throws_ok(
  $$insert into public.monthly_budgets (user_id, effective_from, limit_minor) values ('00000000-0000-0000-0000-00000000000b', '2026-12-01', 1000)$$,
  '42501', null, 'INSERT: A cannot insert a row for B'
);

-- UPDATE
with u as (update public.monthly_budgets set limit_minor = 1 where id = 'bbbbbbbb-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from u), 0, 'UPDATE: A updates 0 rows of B');
-- (B untouched is verified as B below)
select throws_ok(
  $$update public.monthly_budgets set user_id = '00000000-0000-0000-0000-00000000000b' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501', null, 'UPDATE: A cannot reassign own row to B'
);

select lives_ok(
  $$update public.monthly_budgets set limit_minor = 110000 where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'UPDATE: A updates own row'
);
select ok(
  (select updated_at > '2026-01-01 00:00:00+00' from public.monthly_budgets where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'UPDATE: updated_at changes on own row update'
);

-- DELETE
with d as (delete from public.monthly_budgets where id = 'bbbbbbbb-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from d), 0, 'DELETE: A deletes 0 rows of B');

-- Upsert without user_id (needs SELECT + UPDATE policies): same month updates instead of duplicating.
select lives_ok(
  $$insert into public.monthly_budgets (effective_from, limit_minor) values ('2026-10-01', 120000)
    on conflict (user_id, effective_from) do update set limit_minor = excluded.limit_minor$$,
  'UPSERT: A re-saves the same month'
);
select is((select count(*)::int from public.monthly_budgets where effective_from = '2026-10-01'), 1, 'UPSERT: still one row for the month');
select is((select limit_minor from public.monthly_budgets where effective_from = '2026-10-01'), 120000, 'UPSERT: limit was updated');

-- Constraints
select throws_ok(
  $$insert into public.monthly_budgets (effective_from, limit_minor) values ('2027-01-01', 0)$$,
  '23514', null, 'CONSTRAINT: limit_minor = 0 is rejected'
);
select throws_ok(
  $$insert into public.monthly_budgets (effective_from, limit_minor) values ('2026-10-01', 5000)$$,
  '23505', null, 'CONSTRAINT: duplicate month without on conflict is rejected'
);

select throws_ok(
  $$insert into public.monthly_budgets (effective_from, limit_minor) values ('2026-10-15', 5000)$$,
  '23514', null, 'CONSTRAINT: effective_from must be the 1st day of a month'
);
select throws_ok(
  $$insert into public.monthly_budgets (effective_from, limit_minor, currency) values ('2027-01-01', 5000, 'EUR')$$,
  '23514', null, 'CONSTRAINT: currency other than PLN is rejected'
);

with d as (delete from public.monthly_budgets where effective_from = '2026-11-01' returning 1)
select is((select count(*)::int from d), 1, 'DELETE: A deletes own row');

-- ===== User B =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.monthly_budgets where id = 'bbbbbbbb-0000-0000-0000-000000000001' and limit_minor = 200000 and user_id = '00000000-0000-0000-0000-00000000000b'),
  1, 'B row is untouched by A (update and delete) and visible to B'
);
select is((select count(*)::int from public.monthly_budgets), 1, 'SELECT: B sees only own row');

with u as (update public.monthly_budgets set limit_minor = 1 where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from u), 0, 'UPDATE: B updates 0 rows of A');
with d as (delete from public.monthly_budgets where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from d), 0, 'DELETE: B deletes 0 rows of A');

reset role;
select is(
  (select count(*)::int from public.monthly_budgets where id = 'aaaaaaaa-0000-0000-0000-000000000001' and limit_minor = 120000 and user_id = '00000000-0000-0000-0000-00000000000a'),
  1, 'A row is untouched by B (update and delete)'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

-- ===== anon =====
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$select * from public.monthly_budgets$$, '42501', null, 'anon: SELECT is denied');
select throws_ok(
  $$insert into public.monthly_budgets (user_id, effective_from, limit_minor) values ('00000000-0000-0000-0000-00000000000a', '2027-02-01', 1000)$$,
  '42501', null, 'anon: INSERT is denied'
);
select throws_ok($$update public.monthly_budgets set limit_minor = 1$$, '42501', null, 'anon: UPDATE is denied');
select throws_ok($$delete from public.monthly_budgets$$, '42501', null, 'anon: DELETE is denied');

reset role;
select * from finish();
rollback;
