'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchYouTubeVideos } from '@/lib/youtube';
import { YouTubeVideo } from '@/types/youtube';
import { Search, Plus, Loader2 } from 'lucide-react';

interface YouTubeSearchProps {
  onAddToQueue: (video: YouTubeVideo) => void;
}

/**
 * YouTube Search Component
 * Allows users to search for karaoke videos and add them to the queue
 */
export default function YouTubeSearch({ onAddToQueue }: YouTubeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const videos = await searchYouTubeVideos(query);
      setResults(videos);
    } catch (err) {
      setError('Failed to search. Please check your API key configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-lg p-3 sm:p-4 md:p-5 shrink-0">
      {/* Header */}
      <div className="mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="text-xs sm:text-sm font-semibold text-foreground font-mono uppercase tracking-wide">
            Search Songs
          </h2>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Song or artist name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 sm:pl-9 pr-4 bg-muted border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 font-mono text-xs h-8 sm:h-9 md:h-10"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
        )}
      </form>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded text-xs"
        >
          {error}
        </motion.div>
      )}

      {/* Search Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 sm:mt-4 space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-56 md:max-h-64 overflow-y-auto"
          >
            {results.map((video, index) => (
              <motion.div 
                key={video.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2.5 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors group"
              >
                {/* Thumbnail */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded shrink-0"
                />
                
                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-mono text-[10px] sm:text-xs font-semibold text-foreground leading-tight truncate">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{video.channelName}</span>
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 font-mono hidden sm:inline-flex">
                      {video.duration}
                    </Badge>
                  </div>
                </div>
                
                {/* Add Button */}
                <Button
                  size="sm"
                  onClick={() => onAddToQueue(video)}
                  className="w-6 h-6 sm:w-7 sm:h-7 p-0 bg-primary hover:bg-primary/90 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
