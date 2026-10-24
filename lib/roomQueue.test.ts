import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RoomQueueItem } from '@/types/room';
import { applyQueueEvent, currentItem, initialRoomQueueState, type RoomQueueEvent, type RoomQueueState } from './roomQueue.ts';

const ROOM = 'room-1';

function item(id: string, position: number, roomId = ROOM): RoomQueueItem {
  return {
    id,
    room_id: roomId,
    video_id: `vid-${id}`,
    title: id,
    channel_name: '',
    thumbnail: '',
    duration: '0:00',
    singer_name: null,
    position,
    is_played: false,
    is_playing: false,
    added_from: 'pc',
    added_at: '',
  };
}

function run(...events: RoomQueueEvent[]): RoomQueueState {
  return events.reduce(applyQueueEvent, initialRoomQueueState);
}

const ids = (s: RoomQueueState) => s.items.map(i => i.id);

test('loaded sorts by position and autoplays the first item', () => {
  const s = run({ type: 'loaded', roomId: ROOM, items: [item('b', 1), item('a', 0)] });
  assert.deepEqual(ids(s), ['a', 'b']);
  assert.equal(s.currentItemId, 'a');
});

test('loading an empty queue plays nothing', () => {
  const s = run({ type: 'loaded', roomId: ROOM, items: [] });
  assert.equal(s.currentItemId, null);
  assert.equal(currentItem(s), null);
});

test('insert into an empty queue autoplays it', () => {
  const s = run({ type: 'loaded', roomId: ROOM, items: [] }, { type: 'inserted', item: item('a', 0) });
  assert.equal(s.currentItemId, 'a');
});

test('insert while playing keeps the current item', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0)] },
    { type: 'inserted', item: item('b', 1) },
  );
  assert.deepEqual(ids(s), ['a', 'b']);
  assert.equal(s.currentItemId, 'a');
});

test('duplicate insert is ignored', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0)] },
    { type: 'inserted', item: item('a', 0) },
  );
  assert.deepEqual(ids(s), ['a']);
});

test('updates from other rooms are ignored', () => {
  const loaded = run({ type: 'loaded', roomId: ROOM, items: [item('a', 0)] });
  const s = applyQueueEvent(loaded, { type: 'updated', item: { ...item('a', 5, 'other'), title: 'x' } });
  assert.equal(s, loaded);
});

test('update re-sorts by position', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1)] },
    { type: 'updated', item: item('a', 2) },
  );
  assert.deepEqual(ids(s), ['b', 'a']);
});

test('delete of an unknown id (another room) is a no-op', () => {
  const loaded = run({ type: 'loaded', roomId: ROOM, items: [item('a', 0)] });
  assert.equal(applyQueueEvent(loaded, { type: 'deleted', id: 'zzz' }), loaded);
});

test('deleting the playing item advances to the next one', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1), item('c', 2)] },
    { type: 'deleted', id: 'a' },
  );
  assert.deepEqual(ids(s), ['b', 'c']);
  assert.equal(s.currentItemId, 'b');
});

test('deleting a non-playing item keeps the current item', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1)] },
    { type: 'deleted', id: 'b' },
  );
  assert.equal(s.currentItemId, 'a');
});

test('ended removes the current item and plays the next', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1)] },
    { type: 'ended' },
  );
  assert.deepEqual(ids(s), ['b']);
  assert.equal(s.currentItemId, 'b');
});

test('the DELETE echo after ended is a no-op', () => {
  const ended = run({ type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1)] }, { type: 'ended' });
  assert.equal(applyQueueEvent(ended, { type: 'deleted', id: 'a' }), ended);
});

test('ended on the last item leaves nothing playing', () => {
  const s = run({ type: 'loaded', roomId: ROOM, items: [item('a', 0)] }, { type: 'ended' });
  assert.deepEqual(ids(s), []);
  assert.equal(s.currentItemId, null);
});

test('played jumps to an item; ended then plays the head of the queue', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1), item('c', 2)] },
    { type: 'played', id: 'c' },
  );
  assert.equal(currentItem(s)?.video_id, 'vid-c');
  const after = applyQueueEvent(s, { type: 'ended' });
  assert.deepEqual(ids(after), ['a', 'b']);
  assert.equal(after.currentItemId, 'a');
});

test('moved swaps positions with the neighbour', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1), item('c', 2)] },
    { type: 'moved', id: 'c', direction: 'up' },
  );
  assert.deepEqual(ids(s), ['a', 'c', 'b']);
  assert.deepEqual(s.items.map(i => i.position), [0, 1, 2]);
});

test('moving past either end is a no-op', () => {
  const loaded = run({ type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1)] });
  assert.equal(applyQueueEvent(loaded, { type: 'moved', id: 'a', direction: 'up' }), loaded);
  assert.equal(applyQueueEvent(loaded, { type: 'moved', id: 'b', direction: 'down' }), loaded);
});

test('loaded follows the item the host marked as playing', () => {
  const s = run({ type: 'loaded', roomId: ROOM, items: [item('a', 0), { ...item('b', 1), is_playing: true }] });
  assert.equal(s.currentItemId, 'b');
});

test('an is_playing update moves the cursor (host jumped to another song)', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), item('b', 1), item('c', 2)] },
    { type: 'updated', item: { ...item('c', 2), is_playing: true } },
  );
  assert.equal(s.currentItemId, 'c');
});

test('clearing is_playing alone does not move the cursor', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [{ ...item('a', 0), is_playing: true }, item('b', 1)] },
    { type: 'updated', item: item('a', 0) },
  );
  assert.equal(s.currentItemId, 'a');
});

test('a guest skip (delete of the playing item) advances to the next song', () => {
  const s = run(
    { type: 'loaded', roomId: ROOM, items: [item('a', 0), { ...item('b', 1), is_playing: true }, item('c', 2)] },
    { type: 'deleted', id: 'b' },
  );
  assert.equal(s.currentItemId, 'a');
});
