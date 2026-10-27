-- Browser save storage. This table is separate from the Unity player_saves contract.
-- The policy set deliberately does not grant anonymous access or row deletion.
create table if not exists public.player_web_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_json jsonb not null,
  updated_at timestamptz not null default now(),
  version integer not null default 5,
  constraint player_web_saves_size_check check (pg_column_size(save_json) < 262144)
);

-- Upgrade an existing table safely too: IF NOT EXISTS on CREATE TABLE does not
-- add columns/constraints to a table created manually in an earlier deployment.
alter table public.player_web_saves
  add column if not exists version integer not null default 5;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'player_web_saves_size_check'
      and conrelid = 'public.player_web_saves'::regclass
  ) then
    alter table public.player_web_saves
      add constraint player_web_saves_size_check
      check (pg_column_size(save_json) < 262144);
  end if;
end $migration$;

alter table public.player_web_saves enable row level security;
revoke all on table public.player_web_saves from public, anon, authenticated;
grant select, insert, update on table public.player_web_saves to authenticated;

-- PostgreSQL combines permissive RLS policies with OR. Remove unknown legacy
-- policies too, otherwise a stale permissive policy could bypass these owner
-- predicates when this migration upgrades a pre-existing table.
do $migration$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'player_web_saves'
  loop
    execute format('drop policy %I on public.player_web_saves', existing_policy.policyname);
  end loop;
end
$migration$;

create policy player_web_saves_select_own
  on public.player_web_saves
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy player_web_saves_insert_own
  on public.player_web_saves
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy player_web_saves_update_own
  on public.player_web_saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
