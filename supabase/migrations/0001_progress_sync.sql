-- Cross-device progress sync (ADR-0020).
--
-- Each row is one validated domain object in a JSONB `data` column, plus its key and
-- `updated_at` as real columns for last-write-wins comparison and indexing. Storing progress
-- this way keeps the table shape stable when the app's schema moves. Only progress is stored
-- here — never content, question text, or answers.

create table if not exists public.progress (
  user_id     uuid   not null references auth.users (id) on delete cascade,
  question_id text   not null,
  updated_at  bigint not null,
  data        jsonb  not null,
  primary key (user_id, question_id)
);

create table if not exists public.lesson_progress (
  user_id    uuid   not null references auth.users (id) on delete cascade,
  lesson_id  text   not null,
  updated_at bigint not null,
  data       jsonb  not null,
  primary key (user_id, lesson_id)
);

-- Row-Level Security is what makes the public anon key safe (ADR-0020): a user can only ever
-- see and change their own rows.
alter table public.progress enable row level security;
alter table public.lesson_progress enable row level security;

create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own lesson_progress" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Self-service account deletion ships with the feature (ADR-0020): one call removes the
-- caller's progress and their auth record. SECURITY DEFINER so it may delete from auth.users;
-- pinned search_path and a tight grant keep that privilege from leaking.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.progress where user_id = auth.uid();
  delete from public.lesson_progress where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
