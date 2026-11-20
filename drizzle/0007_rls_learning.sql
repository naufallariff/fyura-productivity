-- 0007_rls_learning.sql
-- Row level security and explicit grants for the learning tables.

revoke all on table subjects, learning_items, reading_progress, review_cards from anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['subjects', 'learning_items', 'reading_progress', 'review_cards'] loop
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