-- ============================================================
-- RLS, grant, dan fungsi untuk Fyura Productivity
-- ============================================================

-- 0. Pastikan role runtime sudah dibuat (lihat 2.3)
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    raise exception 'Role app_runtime belum ada. Jalankan 2.3 terlebih dahulu.';
  end if;
end $$;

-- 1. Grant untuk role runtime, termasuk tabel yang dibuat di masa depan
grant usage on schema public to app_runtime;
grant select, insert, update, delete on all tables in schema public to app_runtime;
grant usage, select on all sequences in schema public to app_runtime;
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_runtime;
alter default privileges in schema public
  grant usage, select on sequences to app_runtime;

-- 2. Helper: membaca identitas pengguna dari transaksi
create or replace function public.app_current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- 3. Login pertama: membuat atau memperbarui user berdasarkan email.
--    Dijalankan sebelum app.user_id ada, jadi memakai SECURITY DEFINER.
create or replace function public.fn_upsert_user_by_email(p_email text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into users (email, name)
  values (lower(p_email), p_name)
  on conflict (email) do update
    set name = coalesce(excluded.name, users.name),
        updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.fn_upsert_user_by_email(text, text) from public;
grant execute on function public.fn_upsert_user_by_email(text, text) to app_runtime;

-- 4. Aktifkan RLS dan policy per tabel
alter table users enable row level security;
alter table users force row level security;
create policy users_self on users for all
  using (id = app_current_user_id())
  with check (id = app_current_user_id());

alter table user_settings enable row level security;
alter table user_settings force row level security;
create policy user_settings_owner on user_settings for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

alter table themes enable row level security;
alter table themes force row level security;
create policy themes_read on themes for select
  using (user_id is null or user_id = app_current_user_id());
create policy themes_write on themes for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

alter table private_pin enable row level security;
alter table private_pin force row level security;
create policy private_pin_owner on private_pin for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

alter table audit_log enable row level security;
alter table audit_log force row level security;
create policy audit_owner on audit_log for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());