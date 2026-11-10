-- Unique target for the composite foreign keys (safe to re-run)
create unique index if not exists habits_id_user_uq on habits (id, user_id);

-- Drop the old single-column foreign keys
alter table habit_checks drop constraint if exists habit_checks_habit_id_habits_id_fk;
alter table time_blocks drop constraint if exists time_blocks_habit_id_habits_id_fk;

-- Add the composite owner foreign keys when missing
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'habit_checks_habit_owner_fk') then
    alter table habit_checks
      add constraint habit_checks_habit_owner_fk
      foreign key (habit_id, user_id) references habits (id, user_id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'time_blocks_habit_owner_fk') then
    alter table time_blocks
      add constraint time_blocks_habit_owner_fk
      foreign key (habit_id, user_id) references habits (id, user_id);
  end if;
end $$;