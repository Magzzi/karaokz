import type { RoomQueueItem } from '@/types/room';

// Pure state machine for a room's queue and its "now playing" cursor.
// Realtime events, local optimistic edits and playback all go through
// applyQueueEvent, so host and guest share one set of rules.

export interface RoomQueueState {
  roomId: string | null;
  items: RoomQueueItem[];
  currentItemId: string | null;
}

export type RoomQueueEvent =
  | { type: 'loaded'; roomId: string; items: RoomQueueItem[] }
  | { type: 'inserted'; item: RoomQueueItem }
  | { type: 'updated'; item: RoomQueueItem }
  | { type: 'deleted'; id: string }
  | { type: 'moved'; id: string; direction: 'up' | 'down' }
  | { type: 'played'; id: string }
  | { type: 'ended' };

export const initialRoomQueueState: RoomQueueState = {
  roomId: null,
  items: [],
  currentItemId: null,
};

function byPosition(a: RoomQueueItem, b: RoomQueueItem): number {
  return a.position - b.position;
}

// Drops an item; if it was playing, the first remaining item takes over
function withoutItem(state: RoomQueueState, id: string): RoomQueueState {
  if (!state.items.some(i => i.id === id)) return state;
  const items = state.items.filter(i => i.id !== id);
  const currentItemId = state.currentItemId === id
    ? items[0]?.id ?? null
    : state.currentItemId;
  return { ...state, items, currentItemId };
}

export function applyQueueEvent(state: RoomQueueState, event: RoomQueueEvent): RoomQueueState {
  switch (event.type) {
    case 'loaded': {
      const items = [...event.items].sort(byPosition);
      // The host marks what it plays with is_playing; trust that over guessing
      const playing = items.find(i => i.is_playing);
      const keep = items.some(i => i.id === state.currentItemId);
      return {
        roomId: event.roomId,
        items,
        currentItemId: playing?.id ?? (keep ? state.currentItemId : items[0]?.id ?? null),
      };
    }

    case 'inserted': {
      if (event.item.room_id !== state.roomId) return state;
      if (state.items.some(i => i.id === event.item.id)) return state;
      return {
        ...state,
        items: [...state.items, event.item].sort(byPosition),
        // Autoplay when nothing is playing
        currentItemId: state.currentItemId ?? event.item.id,
      };
    }

    // UPDATE subscriptions can't be filtered by room_id, so foreign rows arrive here
    case 'updated': {
      if (event.item.room_id !== state.roomId) return state;
      if (!state.items.some(i => i.id === event.item.id)) return state;
      return {
        ...state,
        items: state.items.map(i => (i.id === event.item.id ? event.item : i)).sort(byPosition),
        currentItemId: event.item.is_playing ? event.item.id : state.currentItemId,
      };
    }

    // DELETE payloads carry only the id; unknown ids belong to other rooms
    case 'deleted':
      return withoutItem(state, event.id);

    case 'moved': {
      const idx = state.items.findIndex(i => i.id === event.id);
      const swapIdx = event.direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= state.items.length) return state;
      const items = [...state.items];
      const a = items[idx];
      const b = items[swapIdx];
      items[idx] = { ...a, position: b.position };
      items[swapIdx] = { ...b, position: a.position };
      return { ...state, items: items.sort(byPosition) };
    }

    case 'played':
      if (!state.items.some(i => i.id === event.id)) return state;
      return { ...state, currentItemId: event.id };

    case 'ended':
      if (!state.currentItemId) return state;
      return withoutItem(state, state.currentItemId);
  }
}

export function currentItem(state: RoomQueueState): RoomQueueItem | null {
  return state.items.find(i => i.id === state.currentItemId) ?? null;
}
