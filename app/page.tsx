'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import YouTubePlayer from '@/components/YouTubePlayer';
import YouTubeSearch from '@/components/YouTubeSearch';
import Queue from '@/components/Queue';
import { QueueItem, YouTubeVideo } from '@/types/youtube';
import { Music, Settings } from 'lucide-react';

const STORAGE_KEY = 'karaoke-state';

/**
 * Main Karaoke App Page
 * Manages the queue, current playing video, and search functionality
 */
export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { queue: savedQueue, currentVideoId: savedVideoId, currentQueueId: savedQueueId } = JSON.parse(savedState);
        setQueue(savedQueue || []);
        setCurrentVideoId(savedVideoId || null);
        setCurrentQueueId(savedQueueId || null);
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return; // Don't save during initial hydration
    
    try {
      const state = {
        queue,
        currentVideoId,
        currentQueueId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [queue, currentVideoId, currentQueueId, isHydrated]);

  /**
   * Add a video to the queue
   */
  const handleAddToQueue = useCallback((video: YouTubeVideo) => {
    const queueItem: QueueItem = {
      ...video,
      queueId: `${video.id}-${Date.now()}`, // Unique queue ID
    };

    setQueue((prev) => {
      // Only auto-play if queue is empty and no video is playing
      if (prev.length === 0 && !currentVideoId) {
        setCurrentVideoId(queueItem.id);
        setCurrentQueueId(queueItem.queueId);
      }
      return [...prev, queueItem];
    });
  }, [currentVideoId]);

  /**
   * Play a specific song from the queue
   */
  const handlePlaySong = useCallback((queueId: string) => {
    const song = queue.find((item) => item.queueId === queueId);
    if (song) {
      setCurrentVideoId(song.id);
      setCurrentQueueId(queueId);
    }
  }, [queue]);

  /**
   * Remove a song from the queue
   */
  const handleRemoveSong = useCallback((queueId: string) => {
    setQueue((prev) => prev.filter((item) => item.queueId !== queueId));

    // If we removed the currently playing song, play the next one
    if (currentQueueId === queueId) {
      handleVideoEnd();
    }
  }, [currentQueueId]);

  /**
   * Handle video end - automatically play next song
   */
  const handleVideoEnd = useCallback(() => {
    // Remove the finished song from queue
    const currentIndex = queue.findIndex((item) => item.queueId === currentQueueId);
    
    if (currentIndex !== -1) {
      // Remove current song
      const updatedQueue = queue.filter((item) => item.queueId !== currentQueueId);
      setQueue(updatedQueue);

      // Play next song if available
      if (updatedQueue.length > 0) {
        const nextSong = updatedQueue[0]; // Always play first in queue
        setCurrentVideoId(nextSong.id);
        setCurrentQueueId(nextSong.queueId);
      } else {
        // Queue is empty
        setCurrentVideoId(null);
        setCurrentQueueId(null);
      }
    }
  }, [queue, currentQueueId]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <motion.header 
        className="glass border-b border-border/50 shrink-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground font-mono">
                KaraOkz
              </h1>
            </div>
            <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Left Panel: Player (2 columns on desktop) */}
            <motion.div 
              className="lg:col-span-2 h-full min-h-75 lg:min-h-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <YouTubePlayer videoId={currentVideoId} onVideoEnd={handleVideoEnd} />
            </motion.div>

            {/* Right Panel: Search + Queue (1 column on desktop) */}
            <motion.div 
              className="h-full flex flex-col gap-4 overflow-hidden"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* Search */}
              <YouTubeSearch onAddToQueue={handleAddToQueue} />

              {/* Queue */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <Queue
                  queue={queue}
                  currentVideoId={currentVideoId}
                  onPlaySong={handlePlaySong}
                  onRemoveSong={handleRemoveSong}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
