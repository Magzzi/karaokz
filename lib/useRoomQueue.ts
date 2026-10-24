'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { supabase } from './supabase';
import { getRoomByCode, getQueueItems, addQueueItem, removeQueueItem, moveQueueItem } from './rooms';
import { applyQueueEvent, currentItem, initialRoomQueueState } from './roomQueue';
import { Room, RoomQueueItem } from '@/types/room';
import { YouTubeVideo } from '@/types/youtube';

type Status = 'loading' | 'not-found' | 'ready';

// Loads a room by code, keeps its queue in sync over Supabase realtime,
// and exposes the queue mutations shared by host and guest.
export function useRoomQueue(code: string) {
  const [status, setStatus] = useState<Status>('loading');
  const [room, setRoom] = useState<Room | null>(null);
  const [state, dispatch] = useReducer(applyQueueEvent, initialRoomQueueState);

  // Mutations read the latest state without being re-created on every change
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await getRoomByCode(code);
      if (cancelled) return;
      if (!found) { setStatus('not-found'); return; }
      const items = await getQueueItems(found.id);
      if (cancelled) return;
      setRoom(found);
      dispatch({ type: 'loaded', roomId: found.id, items });
      setStatus('ready');
    })();
    return () => { cancelled = true; };
  }, [code]);

  // Supabase only honours non-PK filters on INSERT, so UPDATE and DELETE are
  // subscribed unfiltered and scoped to this room by applyQueueEvent.
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`queue-${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'queue_items', filter: `room_id=eq.${room.id}` },
        (payload) => dispatch({ type: 'inserted', item: payload.new as RoomQueueItem }))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queue_items' },
        (payload) => dispatch({ type: 'updated', item: payload.new as RoomQueueItem }))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'queue_items' },
        (payload) => dispatch({ type: 'deleted', id: (payload.old as { id: string }).id }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room]);

  const add = useCallback(async (video: YouTubeVideo, singerName: string | null, addedFrom: 'pc' | 'phone') => {
    if (!room) return;
    // The INSERT event adds it to the queue
    await addQueueItem(room.id, video, singerName, addedFrom);
  }, [room]);

  const remove = useCallback(async (itemId: string) => {
    dispatch({ type: 'deleted', id: itemId });
    await removeQueueItem(itemId);
  }, []);

  const move = useCallback(async (itemId: string, direction: 'up' | 'down') => {
    const before = stateRef.current.items;
    dispatch({ type: 'moved', id: itemId, direction });
    await moveQueueItem(itemId, direction, before);
  }, []);

  const play = useCallback((itemId: string) => {
    dispatch({ type: 'played', id: itemId });
  }, []);

  // Host only: the finished song leaves the queue and the next one starts
  const ended = useCallback(async () => {
    const itemId = stateRef.current.currentItemId;
    if (!itemId) return;
    dispatch({ type: 'ended' });
    await removeQueueItem(itemId);
  }, []);

  return {
    status,
    room,
    items: state.items,
    currentItemId: state.currentItemId,
    current: currentItem(state),
    add,
    remove,
    move,
    play,
    ended,
  };
}
