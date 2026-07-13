-- Gulf Bite — Supabase schema (Phase B: hosted hotspots + catches)
-- Run in the Supabase SQL editor (or via supabase db push).
-- Row Level Security: public read; writes require an authenticated user
-- (any logged-in account can add hotspots / log catches).
-- NOTE: for a future "multi-author blog", add a `posts` table + profiles too.

create extension if not exists "uuid-ossp";

-- ---- Hotspots (community-added fishing spots) ----
create table if not exists public.hotspots (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  note        text default '',
  lat         double precision not null,
  lng         double precision not null,
  user_id     uuid references auth.users(id) on delete set null default auth.uid(),
  created_at  timestamptz default now()
);

-- ---- Catches (what was caught AT a hotspot) ----
-- hotspot_id is free text, not a FK: the app's 6 built-in hotspots (e.g.
-- 'aransas-pass') are seeded in client code and never written to
-- public.hotspots, so catches must be able to reference either a built-in
-- slug or a DB-hosted hotspot's uuid (stored as text).
create table if not exists public.catches (
  id           uuid primary key default uuid_generate_v4(),
  hotspot_id   text not null,
  user_id      uuid references auth.users(id) on delete set null default auth.uid(),
  species      text not null,                 -- 'trout' | 'redfish' | 'drum' | free text
  caught_at    timestamptz not null,          -- when it was caught
  length_in    numeric,                       -- inches (or cm; app labels inches)
  note         text default '',
  created_at   timestamptz default now()
);

-- ---- Indexes ----
create index if not exists hotspots_geo on public.hotspots (lat, lng);
create index if not exists catches_hotspot on public.catches (hotspot_id);

-- ---- RLS ----
alter table public.hotspots enable row level security;
alter table public.catches  enable row level security;

-- Public read
create policy "hotspots public read"  on public.hotspots for select using (true);
create policy "catches public read"   on public.catches  for select using (true);

-- Authenticated users can insert/update/delete their own rows
create policy "hotspots insert auth"  on public.hotspots for insert with check (auth.uid() is not null);
create policy "hotspots update auth"  on public.hotspots for update using (auth.uid() = user_id);
create policy "hotspots delete auth"  on public.hotspots for delete using (auth.uid() = user_id);

create policy "catches insert auth"   on public.catches for insert with check (auth.uid() is not null);
create policy "catches update auth"   on public.catches for update using (auth.uid() = user_id);
create policy "catches delete auth"   on public.catches for delete using (auth.uid() = user_id);

-- ---- Migration for databases provisioned before this schema version ----
-- (hotspot_id used to be a uuid FK to public.hotspots, which can't hold the
-- app's built-in slug ids; user_id used to have no default, so rows never
-- recorded their owner and could never be updated/deleted afterward.)
alter table if exists public.catches drop constraint if exists catches_hotspot_id_fkey;
alter table if exists public.catches alter column hotspot_id type text using hotspot_id::text;
alter table if exists public.hotspots alter column user_id set default auth.uid();
alter table if exists public.catches alter column user_id set default auth.uid();
