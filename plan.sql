-- ============================================================
-- KaraOkz — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID generation (already enabled on most Supabase projects)
create extension if not exists "pgcrypto";

-- ============================================================
-- ROOMS
-- Represents a karaoke session. Host creates on PC,
-- guests join via /room/[code]/add from their phone.
-- ============================================================
create table if not exists rooms (
  id              uuid        primary key default gen_random_uuid(),
  code            text        unique not null,           -- e.g. "BEAT-42"
  host_name       text        not null default 'Host',
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  is_active       boolean     not null default true,
  settings        jsonb       not null default '{}'::jsonb
);

-- ============================================================
-- QUEUE ITEMS
-- Songs added to a room's queue. Supports PC and phone.
-- Position controls playback order.
-- ============================================================
create table if not exists queue_items (
  id            uuid        primary key default gen_random_uuid(),
  room_id       uuid        not null references rooms(id) on delete cascade,
  video_id      text        not null,
  title         text        not null,
  channel_name  text        not null default '',
  thumbnail     text        not null default '',
  duration      text        not null default '0:00',
  singer_name   text,                           -- optional: who's singing
  position      integer     not null default 0, -- lower = plays sooner
  is_played     boolean     not null default false,
  is_playing    boolean     not null default false,
  added_from    text        default 'pc',       -- 'pc' | 'phone' | 'manual'
  added_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_rooms_code
  on rooms(code);

create index if not exists idx_rooms_active
  on rooms(is_active, last_active_at);

create index if not exists idx_queue_items_room
  on queue_items(room_id, position);

create index if not exists idx_queue_items_room_playing
  on queue_items(room_id, is_playing);

-- ============================================================
-- ROW LEVEL SECURITY
-- Room code acts as the access key — no auth required yet.
-- All operations open to anon. Tighten when you add auth.
-- ============================================================
alter table rooms       enable row level security;
alter table queue_items enable row level security;

create policy "rooms_select" on rooms
  for select using (true);

create policy "rooms_insert" on rooms
  for insert with check (true);

create policy "rooms_update" on rooms
  for update using (true);

create policy "queue_items_select" on queue_items
  for select using (true);

create policy "queue_items_insert" on queue_items
  for insert with check (true);

create policy "queue_items_update" on queue_items
  for update using (true);

create policy "queue_items_delete" on queue_items
  for delete using (true);

-- ============================================================
-- REALTIME
-- PC receives instant updates when a phone adds a song.
-- ============================================================
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table queue_items;

-- ============================================================
-- ROOM CODE GENERATOR
-- Generates a memorable code like "NOVA-07".
-- Usage: select generate_room_code();
-- ============================================================
create or replace function generate_room_code()
returns text
language plpgsql
as $$
declare
  words    text[] := array[
    'BEAT','ECHO','VIBE','BASS','TUNE','JAZZ','ROCK','SOUL',
    'STAR','NEON','WAVE','LUNA','NOVA','ARIA','LYRA','RIFF',
    'DUSK','GLOW','HYPE','KAZE','MUSE','VOLT','ZEAL','APEX'
  ];
  code     text;
  attempts int := 0;
begin
  loop
    code := words[1 + floor(random() * array_length(words, 1))::int]
            || '-'
            || lpad(floor(random() * 100)::text, 2, '0');

    if not exists (
      select 1 from rooms
      where rooms.code = code and is_active = true
    ) then
      return code;
    end if;

    attempts := attempts + 1;
    if attempts > 100 then
      return upper(replace(substring(gen_random_uuid()::text, 1, 8), '-', ''));
    end if;
  end loop;
end;
$$;

-- ============================================================
-- QUEUE POSITION HELPER
-- Returns the next available position for a room's queue.
-- Usage: select next_queue_position('room-uuid-here');
-- ============================================================
create or replace function next_queue_position(p_room_id uuid)
returns integer
language sql
as $$
  select coalesce(max(position) + 1, 0)
  from queue_items
  where room_id = p_room_id
    and is_played = false;
$$;

-- ============================================================
-- TOUCH ROOM
-- Updates last_active_at. Call on any host interaction.
-- Usage: select touch_room('room-uuid-here');
-- ============================================================
create or replace function touch_room(p_room_id uuid)
returns void
language sql
as $$
  update rooms
  set    last_active_at = now()
  where  id = p_room_id;
$$;

-- ============================================================
-- CLEANUP STALE ROOMS
-- Marks rooms inactive after 24h of no activity.
-- Schedule via Supabase cron (Dashboard > Database > Cron Jobs):
--   select cleanup_inactive_rooms();  every hour
-- ============================================================
create or replace function cleanup_inactive_rooms()
returns void
language sql
as $$
  update rooms
  set    is_active = false
  where  last_active_at < now() - interval '24 hours'
  and    is_active = true;
$$;
