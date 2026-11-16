alter table checklist_entries enable row level security;
alter table checklist_entries force row level security;

drop policy if exists checklist_entries_owner on checklist_entries;
create policy checklist_entries_owner on checklist_entries for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

grant select, insert, update, delete on checklist_entries to app_runtime;