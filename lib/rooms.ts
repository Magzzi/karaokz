import { supabase } from './supabase';
import { Room, RoomQueueItem } from '@/types/room';
import { YouTubeVideo } from '@/types/youtube';

export async function createRoom(hostName: string): Promise<{ id: string; code: string }> {
  const { data: code, error: codeError } = await supabase.rpc('generate_room_code');
  if (codeError) throw codeError;

  const { data, error } = await supabase
    .from('rooms')
    .insert({ code, host_name: hostName })
    .select('id, code')
    .single();

  if (error) throw error;
  return data as { id: string; code: string };
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Room;
}

export async function getQueueItems(roomId: string): Promise<RoomQueueItem[]> {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_played', false)
    .order('position', { ascending: true });

  if (error) return [];
  return data as RoomQueueItem[];
}

export async function addQueueItem(
  roomId: string,
  video: YouTubeVideo,
  singerName: string | null,
  addedFrom: 'pc' | 'phone' | 'manual'
): Promise<void> {
  const { data: position } = await supabase.rpc('next_queue_position', { p_room_id: roomId });

  await supabase.from('queue_items').insert({
    room_id: roomId,
    video_id: video.id,
    title: video.title,
    channel_name: video.channelName,
    thumbnail: video.thumbnail,
    duration: video.duration,
    singer_name: singerName,
    position: position ?? 0,
    added_from: addedFrom,
  });
}

export async function removeQueueItem(itemId: string): Promise<void> {
  await supabase.from('queue_items').delete().eq('id', itemId);
}

// Swaps the position of an item with the one above or below it
export async function moveQueueItem(
  itemId: string,
  direction: 'up' | 'down',
  items: RoomQueueItem[]
): Promise<void> {
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  if (direction === 'up' && idx === 0) return;
  if (direction === 'down' && idx === items.length - 1) return;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  const posA = items[idx].position;
  const posB = items[swapIdx].position;

  await Promise.all([
    supabase.from('queue_items').update({ position: posB }).eq('id', items[idx].id),
    supabase.from('queue_items').update({ position: posA }).eq('id', items[swapIdx].id),
  ]);
}

export async function touchRoom(roomId: string): Promise<void> {
  await supabase.rpc('touch_room', { p_room_id: roomId });
}

export async function endRoom(roomId: string): Promise<void> {
  await supabase.from('rooms').update({ is_active: false }).eq('id', roomId);
}
