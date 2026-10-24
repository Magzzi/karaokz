type TitleOrder = 'artist-song' | 'song-artist';

// Songs can only be searched for or added from these YouTube channels.
// Each channel costs one search.list call (100 quota units) per search, and
// must allow embedding (Sing King was dropped: ~98% of its uploads block it).
// titleOrder says how the channel writes titles: "Artist - Song" or "SONG - Artist".
export const ALLOWED_CHANNELS: readonly { id: string; name: string; titleOrder: TitleOrder }[] = [
  { id: 'UCaPwSXblS8F0owlKHGc6huw', name: 'CoversPH', titleOrder: 'song-artist' },
];

export function isAllowedChannel(channelId: string): boolean {
  return ALLOWED_CHANNELS.some(c => c.id === channelId);
}

export const ALLOWED_CHANNEL_NAMES = ALLOWED_CHANNELS.map(c => c.name).join(' and ');

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&#39;': "'",
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
};

// The Data API returns snippet titles HTML-escaped
export function decodeEntities(text: string): string {
  return text.replace(/&(amp|#39|quot|lt|gt);/g, m => ENTITIES[m]);
}

// "IKAW AT AKO" -> "Ikaw At Ako"; mixed-case text is left alone
function unshout(text: string): string {
  if (text !== text.toUpperCase() || !/[A-Z]/.test(text)) return text;
  return text.toLowerCase().replace(/(^'?|[\s(/-]'?)(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

/**
 * Rewrites a channel's raw upload title into the app's canonical
 * "Artist - Song (Version)" form, so display code only knows one format.
 * Drops hashtags, handles, "(Karaoke Version)"-style tags and channel credits;
 * keeps key variants such as "Female Key" or "Female Version".
 */
export function normalizeTitle(raw: string, channelId: string): string {
  const order: TitleOrder = ALLOWED_CHANNELS.find(c => c.id === channelId)?.titleOrder ?? 'artist-song';
  let text = decodeEntities(raw);

  const keyMatch = text.match(/\b((?:lower |higher )?(?:fe)?male|lower|higher) ?(key|version)\b/i);
  const key = keyMatch ? `${keyMatch[1]} ${keyMatch[2]}` : null;

  text = text
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/@[\w.-]+/g, '')
    .replace(/\s*\|.*$/, '') // "... | CoversPH", "... | OPM Ballad"
    .replace(/\bby coversph\b/gi, '')
    .replace(/\s*[([][^)\]]*(karaoke|instrumental|lyrics|key|version)[^)\]]*[)\]]/gi, '')
    .replace(/[\s/]*\b((?:lower |higher )?(?:fe)?male|lower|higher) ?key\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let parts = text.split(/\s+[-–]\s+/).map(p => p.trim()).filter(Boolean);
  // No dash: "SONG IN CAPS Artist Name" still splits where the caps end
  if (parts.length < 2 && order === 'song-artist') {
    const m = text.match(/^([^a-z]+?)\s+(\p{Lu}\p{Ll}.*)$/u);
    if (m) parts = [m[1], m[2]];
  }
  const version = key ? ` (${unshout(key.toUpperCase())})` : '';
  if (parts.length < 2) return unshout(parts[0] ?? text) + version;

  // Channels shout the song name, but artist casing (ABBA, Ben&Ben) is meaningful
  const [first, ...rest] = parts;
  const song = unshout(order === 'song-artist' ? first : rest.join(' - '));
  const artist = order === 'song-artist' ? rest.join(' - ') : first;
  return `${artist} - ${song}${version}`;
}

// Canonical titles look like "Artist - Song (Version)"
export function splitTitle(title: string): { song: string; artist: string | null } {
  const clean = title
    .replace(/\s*[([][^)\]]*(karaoke|instrumental|lyrics)[^)\]]*[)\]]/gi, '')
    .trim();
  const dash = clean.indexOf(' - ');
  if (dash === -1) return { song: clean, artist: null };
  return { artist: clean.slice(0, dash).trim(), song: clean.slice(dash + 3).trim() };
}

// Channels also post Shorts and "mini karaoke" clips; search keeps only full tracks.
// Hashtags alone don't disqualify a title: CoversPH tags full songs too.
export function isFullTrack(title: string, seconds: number): boolean {
  if (seconds > 0 && seconds < 90) return false;
  return !/#shorts?\b|\b(mini|short) karaoke\b/i.test(title);
}

// ISO 8601 duration from the Data API ("PT4M12S") to seconds
export function isoDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}
