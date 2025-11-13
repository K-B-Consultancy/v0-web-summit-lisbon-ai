-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles policies
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create talks table
create table if not exists public.talks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text not null,
  description text,
  video_url text,
  thumbnail_url text,
  duration_minutes integer,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.talks enable row level security;

-- Talks policies - everyone can view, only admins can modify
create policy "talks_select_all"
  on public.talks for select
  using (true);

create policy "talks_insert_admin"
  on public.talks for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "talks_update_admin"
  on public.talks for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "talks_delete_admin"
  on public.talks for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  talk_id uuid not null references public.talks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Messages policies - authenticated users can read and create
create policy "messages_select_all"
  on public.messages for select
  using (true);

create policy "messages_insert_authenticated"
  on public.messages for insert
  with check (auth.uid() = user_id);

create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists idx_messages_talk_id on public.messages(talk_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_talks_created_at on public.talks(created_at desc);
