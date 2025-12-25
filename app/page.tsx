'use client';

import { useState, useCallback } from 'react';
import YouTubePlayer from '@/components/YouTubePlayer';
import YouTubeSearch from '@/components/YouTubeSearch';
import Queue from '@/components/Queue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { QueueItem, YouTubeVideo } from '@/types/youtube';
import { Search, Mic2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Main Karaoke App Page
 * Manages the queue, current playing video, and search functionality
 */
export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Karaoke Night
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Search, queue, and sing along!</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto p-4 h-full">
          {/* Desktop Layout: Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6 h-full">
          {/* Left Panel: Player */}
          <div className="h-full">
            <YouTubePlayer videoId={currentVideoId} onVideoEnd={handleVideoEnd} />
          </div>

          {/* Right Panel: Search + Queue */}
          <div className="h-full flex flex-col gap-6 overflow-hidden">
            {/* Search */}
            <Card className="shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Songs
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <YouTubeSearch onAddToQueue={handleAddToQueue} />
              </CardContent>
            </Card>

            {/* Queue */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Queue
                queue={queue}
                currentVideoId={currentVideoId}
                onPlaySong={handlePlaySong}
                onRemoveSong={handleRemoveSong}
              />
            </div>
          </div>
        </div>

          {/* Mobile/Tablet Layout: Stacked */}
          <div className="lg:hidden h-full flex flex-col gap-4 overflow-hidden">
            {/* Player */}
            <div className="aspect-video w-full shrink-0">
            <YouTubePlayer videoId={currentVideoId} onVideoEnd={handleVideoEnd} />
          </div>

            {/* Search */}
            <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                Search Songs
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <YouTubeSearch onAddToQueue={handleAddToQueue} />
            </CardContent>
          </Card>

            {/* Queue */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Queue
                queue={queue}
                currentVideoId={currentVideoId}
                onPlaySong={handlePlaySong}
                onRemoveSong={handleRemoveSong}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
