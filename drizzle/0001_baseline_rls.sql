-- 0001_baseline_rls.sql
-- Roles, helper functions, row level security, and grants for the whole public schema.

-- Guard: fail loudly if the runtime role is missing.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    raise exception 'Role app_runtime is missing. Create it in Supabase first.';
  end if;
end $$;

grant usage on schema public to app_runtime;

-- Current user for policies. withUser() sets app.user_id per transaction.
create or replace function app_current_user_id() returns uuid
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- Login helper. Signature matches server/db/users.ts: (email, name).
-- Runs with owner rights because no user is set yet during sign-in.
create or replace function fn_upsert_user_by_email(p_email text, p_name text) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into users (email, name)
  values (lower(trim(p_email)), nullif(trim(coalesce(p_name, '')), ''))
  on conflict (email) do update
    set name = coalesce(excluded.name, users.name),
        updated_at = now()
  returning id into v_id;
  return v_id;
end
$$;

revoke all on function fn_upsert_user_by_email(text, text) from public;
grant execute on function fn_upsert_user_by_email(text, text) to app_runtime;

revoke all on function app_current_user_id() from public;
grant execute on function app_current_user_id() to app_runtime;

-- Supabase exposes public tables and functions through its API to anon and authenticated.
-- The app never uses that path, so close it.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- users: RLS is enabled but NOT forced, so the login function (owner rights) can insert.
alter table users enable row level security;
drop policy if exists users_self on users;
create policy users_self on users for all
  using (id = app_current_user_id())
  with check (id = app_current_user_id());
grant select, update on users to app_runtime;

-- Every table owned by a user: enabled, forced, one owner policy, explicit grant.
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_settings',
    'private_pin',
    'audit_log',
    'day_logs',
    'time_blocks',
    'focus_sessions',
    'journal_entries',
    'weekly_plan_items',
    'checklist_entries',
    'boards',
    'board_lists',
    'board_cards',
    'board_labels',
    'board_card_labels',
    'board_checklist_items',
    'rate_limits'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists %I on %I', t || '_owner', t);
    execute format(
      'create policy %I on %I for all using (user_id = app_current_user_id()) with check (user_id = app_current_user_id())',
      t || '_owner',
      t
    );
    execute format('grant select, insert, update, delete on %I to app_runtime', t);
  end loop;
end $$;