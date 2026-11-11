-- journal_entries: owner-only access
alter table journal_entries enable row level security;
alter table journal_entries force row level security;
drop policy if exists journal_entries_owner on journal_entries;
create policy journal_entries_owner on journal_entries for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());
grant select, insert, update, delete on journal_entries to app_runtime;

-- focus_sessions: re-assert policy and grant so migrations are the single source of truth
drop policy if exists focus_sessions_owner on focus_sessions;
create policy focus_sessions_owner on focus_sessions for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());
grant select, insert, update, delete on focus_sessions to app_runtime;