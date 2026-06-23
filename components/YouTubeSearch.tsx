'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchYouTubeVideos, fetchVideoById, extractVideoId, getApiErrorMessage } from '@/lib/youtube';
import { YouTubeVideo } from '@/types/youtube';
import { Search, Link, Plus, Loader2, AlertTriangle } from 'lucide-react';

interface YouTubeSearchProps {
  onAddToQueue: (video: YouTubeVideo) => void;
}

type Mode = 'search' | 'url';

export default function YouTubeSearch({ onAddToQueue }: YouTubeSearchProps) {
  const [mode, setMode] = useState<Mode>('search');

  // Search mode state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<{ message: string; isQuotaError: boolean } | null>(null);

  // URL mode state
  const [urlInput, setUrlInput] = useState('');
  const [urlVideo, setUrlVideo] = useState<YouTubeVideo | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setResults([]);

    try {
      const videos = await searchYouTubeVideos(query);
      setResults(videos);
      if (videos.length === 0) {
        setSearchError({ message: 'No results found. Try a different search term.', isQuotaError: false });
      }
    } catch (err) {
      const parsed = getApiErrorMessage(err);
      setSearchError(parsed);
      if (parsed.isQuotaError) setMode('url');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
      setUrlError('Paste a YouTube URL or a video ID (11 characters).');
      return;
    }

    setUrlLoading(true);
    setUrlError(null);
    setUrlVideo(null);

    try {
      const video = await fetchVideoById(videoId);
      if (!video) {
        setUrlError('Video not found. Make sure the URL or ID is correct.');
      } else {
        setUrlVideo(video);
      }
    } catch (err) {
      const parsed = getApiErrorMessage(err);
      setUrlError(parsed.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleAddUrl = () => {
    if (!urlVideo) return;
    onAddToQueue(urlVideo);
    setUrlVideo(null);
    setUrlInput('');
  };

  return (
    <div className="glass rounded-lg p-3 sm:p-4 md:p-5 shrink-0">
      {/* Header + mode toggle */}
      <div className="mb-2 sm:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="text-xs sm:text-sm font-semibold text-foreground font-mono uppercase tracking-wide">
            Add Songs
          </h2>
        </div>

        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          <button
            onClick={() => setMode('search')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
              mode === 'search'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-2.5 w-2.5" />
            Search
          </button>
          <button
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
              mode === 'url'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link className="h-2.5 w-2.5" />
            URL
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── SEARCH MODE ── */}
        {mode === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Song or artist name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 sm:pl-9 pr-4 bg-muted border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 font-mono text-xs h-8 sm:h-9 md:h-10"
              />
              {searchLoading && (
                <Loader2 className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
              )}
            </form>

            {searchError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-2 flex items-start gap-2 px-3 py-2 rounded text-xs border ${
                  searchError.isQuotaError
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="font-mono">{searchError.message}</span>
              </motion.div>
            )}

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
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded shrink-0"
                      />
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
          </motion.div>
        )}

        {/* ── URL / ID MODE ── */}
        {mode === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleFetchUrl} className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="YouTube URL or video ID..."
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setUrlVideo(null); setUrlError(null); }}
                  className="pl-8 bg-muted border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 font-mono text-xs h-8 sm:h-9 md:h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={urlLoading || !urlInput.trim()}
                className="h-8 sm:h-9 md:h-10 px-3 bg-primary hover:bg-primary/90 font-mono text-xs shrink-0"
              >
                {urlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Fetch'}
              </Button>
            </form>

            <p className="mt-1.5 text-[9px] sm:text-[10px] text-muted-foreground font-mono">
              Paste any YouTube link or bare ID — works even when search quota is exhausted
            </p>

            {urlError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="font-mono">{urlError}</span>
              </motion.div>
            )}

            <AnimatePresence>
              {urlVideo && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-3 flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border border-primary/20"
                >
                  <img
                    src={urlVideo.thumbnail}
                    alt={urlVideo.title}
                    className="w-16 h-10 object-cover rounded shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-mono text-xs font-semibold text-foreground leading-tight truncate">
                      {urlVideo.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground truncate">{urlVideo.channelName}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                        {urlVideo.duration}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddUrl}
                    className="h-7 px-2.5 bg-primary hover:bg-primary/90 font-mono text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
