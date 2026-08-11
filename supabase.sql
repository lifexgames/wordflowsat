-- WordFlow database
-- Run this entire script in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Learner',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  note text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  word text not null,
  meaning text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  learned boolean not null default false,
  last_reviewed timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, word_id)
);

create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists words_user_id_idx on public.words(user_id);
create index if not exists words_category_id_idx on public.words(category_id);
create index if not exists progress_user_id_idx on public.word_progress(user_id);
create index if not exists progress_word_id_idx on public.word_progress(word_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.words enable row level security;
alter table public.word_progress enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles
for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "categories own rows" on public.categories;
create policy "categories own rows" on public.categories
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "words own rows" on public.words;
create policy "words own rows" on public.words
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "progress own rows" on public.word_progress;
create policy "progress own rows" on public.word_progress
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Automatically create a profile whenever a new Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Learner'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep updated_at current.
create or replace function public.set_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists word_progress_updated_at on public.word_progress;
create trigger word_progress_updated_at
before update on public.word_progress
for each row execute procedure public.set_progress_updated_at();

-- Optional: add a uniqueness rule for a word within each user's category.
create unique index if not exists words_user_category_word_unique
on public.words(user_id, category_id, lower(word));
