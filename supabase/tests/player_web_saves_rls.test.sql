begin;

select plan(24);

select has_table(
  'public',
  'player_web_saves',
  'browser cloud-save table exists'
);

select ok(
  (select relrowsecurity
   from pg_class
   where oid = 'public.player_web_saves'::regclass),
  'row-level security is enabled'
);

select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'SELECT'),
  'anonymous role has no SELECT grant'
);
select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'INSERT'),
  'anonymous role has no INSERT grant'
);
select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'UPDATE'),
  'anonymous role has no UPDATE grant'
);
select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'DELETE'),
  'anonymous role has no DELETE grant'
);
select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'TRUNCATE'),
  'anonymous role cannot truncate the cloud-save table'
);
select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'REFERENCES'),
  'anonymous role cannot add foreign-key references to cloud saves'
);
select ok(
  not has_table_privilege('anon', 'public.player_web_saves', 'TRIGGER'),
  'anonymous role cannot create triggers on cloud saves'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_web_saves', 'DELETE'),
  'authenticated role cannot delete cloud saves'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_web_saves', 'TRUNCATE'),
  'authenticated role cannot truncate the cloud-save table'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_web_saves', 'REFERENCES'),
  'authenticated role cannot add foreign-key references to cloud saves'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_web_saves', 'TRIGGER'),
  'authenticated role cannot create triggers on cloud saves'
);

insert into auth.users (id, email)
values
  ('a4e10000-0000-4000-8000-000000000001', 'ashen-s4-user-a@example.test'),
  ('a4e10000-0000-4000-8000-000000000002', 'ashen-s4-user-b@example.test');

insert into public.player_web_saves (user_id, save_json, version)
values
  (
    'a4e10000-0000-4000-8000-000000000001',
    '{"saveVersion":5,"level":1,"chapter":1,"inventory":[],"flags":{},"savedAt":100}'::jsonb,
    5
  ),
  (
    'a4e10000-0000-4000-8000-000000000002',
    '{"saveVersion":5,"level":7,"chapter":3,"inventory":[],"flags":{},"savedAt":200}'::jsonb,
    5
  );

set local role anon;
select throws_ok(
  $$select user_id from public.player_web_saves$$,
  '42501',
  null,
  'anonymous role cannot read any cloud save'
);
reset role;

set local role authenticated;
set local "request.jwt.claim.sub" = 'a4e10000-0000-4000-8000-000000000001';
set local "request.jwt.claims" = '{"sub":"a4e10000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from public.player_web_saves),
  1::bigint,
  'user A sees exactly one row'
);
select is(
  (select count(*) from public.player_web_saves
   where user_id = 'a4e10000-0000-4000-8000-000000000002'),
  0::bigint,
  'user A cannot read user B row'
);

select throws_ok(
  $$
    insert into public.player_web_saves (user_id, save_json, version)
    values (
      'a4e10000-0000-4000-8000-000000000002',
      '{"saveVersion":5,"level":99,"chapter":10,"inventory":[],"flags":{},"savedAt":999}'::jsonb,
      5
    )
    on conflict (user_id)
    do update set save_json = excluded.save_json
  $$,
  '42501',
  null,
  'user A cannot insert or upsert a save owned by user B'
);

select throws_ok(
  $$
    update public.player_web_saves
    set user_id = 'a4e10000-0000-4000-8000-000000000002'
    where user_id = 'a4e10000-0000-4000-8000-000000000001'
  $$,
  '42501',
  null,
  'user A cannot reassign their row to user B'
);

select throws_ok(
  $$delete from public.player_web_saves
    where user_id = 'a4e10000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'user A cannot delete even their own row'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = 'a4e10000-0000-4000-8000-000000000002';
set local "request.jwt.claims" = '{"sub":"a4e10000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  (select count(*) from public.player_web_saves),
  1::bigint,
  'user B sees exactly one row'
);
select is(
  (select count(*) from public.player_web_saves
   where user_id = 'a4e10000-0000-4000-8000-000000000001'),
  0::bigint,
  'user B cannot read user A row'
);

select lives_ok(
  $$
    update public.player_web_saves
    set save_json = save_json || '{"level":8}'::jsonb,
        updated_at = now()
    where user_id = 'a4e10000-0000-4000-8000-000000000002'
  $$,
  'user B can update their own cloud save'
);

select is(
  (select (save_json ->> 'level')::integer
   from public.player_web_saves
   where user_id = 'a4e10000-0000-4000-8000-000000000002'),
  8,
  'user B update persisted'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = 'a4e10000-0000-4000-8000-000000000001';
set local "request.jwt.claims" = '{"sub":"a4e10000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select (save_json ->> 'level')::integer
   from public.player_web_saves
   where user_id = 'a4e10000-0000-4000-8000-000000000001'),
  1,
  'user A data remained unchanged during the cross-account attacks'
);

select * from finish();
rollback;
