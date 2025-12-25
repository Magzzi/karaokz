import { YouTubeVideo, YouTubeSearchResponse, YouTubeVideoDetailsResponse } from '@/types/youtube';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Parse ISO 8601 duration format (PT#H#M#S) to readable format
 */
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

/**
 * Search YouTube videos for karaoke-friendly content
 */
export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    // Search for videos with relevance order, prioritizing music/karaoke content
    const searchUrl = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
      part: 'snippet',
      q: `${query} karaoke`,
      type: 'video',
      maxResults: '10',
      order: 'relevance',
      videoCategoryId: '10', // Music category
      key: YOUTUBE_API_KEY,
    });

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error('Failed to search YouTube');
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Get video details (duration) for all results
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
      part: 'contentDetails',
      id: videoIds,
      key: YOUTUBE_API_KEY,
    });

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();

    // Combine search results with duration data
    return searchData.items.map((item, index) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: parseDuration(detailsData.items[index]?.contentDetails.duration || 'PT0S'),
    }));
  } catch (error) {
    console.error('YouTube API error:', error);
    throw error;
  }
}
