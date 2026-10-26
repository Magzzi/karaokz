-- ============================================================
-- KaraOkz — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Fresh setups only; existing projects apply migrations/ instead.
--
-- Requires: Authentication > Sign In / Providers >
--   "Allow anonymous sign-ins". Every browser signs in anonymously
--   and only room members can read or change a room.
-- ============================================================

-- Enable UUID generation (already enabled on most Supabase projects)
create extension if not exists "pgcrypto";

-- ============================================================
-- ROOMS
-- Represents a karaoke session. Host creates on PC via create_room(),
-- guests join via /room/[code]/add with code + PIN (join_room()).
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
-- QUEUE POSITION HELPER
-- Returns the next available position for a room's queue.
-- Usage: select next_queue_position('room-uuid-here');
-- ============================================================
create or replace function next_queue_position(p_room_id uuid)
returns integer
language sql
set search_path = public
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
set search_path = public
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
set search_path = public
as $$
  update rooms
  set    is_active = false
  where  last_active_at < now() - interval '24 hours'
  and    is_active = true;
$$;

-- ============================================================
-- MEMBERSHIP + SECRETS
-- ============================================================
create table if not exists room_members (
  room_id    uuid        not null references rooms(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null check (role in ('host', 'guest')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists idx_room_members_user
  on room_members(user_id);

-- Kept out of rooms so select('*') can never leak the PIN
create table if not exists room_secrets (
  room_id   uuid primary key references rooms(id) on delete cascade,
  join_pin  text not null
);

alter table room_members enable row level security;
alter table room_secrets enable row level security;

-- ============================================================
-- MEMBERSHIP HELPERS
-- security definer so policies can read room_members without
-- recursing through its own RLS.
-- ============================================================
create or replace function is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from room_members
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

create or replace function is_room_host(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from room_members
    where room_id = p_room_id and user_id = auth.uid() and role = 'host'
  );
$$;

-- ============================================================
-- ROOM CODE GENERATOR (now only called by create_room)
-- ============================================================
create or replace function generate_room_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  words    text[] := array[
    'BEAT','ECHO','VIBE','BASS','TUNE','JAZZ','ROCK','SOUL',
    'STAR','NEON','WAVE','LUNA','NOVA','ARIA','LYRA','RIFF',
    'DUSK','GLOW','HYPE','KAZE','MUSE','VOLT','ZEAL','APEX'
  ];
  v_code   text;
  attempts int := 0;
begin
  loop
    v_code := words[1 + floor(random() * array_length(words, 1))::int]
              || '-'
              || lpad(floor(random() * 100)::text, 2, '0');

    if not exists (
      select 1 from rooms
      where rooms.code = v_code and is_active = true
    ) then
      return v_code;
    end if;

    attempts := attempts + 1;
    if attempts > 100 then
      return upper(replace(substring(gen_random_uuid()::text, 1, 8), '-', ''));
    end if;
  end loop;
end;
$$;

-- ============================================================
-- JOIN PIN GENERATOR
-- 6 chars from 32 unambiguous symbols (no 0/O/1/I): ~1e9 values.
-- 256 is a multiple of 32, so byte % 32 is unbiased.
-- ============================================================
create or replace function generate_join_pin()
returns text
language plpgsql
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes    bytea := gen_random_bytes(6);
  pin      text := '';
begin
  for i in 0..5 loop
    pin := pin || substr(alphabet, 1 + get_byte(bytes, i) % 32, 1);
  end loop;
  return pin;
end;
$$;

-- ============================================================
-- CREATE ROOM
-- Creates the room, its PIN and the caller's host membership
-- in one transaction.
-- Usage: select * from create_room('Host');
-- ============================================================
create or replace function create_room(p_host_name text)
returns table (id uuid, code text, join_pin text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms%rowtype;
  v_pin  text := generate_join_pin();
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into rooms (code, host_name)
  values (generate_room_code(), coalesce(nullif(trim(p_host_name), ''), 'Host'))
  returning * into v_room;

  insert into room_secrets (room_id, join_pin) values (v_room.id, v_pin);
  insert into room_members (room_id, user_id, role) values (v_room.id, auth.uid(), 'host');

  return query select v_room.id, v_room.code, v_pin;
end;
$$;

-- ============================================================
-- JOIN ROOM
-- Adds the caller as a guest when code + PIN match an active room.
-- Unknown code and wrong PIN raise the same error, so the RPC
-- doesn't reveal which codes exist. Re-joining keeps a host a host.
-- Usage: select join_room('NOVA-07', 'K7QX2M');
-- ============================================================
create or replace function join_room(p_code text, p_pin text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select r.id into v_room_id
  from rooms r
  join room_secrets s on s.room_id = r.id
  where r.code = upper(trim(p_code))
    and r.is_active = true
    and s.join_pin = upper(trim(p_pin));

  if v_room_id is null then
    raise exception 'INVALID_INVITE';
  end if;

  insert into room_members (room_id, user_id, role)
  values (v_room_id, auth.uid(), 'guest')
  on conflict (room_id, user_id) do nothing;

  return v_room_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
drop policy if exists "rooms_select"       on rooms;
drop policy if exists "rooms_insert"       on rooms;
drop policy if exists "rooms_update"       on rooms;
drop policy if exists "rooms_delete"       on rooms;
drop policy if exists "queue_items_select" on queue_items;
drop policy if exists "queue_items_insert" on queue_items;
drop policy if exists "queue_items_update" on queue_items;
drop policy if exists "queue_items_delete" on queue_items;
drop policy if exists "room_members_select" on room_members;
drop policy if exists "room_secrets_select" on room_secrets;

-- Rooms: members read; only the host changes or deletes.
-- No insert policy: rooms are created through create_room().
create policy "rooms_select" on rooms
  for select to authenticated using (is_room_member(id));

create policy "rooms_update" on rooms
  for update to authenticated
  using (is_room_host(id)) with check (is_room_host(id));

create policy "rooms_delete" on rooms
  for delete to authenticated using (is_room_host(id));

-- Queue: any member of the room. with check stops items being
-- added to, or moved into, a room the caller isn't in.
create policy "queue_items_select" on queue_items
  for select to authenticated using (is_room_member(room_id));

create policy "queue_items_insert" on queue_items
  for insert to authenticated
  with check (
    is_room_member(room_id)
    and exists (select 1 from rooms r where r.id = room_id and r.is_active)
  );

create policy "queue_items_update" on queue_items
  for update to authenticated
  using (is_room_member(room_id)) with check (is_room_member(room_id));

create policy "queue_items_delete" on queue_items
  for delete to authenticated using (is_room_member(room_id));

-- Members see their own memberships; writes only via the RPCs
create policy "room_members_select" on room_members
  for select to authenticated using (user_id = auth.uid());

-- Only the host can read the PIN (to redisplay the invite QR)
create policy "room_secrets_select" on room_secrets
  for select to authenticated using (is_room_host(room_id));

-- ============================================================
-- TABLE-LEVEL GRANTS
-- No session (anon role) = no access at all.
-- ============================================================
revoke all on table public.rooms        from anon, authenticated;
revoke all on table public.queue_items  from anon, authenticated;
revoke all on table public.room_members from anon, authenticated;
revoke all on table public.room_secrets from anon, authenticated;

grant select, update, delete         on table public.rooms        to authenticated;
grant select, insert, update, delete on table public.queue_items  to authenticated;
grant select                         on table public.room_members to authenticated;
grant select                         on table public.room_secrets to authenticated;

-- ============================================================
-- FUNCTION GRANTS
-- Supabase grants execute to anon/authenticated by default.
-- ============================================================
revoke execute on function generate_room_code()          from public, anon, authenticated;
revoke execute on function generate_join_pin()           from public, anon, authenticated;
revoke execute on function cleanup_inactive_rooms()      from public, anon, authenticated;
revoke execute on function create_room(text)             from public, anon;
revoke execute on function join_room(text, text)         from public, anon;
revoke execute on function is_room_member(uuid)          from public, anon;
revoke execute on function is_room_host(uuid)            from public, anon;
revoke execute on function next_queue_position(uuid)     from public, anon;
revoke execute on function touch_room(uuid)              from public, anon;

grant execute on function create_room(text)         to authenticated;
grant execute on function join_room(text, text)     to authenticated;
grant execute on function is_room_member(uuid)      to authenticated;
grant execute on function is_room_host(uuid)        to authenticated;
grant execute on function next_queue_position(uuid) to authenticated;
grant execute on function touch_room(uuid)          to authenticated;

-- ============================================================
-- REALTIME
-- Host and guests get queue changes live. INSERT/UPDATE events are
-- filtered per subscriber by the select policy.
-- ============================================================
alter publication supabase_realtime add table queue_items;
