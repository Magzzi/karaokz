import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInviteUrl, normalizePin, parseInvite, readPinFromHash } from './invite.ts';

test('parseInvite reads code and PIN from a full invite URL', () => {
  assert.deepEqual(
    parseInvite('https://karaokz.vercel.app/room/NOVA-07/add#pin=K7QX2M'),
    { code: 'NOVA-07', pin: 'K7QX2M' },
  );
});

test('parseInvite accepts URLs without a PIN', () => {
  assert.deepEqual(parseInvite('https://karaokz.vercel.app/room/NOVA-07/add'), { code: 'NOVA-07', pin: null });
  assert.deepEqual(parseInvite('http://192.168.1.5:3000/room/beat-42'), { code: 'BEAT-42', pin: null });
});

test('parseInvite accepts a bare code in any case', () => {
  assert.deepEqual(parseInvite('  nova-07 '), { code: 'NOVA-07', pin: null });
});

test('parseInvite ignores a malformed PIN but keeps the code', () => {
  assert.deepEqual(parseInvite('https://x.app/room/NOVA-07/add#pin=nope'), { code: 'NOVA-07', pin: null });
});

test('parseInvite rejects text without a room code', () => {
  assert.equal(parseInvite(''), null);
  assert.equal(parseInvite('hello world'), null);
  assert.equal(parseInvite('https://example.com/rooms/list'), null);
  assert.equal(parseInvite('NOVA-7'), null);
});

test('buildInviteUrl round-trips through parseInvite', () => {
  const url = buildInviteUrl('https://karaokz.vercel.app', 'nova-07', 'K7QX2M');
  assert.equal(url, 'https://karaokz.vercel.app/room/NOVA-07/add#pin=K7QX2M');
  assert.deepEqual(parseInvite(url), { code: 'NOVA-07', pin: 'K7QX2M' });
});

test('readPinFromHash handles missing, extra and encoded params', () => {
  assert.equal(readPinFromHash(''), null);
  assert.equal(readPinFromHash('#'), null);
  assert.equal(readPinFromHash('#foo=bar'), null);
  assert.equal(readPinFromHash('#foo=bar&pin=k7qx2m'), 'K7QX2M');
  assert.equal(readPinFromHash('pin=K7QX2M'), 'K7QX2M');
  assert.equal(readPinFromHash('#pin=K7Q%20X2M'), 'K7QX2M');
});

test('normalizePin uppercases and strips spaces and dashes', () => {
  assert.equal(normalizePin('k7q x2m'), 'K7QX2M');
  assert.equal(normalizePin('K7Q-X2M'), 'K7QX2M');
});

test('normalizePin rejects wrong length and ambiguous characters', () => {
  assert.equal(normalizePin('K7QX2'), null);
  assert.equal(normalizePin('K7QX2MM'), null);
  assert.equal(normalizePin('K7QX2O'), null); // O is not in the alphabet
  assert.equal(normalizePin('K7QX21'), null); // nor is 1
});
