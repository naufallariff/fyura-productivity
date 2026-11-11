alter table focus_sessions enable row level security;
alter table focus_sessions force row level security;

drop policy if exists focus_sessions_owner on focus_sessions;
create policy focus_sessions_owner on focus_sessions for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

grant select, insert, update, delete on focus_sessions to app_runtime;