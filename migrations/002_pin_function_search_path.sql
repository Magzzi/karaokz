-- ============================================================
-- KaraOkz — Migration 002: pin search_path on older functions
-- Clears Supabase's "function_search_path_mutable" advisor warning.
-- ============================================================
alter function next_queue_position(uuid) set search_path = public;
alter function touch_room(uuid)          set search_path = public;
alter function cleanup_inactive_rooms()  set search_path = public;
