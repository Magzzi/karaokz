import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeEntities, isAllowedChannel, isFullTrack, isoDurationSeconds, normalizeTitle, splitTitle } from './sources.ts';

const COVERSPH = 'UCaPwSXblS8F0owlKHGc6huw';

test('normalizeTitle flips CoversPH "SONG - Artist" and un-shouts it', () => {
  assert.equal(normalizeTitle('IKAW AT AKO - Johnoy Danao (KARAOKE VERSION)', COVERSPH), 'Johnoy Danao - Ikaw At Ako');
  assert.equal(normalizeTitle('HULING EL BIMBO - Eraserheads (KARAOKE VERSION)', COVERSPH), 'Eraserheads - Huling El Bimbo');
});

test('normalizeTitle drops hashtags and channel credits', () => {
  assert.equal(
    normalizeTitle('THE WINNER TAKES IT ALL - ABBA (KARAOKE VERSION) #karaoke #karaokeversions #abba', COVERSPH),
    'ABBA - The Winner Takes It All',
  );
  assert.equal(normalizeTitle('OH LALA BABY - Baby Dolls (KARAOKE VERSION) by CoversPH', COVERSPH), 'Baby Dolls - Oh Lala Baby');
});

test('normalizeTitle keeps the key variant', () => {
  assert.equal(
    normalizeTitle('TENSIONADO - Soapdish [FEMALE KEY] (KARAOKE VERSION) #coversph #femalekaraoke', COVERSPH),
    'Soapdish - Tensionado (Female Key)',
  );
});

test('normalizeTitle strips credits, version tags and glued key labels', () => {
  assert.equal(normalizeTitle('TENSIONADO - Soapdish | CoversPH (KARAOKE VERSION)', COVERSPH), 'Soapdish - Tensionado');
  assert.equal(normalizeTitle('ERE - Juan Karlos [CLEAN VERSION] (KARAOKE VERSION)', COVERSPH), 'Juan Karlos - Ere');
  assert.equal(normalizeTitle('TAHANAN - El Manu/FEMALEKEY (KARAOKE VERSION)', COVERSPH), 'El Manu - Tahanan (Female Key)');
  assert.equal(
    normalizeTitle("KAY TAGAL - Mark Carpio (You're The Best OST) (KARAOKE VERSION)", COVERSPH),
    "Mark Carpio (You're The Best OST) - Kay Tagal",
  );
});

test('normalizeTitle keeps a female version label', () => {
  assert.equal(
    normalizeTitle('HULING EL BIMBO - Eraserheads (KARAOKE/FEMALE VERSION)', COVERSPH),
    'Eraserheads - Huling El Bimbo (Female Version)',
  );
});

test('normalizeTitle handles a tag before the dash and escaped apostrophes', () => {
  assert.equal(normalizeTitle('Multo (Karaoke Version) - Stanza Part #multo #karaoke #opm', COVERSPH), 'Stanza Part - Multo');
  assert.equal(
    normalizeTitle('&#39;TIL THEY TAKE MY HEART AWAY - Clair Marlo (KARAOKE VERSION)', COVERSPH),
    "Clair Marlo - 'Til They Take My Heart Away",
  );
});

test('normalizeTitle without a dash splits where the shouted song name ends', () => {
  assert.equal(normalizeTitle('CHRISTMAS IN OUR HEARTS   Jose Marie Chan (KARAOKE VERSION) #karaoke', COVERSPH), 'Jose Marie Chan - Christmas In Our Hearts');
  assert.equal(normalizeTitle('PASKO NA (KARAOKE VERSION)', COVERSPH), 'Pasko Na');
  assert.equal(normalizeTitle("DON'T KNOW WHAT TO DO - Ronan Keating (KARAOKE VERSION)", COVERSPH), "Ronan Keating - Don't Know What To Do");
});

test('splitTitle reads canonical titles', () => {
  assert.deepEqual(splitTitle('Soapdish - Tensionado (Female Key)'), { artist: 'Soapdish', song: 'Tensionado (Female Key)' });
  assert.deepEqual(splitTitle('Up Dharma Down - Tadhana (Karaoke Version)'), { artist: 'Up Dharma Down', song: 'Tadhana' });
  assert.deepEqual(splitTitle('Happy Birthday'), { song: 'Happy Birthday', artist: null });
});

test('decodeEntities unescapes API titles', () => {
  assert.equal(decodeEntities('Guns N&#39; Roses &amp; Friends'), "Guns N' Roses & Friends");
});

test('only CoversPH is allowed', () => {
  assert.equal(isAllowedChannel(COVERSPH), true);
  assert.equal(isAllowedChannel('UCwTRjvjVge51X-ILJ4i22ew'), false); // Sing King
});

test('isFullTrack drops Shorts but keeps hashtagged full songs', () => {
  assert.equal(isFullTrack('THE WINNER TAKES IT ALL - ABBA (KARAOKE VERSION) #karaoke #abba', 250), true);
  assert.equal(isFullTrack('Syempre - Willie Revillame (Short Karaoke) #shorts', 50), false);
  assert.equal(isFullTrack('Some Song - Artist #shorts', 120), false);
  assert.equal(isFullTrack('Rihanna - Disturbia (Mini Karaoke)', 200), false);
  assert.equal(isFullTrack('Adele - Hello (Karaoke Version)', 45), false);
});

test('isoDurationSeconds parses API durations', () => {
  assert.equal(isoDurationSeconds('PT4M12S'), 252);
  assert.equal(isoDurationSeconds('PT1H2M'), 3720);
  assert.equal(isoDurationSeconds('P0D'), 0);
});
