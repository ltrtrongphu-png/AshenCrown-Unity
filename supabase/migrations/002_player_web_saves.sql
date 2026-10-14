-- Browser save storage. This table is separate from the Unity player_saves contract.
-- The policy set deliberately does not grant anonymous access or row deletion.
create table if not exists public.player_web_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_json jsonb not null,
  updated_at timestamptz not null default now(),
  version integer not null default 5,
  constraint player_web_saves_size_check check (pg_column_size(save_json) < 262144)
);

alter table public.player_web_saves enable row level security;

drop policy if exists player_web_saves_select_own on public.player_web_saves;
create policy player_web_saves_select_own
  on public.player_web_saves
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists player_web_saves_insert_own on public.player_web_saves;
create policy player_web_saves_insert_own
  on public.player_web_saves
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists player_web_saves_update_own on public.player_web_saves;
create policy player_web_saves_update_own
  on public.player_web_saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
