'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Play } from 'lucide-react';

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
 * Audio Visualizer Bars Component
 */
function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((bar) => (
        <motion.div
          key={bar}
          className="w-1 bg-primary rounded-sm"
          animate={isPlaying ? {
            height: ['8px', '16px', '8px', '12px', '8px'],
          } : {
            height: '8px',
          }}
          transition={isPlaying ? {
            duration: 0.8,
            repeat: Infinity,
            delay: bar * 0.1,
            ease: 'easeInOut',
          } : {}}
        />
      ))}
    </div>
  );
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
    <div className="glass rounded-lg w-full h-full overflow-hidden flex flex-col">
      {videoId ? (
        <>
          <div id="youtube-player" className="w-full flex-1" />
          {/* Status Bar */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">Now playing</span>
            <AudioVisualizer isPlaying={true} />
          </div>
        </>
      ) : (
        <>
          <div className="w-full flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3 sm:space-y-6">
              {/* Microphone Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-muted/60 mx-auto flex items-center justify-center">
                <Mic className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-muted-foreground" />
              </div>
              
              {/* Text */}
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-mono">
                  No Song Playing
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-[200px] sm:max-w-xs mx-auto">
                  Search for a song and add it to the queue to get the party started!
                </p>
              </div>
              
              {/* CTA Button */}
              <button className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-md bg-primary text-primary-foreground font-mono text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity glow-primary">
                <Play size={14} className="sm:hidden" />
                <Play size={16} className="hidden sm:block" />
                Pick a Song
              </button>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">Ready to play</span>
            <AudioVisualizer isPlaying={false} />
          </div>
        </>
      )}
    </div>
  );
}
