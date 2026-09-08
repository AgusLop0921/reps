-- Scope all progress to a learning track. Existing rows predate tracks and therefore belong
-- to the original React path. The JSONB payload is backfilled too so current Zod validation
-- accepts pulled legacy rows without losing boxes, history, completion, or timestamps.

alter table public.progress add column if not exists track_id text;
alter table public.lesson_progress add column if not exists track_id text;

update public.progress
set track_id = 'react',
    data = jsonb_set(data, '{trackId}', '"react"'::jsonb, true)
where track_id is null;

update public.lesson_progress
set track_id = 'react',
    data = jsonb_set(data, '{trackId}', '"react"'::jsonb, true)
where track_id is null;

alter table public.progress alter column track_id set not null;
alter table public.lesson_progress alter column track_id set not null;

alter table public.progress drop constraint progress_pkey;
alter table public.progress
  add primary key (user_id, track_id, question_id);

alter table public.lesson_progress drop constraint lesson_progress_pkey;
alter table public.lesson_progress
  add primary key (user_id, track_id, lesson_id);
