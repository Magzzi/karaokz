import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { YouTubeVideo } from '@/types/youtube';
import { closestMatches, similarity } from './search.ts';

const video = (title: string, id = title): YouTubeVideo => ({ id, title, channelName: '', thumbnail: '', duration: '4:00' });

test('exact song title scores highest', () => {
  const exact = similarity('huling el bimbo', 'Eraserheads - Huling El Bimbo');
  const other = similarity('huling el bimbo', 'Eraserheads - Ligaya');
  assert.ok(exact > 0.95, `exact=${exact}`);
  assert.ok(other < 0.6, `other=${other}`);
});

test('typos and partial words still match', () => {
  assert.ok(similarity('kathang isp', 'Ben&Ben - Kathang Isip') > 0.7);
  assert.ok(similarity('huling bimb', 'Eraserheads - Huling El Bimbo') > 0.75);
  assert.ok(similarity('tadhanna', 'Up Dharma Down - Tadhana') > 0.7);
});

test('artist words help but the song name matters most', () => {
  const both = similarity('ben ben leaves', 'Ben&Ben - Leaves');
  const artistOnly = similarity('ben ben leaves', 'Ben&Ben - Kathang Isip');
  assert.ok(both > artistOnly);
});

test('accents and key labels do not hurt a match', () => {
  assert.ok(similarity('everything buble', 'Michael Bublé - Everything') > 0.75);
  assert.ok(similarity('tahanan', 'El Manu - Tahanan (Female Key)') > 0.95);
});

test('closestMatches ranks by similarity and keeps at most 10', () => {
  const pool = [
    video('Eraserheads - Ligaya'),
    video('Eraserheads - Huling El Bimbo (Female Version)'),
    ...Array.from({ length: 12 }, (_, i) => video(`Other Artist - Huling El Bimbo Cover ${i}`)),
    video('Eraserheads - Huling El Bimbo'),
  ];
  const out = closestMatches('huling el bimbo', pool);
  assert.equal(out.length, 10);
  assert.equal(out[0].title, 'Eraserheads - Huling El Bimbo');
  assert.equal(out[1].title, 'Eraserheads - Huling El Bimbo (Female Version)');
  assert.ok(!out.some(v => v.title === 'Eraserheads - Ligaya'));
});

test('closestMatches tops up to 5 when few results are strong', () => {
  const pool = ['A - Tadhana', 'B - Tahanan', 'C - Tagpuan', 'D - Buwan', 'E - Ere', 'F - Multo', 'G - Sana'].map(t => video(t));
  const out = closestMatches('tadhana', pool);
  assert.equal(out.length, 5);
  assert.equal(out[0].title, 'A - Tadhana');
});

test('closestMatches returns everything when fewer than 5 came back', () => {
  assert.equal(closestMatches('x', [video('A - One'), video('B - Two')]).length, 2);
});
