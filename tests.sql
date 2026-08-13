create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_filename text,
  test_type text not null default 'sat',
  difficulty text not null default 'Mixed',
  time_limit integer,
  question_count integer not null,
  questions jsonb not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'not_started',
  score integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists tests_user_id_idx on public.tests(user_id);
alter table public.tests enable row level security;
drop policy if exists tests_own on public.tests;
create policy tests_own on public.tests for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.tests to authenticated;
notify pgrst,'reload schema';
