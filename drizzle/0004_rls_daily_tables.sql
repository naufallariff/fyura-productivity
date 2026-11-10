-- RLS for the daily tables. Grants come from the default privileges set in the
-- foundation migration, because this migration runs as the postgres role.
alter table day_logs enable row level security;

alter table day_logs force row level security;

create policy day_logs_owner on day_logs for all using (user_id = app_current_user_id ())
with
    check (user_id = app_current_user_id ());

alter table habits enable row level security;

alter table habits force row level security;

create policy habits_owner on habits for all using (user_id = app_current_user_id ())
with
    check (user_id = app_current_user_id ());

alter table habit_checks enable row level security;

alter table habit_checks force row level security;

create policy habit_checks_owner on habit_checks for all using (user_id = app_current_user_id ())
with
    check (user_id = app_current_user_id ());

alter table time_blocks enable row level security;

alter table time_blocks force row level security;

create policy time_blocks_owner on time_blocks for all using (user_id = app_current_user_id ())
with
    check (user_id = app_current_user_id ());