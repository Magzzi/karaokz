-- ============================================================
-- KaraOkz — Migration 001: room membership
-- Replaces the open (using true) policies with membership checks.
--
-- Before running:
--   Dashboard > Authentication > Sign In / Providers > enable
--   "Allow anonymous sign-ins". Every browser signs in anonymously
--   and joins rooms with code + PIN.
--
-- Run once in: Supabase Dashboard > SQL Editor > New Query.
-- Existing rooms have no members, so they are ended at the bottom.
-- ============================================================

create extension if not exists "pgcrypto";

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
-- Nothing subscribes to rooms; queue_items INSERT/UPDATE events
-- are filtered by the select policy per subscriber.
-- ============================================================
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime drop table rooms;
  end if;
end;
$$;

-- ============================================================
-- EXISTING ROOMS
-- Created before membership existed, so nobody could open them.
-- ============================================================
update rooms
set    is_active = false
where  is_active = true
and    id not in (select room_id from room_members);
