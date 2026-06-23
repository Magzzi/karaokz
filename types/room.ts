export interface Room {
  id: string;
  code: string;
  host_name: string;
  created_at: string;
  last_active_at: string;
  is_active: boolean;
  settings: Record<string, unknown>;
}

export interface RoomQueueItem {
  id: string;
  room_id: string;
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail: string;
  duration: string;
  singer_name: string | null;
  position: number;
  is_played: boolean;
  is_playing: boolean;
  added_from: string; // 'pc' | 'phone' | 'manual'
  added_at: string;
}
