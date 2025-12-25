// YouTube API types
export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  thumbnail: string;
  duration: string;
}

export interface QueueItem extends YouTubeVideo {
  queueId: string;
  singerName?: string;
}

export interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
    };
  }>;
}

export interface YouTubeVideoDetailsResponse {
  items: Array<{
    contentDetails: {
      duration: string;
    };
  }>;
}
