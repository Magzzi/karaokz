import { YouTubeVideo, YouTubeSearchResponse, YouTubeVideoDetailsResponse } from '@/types/youtube';
import { addQuotaUsage, QUOTA_COST } from '@/lib/quota';

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

export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) throw new Error('KEY_MISSING');

  const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: `${query} karaoke`,
    type: 'video',
    maxResults: '10',
    order: 'relevance',
    videoCategoryId: '10',
    key: YOUTUBE_API_KEY,
  });

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    const body = await searchResponse.json().catch(() => ({}));
    throw parseApiError(searchResponse.status, body);
  }

  const searchData: YouTubeSearchResponse = await searchResponse.json();
  if (!searchData.items?.length) return [];

  const videoIds = searchData.items.map(item => item.id.videoId).join(',');
  const detailsUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'contentDetails',
    id: videoIds,
    key: YOUTUBE_API_KEY,
  });

  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    const body = await detailsResponse.json().catch(() => ({}));
    throw parseApiError(detailsResponse.status, body);
  }

  const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();

  addQuotaUsage(QUOTA_COST.search);

  return searchData.items.map((item, index) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: parseDuration(detailsData.items[index]?.contentDetails.duration || 'PT0S'),
  }));
}

// Fetch a single video's details by ID (used by the URL/ID manual input)
export async function fetchVideoById(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) throw new Error('KEY_MISSING');

  const url = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'snippet,contentDetails',
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

  return {
    id: videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
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
