'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface YouTubePlayerProps {
  videoId: string | null;
  onVideoEnd: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * YouTube Player Component
 * Uses YouTube IFrame Player API for better control over playback
 */
export default function YouTubePlayer({ videoId, onVideoEnd }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const onVideoEndRef = useRef(onVideoEnd);

  // Keep onVideoEnd ref updated
  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoEnd]);

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isApiReady || playerRef.current) return;

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId: videoId || '',
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        fs: 1,
      },
      events: {
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            onVideoEndRef.current();
          }
        },
      },
    });

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, videoId]);

  // Update video when videoId changes
  useEffect(() => {
    if (playerRef.current?.loadVideoById && videoId) {
      const currentVideo = playerRef.current.getVideoData?.()?.video_id;
      // Only load if it's a different video
      if (currentVideo !== videoId) {
        playerRef.current.loadVideoById(videoId);
      }
    }
  }, [videoId]);

  return (
    <Card className="w-full h-full overflow-hidden bg-black dark:bg-gray-950">
      {videoId ? (
        <div id="youtube-player" className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center space-y-4">
            <svg
              className="mx-auto h-24 w-24 text-gray-600 dark:text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-300 dark:text-gray-600">No video playing</h3>
              <p className="text-sm">Search and add songs to the queue to get started</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
