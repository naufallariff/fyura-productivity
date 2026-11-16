alter table weekly_plan_items enable row level security;
alter table weekly_plan_items force row level security;

drop policy if exists weekly_plan_items_owner on weekly_plan_items;
create policy weekly_plan_items_owner on weekly_plan_items for all
  using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());

grant select, insert, update, delete on weekly_plan_items to app_runtime;