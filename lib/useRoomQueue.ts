'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ensureSession, supabase } from './supabase';
import { getRoomByCode, getQueueItems, addQueueItem, removeQueueItem, moveQueueItem, joinRoom } from './rooms';
import { readPinFromHash } from './invite';
import { applyQueueEvent, currentItem, initialRoomQueueState } from './roomQueue';
import { Room, RoomQueueItem } from '@/types/room';
import { YouTubeVideo } from '@/types/youtube';

// 'no-access' covers both a missing room and one we haven't joined:
// RLS deliberately makes them indistinguishable
type Status = 'loading' | 'no-access' | 'ready';

// Signs in, joins with the PIN from an invite link if there is one, loads
// the room by code, keeps its queue in sync over Supabase realtime,
// and exposes the queue mutations shared by host and guest.
export function useRoomQueue(code: string) {
  const [status, setStatus] = useState<Status>('loading');
  const [room, setRoom] = useState<Room | null>(null);
  const [state, dispatch] = useReducer(applyQueueEvent, initialRoomQueueState);

  // Mutations read the latest state without being re-created on every change
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Bumped by join() to reload once membership exists
  const [attempt, setAttempt] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSession();
      } catch {
        if (!cancelled) { setJoinError('SIGN_IN_FAILED'); setStatus('no-access'); }
        return;
      }
      const pin = readPinFromHash(window.location.hash);
      if (pin) {
        // Keep the PIN out of the address bar once it's been used
        history.replaceState(null, '', window.location.pathname + window.location.search);
        try {
          await joinRoom(code, pin);
        } catch (err) {
          if (!cancelled) setJoinError((err as Error).message);
        }
      }
      if (cancelled) return;
      const found = await getRoomByCode(code);
      if (cancelled) return;
      if (!found) { setStatus('no-access'); return; }
      const items = await getQueueItems(found.id);
      if (cancelled) return;
      setRoom(found);
      setJoinError(null);
      dispatch({ type: 'loaded', roomId: found.id, items });
      setStatus('ready');
    })();
    return () => { cancelled = true; };
  }, [code, attempt]);

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

  // Joins with a PIN typed on the no-access screen, then reloads the room
  const join = useCallback(async (pin: string) => {
    try {
      await joinRoom(code, pin);
    } catch (err) {
      setJoinError((err as Error).message);
      return;
    }
    setJoinError(null);
    setStatus('loading');
    setAttempt(n => n + 1);
  }, [code]);

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
    joinError,
    room,
    items: state.items,
    currentItemId: state.currentItemId,
    current: currentItem(state),
    add,
    remove,
    move,
    play,
    ended,
    join,
  };
}
