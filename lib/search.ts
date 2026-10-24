import type { YouTubeVideo } from '@/types/youtube';
import { splitTitle } from './sources.ts';

// Ranks search results by how close they are to what the user typed, so a
// typo or partial title ("huling bimbo", "kathang isp") still finds the song.

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // strip accents: "Bublé" -> "Buble"
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // "(Female Key)" shouldn't count against a match
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// 1 = same word, 0 = nothing alike. A query word that starts a title word
// ("bimb" -> "bimbo") counts as a near match while typing.
function wordSimilarity(q: string, w: string): number {
  if (q === w) return 1;
  if (q.length >= 3 && w.startsWith(q)) return 0.9;
  return 1 - levenshtein(q, w) / Math.max(q.length, w.length);
}

/** How closely a canonical "Artist - Song" title matches the query, 0..1 */
export function similarity(query: string, title: string): number {
  const q = words(query);
  if (!q.length) return 0;
  const { song, artist } = splitTitle(title);
  const songWords = words(song);
  const artistWords = words(artist ?? '');

  // Each query word takes its best match; song words count fully, artist
  // words slightly less, so "adele hello" and "hello" both find Hello
  const best = (qw: string, ws: string[]) => Math.max(0, ...ws.map(w => wordSimilarity(qw, w)));
  const coverage = q.reduce((sum, qw) => sum + Math.max(best(qw, songWords), 0.85 * best(qw, artistWords)), 0) / q.length;

  // Word coverage gives up to 0.85; the rest is reserved for the query
  // matching the song name as a phrase, so the exact title ranks first
  const phrase = q.join(' ');
  const songText = normalize(song);
  const bonus = songText === phrase ? 0.15 : songText.includes(phrase) ? 0.1 : 0;
  const score = 0.85 * coverage + bonus;
  // Prefer the original over "(Female Key)"-style variants when otherwise equal
  const variant = /\(/.test(song) ? 0.02 : 0;
  return Math.max(0, Math.min(1, score) - variant);
}

/**
 * Keeps the closest results only: everything scoring at least `threshold`,
 * capped at `max`, but never fewer than `min` when that many came back.
 */
export function closestMatches(
  query: string,
  videos: YouTubeVideo[],
  { min = 5, max = 10, threshold = 0.6 } = {},
): YouTubeVideo[] {
  const ranked = videos
    .map((video, i) => ({ video, i, score: similarity(query, video.title) }))
    // Ties keep YouTube's own relevance order
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const strong = ranked.filter(r => r.score >= threshold).length;
  return ranked.slice(0, Math.min(max, Math.max(min, strong))).map(r => r.video);
}
