import { YouTubeVideo, YouTubeSearchResponse, YouTubeVideoDetailsResponse } from '@/types/youtube';
import { addQuotaUsage, QUOTA_COST } from '@/lib/quota';
import { ALLOWED_CHANNELS, ALLOWED_CHANNEL_NAMES, channelName, isAllowedChannel, isFullTrack, isoDurationSeconds, normalizeTitle } from '@/lib/sources';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Parses YouTube API error responses into user-friendly messages
function parseApiError(status: number, body: { error?: { errors?: { reason?: string }[] } }): Error {
  if (status === 403) {
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
      return new Error('QUOTA_EXCEEDED');
    }
    if (reason === 'keyInvalid' || reason === 'accessNotConfigured') {
      return new Error('KEY_INVALID');
    }
    return new Error('KEY_RESTRICTED');
  }
  if (status === 400) return new Error('BAD_REQUEST');
  return new Error('API_ERROR');
}

// Searches every allowed channel (one search.list call each) and merges the results
export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) throw new Error('KEY_MISSING');
  const perChannel = await Promise.all(ALLOWED_CHANNELS.map(c => searchChannel(query, c.id, YOUTUBE_API_KEY)));
  // Interleave so each channel's best matches come first
  const merged: YouTubeVideo[] = [];
  for (let i = 0; i < Math.max(...perChannel.map(r => r.length)); i++) {
    for (const results of perChannel) if (results[i]) merged.push(results[i]);
  }
  return merged;
}

async function searchChannel(query: string, channelId: string, key: string): Promise<YouTubeVideo[]> {
  const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    channelId,
    type: 'video',
    // Many karaoke uploads block playback outside youtube.com; skip those
    videoEmbeddable: 'true',
    maxResults: '25',
    order: 'relevance',
    key,
  });

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    const body = await searchResponse.json().catch(() => ({}));
    throw parseApiError(searchResponse.status, body);
  }

  const searchData: YouTubeSearchResponse = await searchResponse.json();
  addQuotaUsage(QUOTA_COST.search);
  const items = (searchData.items ?? []).filter(item => isAllowedChannel(item.snippet.channelId));
  if (!items.length) return [];

  const detailsUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'contentDetails',
    id: items.map(item => item.id.videoId).join(','),
    key,
  });

  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    const body = await detailsResponse.json().catch(() => ({}));
    throw parseApiError(detailsResponse.status, body);
  }

  const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();
  const durations = new Map(detailsData.items.map(d => [d.id, d.contentDetails.duration]));

  return items
    .map(item => ({ item, iso: durations.get(item.id.videoId) || 'PT0S' }))
    .filter(({ item, iso }) => isFullTrack(item.snippet.title, isoDurationSeconds(iso)))
    .map(({ item, iso }) => ({
      id: item.id.videoId,
      title: normalizeTitle(item.snippet.title, item.snippet.channelId),
      channelName: channelName(item.snippet.channelId, item.snippet.channelTitle),
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: parseDuration(iso),
    }));
}

// Fetch a single video's details by ID (used by the URL/ID manual input)
export async function fetchVideoById(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) throw new Error('KEY_MISSING');

  const url = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'snippet,contentDetails,status',
    id: videoId,
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw parseApiError(response.status, body);
  }

  const data = await response.json();
  if (!data.items?.length) return null;

  const item = data.items[0];
  addQuotaUsage(QUOTA_COST.videoFetch);
  if (!isAllowedChannel(item.snippet.channelId)) throw new Error('CHANNEL_NOT_ALLOWED');
  if (item.status?.embeddable === false) throw new Error('NOT_EMBEDDABLE');

  return {
    id: videoId,
    title: normalizeTitle(item.snippet.title, item.snippet.channelId),
    channelName: channelName(item.snippet.channelId, item.snippet.channelTitle),
    thumbnail:
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      '',
    duration: parseDuration(item.contentDetails.duration),
  };
}

// Extracts a YouTube video ID from a URL or returns the bare ID if valid
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // youtube.com/watch?v=ID or &v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // /embed/ID
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

// Translate error codes to human-readable UI strings
export function getApiErrorMessage(error: unknown): { message: string; isQuotaError: boolean } {
  const code = error instanceof Error ? error.message : 'API_ERROR';
  switch (code) {
    case 'QUOTA_EXCEEDED':
      return {
        message: 'Daily quota reached (10,000 units). Use the URL tab to add songs directly.',
        isQuotaError: true,
      };
    case 'CHANNEL_NOT_ALLOWED':
      return { message: `Only songs from ${ALLOWED_CHANNEL_NAMES} can be added.`, isQuotaError: false };
    case 'NOT_EMBEDDABLE':
      return { message: "The owner blocks this video from playing outside YouTube, so it can't play here.", isQuotaError: false };
    case 'KEY_MISSING':
      return { message: 'YouTube API key is not configured.', isQuotaError: false };
    case 'KEY_INVALID':
      return { message: 'API key is invalid. Check your .env.local file.', isQuotaError: false };
    case 'KEY_RESTRICTED':
      return { message: 'API key is restricted to a different domain.', isQuotaError: false };
    default:
      return { message: 'Search failed. Check your connection and try again.', isQuotaError: false };
  }
}
