'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchYouTubeVideos, fetchVideoById, extractVideoId, getApiErrorMessage } from '@/lib/youtube';
import { getRoomByCode, addQueueItem } from '@/lib/rooms';
import { Room } from '@/types/room';
import { YouTubeVideo } from '@/types/youtube';
import { Music, Search, Link, Plus, Loader2, Check, AlertTriangle, Pencil } from 'lucide-react';

type SearchMode = 'search' | 'url';

export default function AddSongPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const singerKey = `karaoke-singer-${code.toUpperCase()}`;
  const [singerName, setSingerName] = useState('');
  const [editingSinger, setEditingSinger] = useState(false);
  const [singerInput, setSingerInput] = useState('');

  const [mode, setMode] = useState<SearchMode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<{ message: string; isQuotaError: boolean } | null>(null);

  const [urlInput, setUrlInput] = useState('');
  const [urlVideo, setUrlVideo] = useState<YouTubeVideo | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(singerKey) ?? '';
    setSingerName(stored);
    if (!stored) setEditingSinger(true);
  }, [singerKey]);

  useEffect(() => {
    getRoomByCode(code).then(found => {
      if (!found) setNotFound(true);
      else setRoom(found);
      setLoading(false);
    });
  }, [code]);

  // iOS-safe scroll: use window.scrollTo with getBoundingClientRect
  useEffect(() => {
    if (results.length > 0 && resultsRef.current) {
      setTimeout(() => {
        const el = resultsRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 200);
    }
  }, [results]);

  const saveSingerName = () => {
    const name = singerInput.trim();
    setSingerName(name);
    localStorage.setItem(singerKey, name);
    setEditingSinger(false);
  };

  const handleAdd = useCallback(async (video: YouTubeVideo) => {
    if (!room) return;
    await addQueueItem(room.id, video, singerName || null, 'phone');
    setLastAdded(video.title);
    setTimeout(() => setLastAdded(null), 3000);
  }, [room, singerName]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Dismiss iOS keyboard before results load
    (e.currentTarget as HTMLFormElement).querySelector('input')?.blur();
    setSearchLoading(true);
    setSearchError(null);
    setResults([]);
    try {
      const videos = await searchYouTubeVideos(query);
      setResults(videos);
      if (!videos.length) setSearchError({ message: 'No results found.', isQuotaError: false });
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
    if (!videoId) { setUrlError('Paste a YouTube URL or a video ID (11 characters).'); return; }
    (e.currentTarget as HTMLFormElement).querySelector('input')?.blur();
    setUrlLoading(true);
    setUrlError(null);
    setUrlVideo(null);
    try {
      const video = await fetchVideoById(videoId);
      if (!video) setUrlError('Video not found.');
      else setUrlVideo(video);
    } catch (err) {
      setUrlError(getApiErrorMessage(err).message);
    } finally {
      setUrlLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-background min-h-screen" style={{ minHeight: '100dvh' }}>
        <Music className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center bg-background px-4 min-h-screen" style={{ minHeight: '100dvh' }}>
        <div className="text-center space-y-3">
          <p className="text-xl font-mono font-bold text-foreground">{code.toUpperCase()}</p>
          <p className="text-sm text-muted-foreground font-mono">Room not found or has ended.</p>
        </div>
      </div>
    );
  }

  return (
    // Use dvh so layout respects the iOS visual viewport (shrinks with keyboard)
    <div className="bg-background min-h-screen" style={{ minHeight: '100dvh' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Music className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-mono text-foreground leading-none">KaraOkz</h1>
              <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                Room <span className="text-primary">{code.toUpperCase()}</span>
              </p>
            </div>
          </div>

          {singerName && !editingSinger && (
            <button
              onClick={() => { setSingerInput(singerName); setEditingSinger(true); }}
              className="flex items-center gap-1 text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-full"
            >
              {singerName}
              <Pencil className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </header>

      {/* Scrollable content — no flex-1, just natural document flow */}
      <div className="px-4 py-4 space-y-4 max-w-md mx-auto pb-10">

        {/* Singer name */}
        <AnimatePresence>
          {editingSinger && (
            <motion.div
              className="glass rounded-xl p-4 border border-border/50"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p className="text-xs font-mono text-muted-foreground mb-2">
                {singerName ? 'Change your name:' : "What's your name? (shown on the queue)"}
              </p>
              <form onSubmit={(e) => { e.preventDefault(); saveSingerName(); }} className="flex gap-2">
                <Input
                  autoFocus
                  value={singerInput}
                  onChange={(e) => setSingerInput(e.target.value)}
                  placeholder="Your name..."
                  className="flex-1 bg-muted border-border/50 font-mono text-sm h-10"
                />
                <Button
                  type="submit"
                  disabled={!singerInput.trim()}
                  className="bg-primary hover:bg-primary/90 h-10 px-4 font-mono text-sm"
                >
                  OK
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Added toast */}
        <AnimatePresence>
          {lastAdded && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-2.5 rounded-lg text-xs font-mono"
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Added: {lastAdded}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search panel */}
        <div className="rounded-xl p-4 border border-border/50 bg-card">

          {/* Mode toggle */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono font-semibold text-foreground uppercase tracking-wide">
              Add a Song
            </p>
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
              {(['search', 'url'] as SearchMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                    mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'search' ? <Search className="h-2.5 w-2.5" /> : <Link className="h-2.5 w-2.5" />}
                  {m === 'search' ? 'Search' : 'URL'}
                </button>
              ))}
            </div>
          </div>

          {/* Search mode */}
          {mode === 'search' && (
            <div>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Song or artist..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-4 bg-muted border-border/50 font-mono text-sm h-11"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
              </form>

              {searchError && (
                <div className={`mt-2 flex items-start gap-2 px-3 py-2 rounded text-xs border ${
                  searchError.isQuotaError
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="font-mono">{searchError.message}</span>
                </div>
              )}

              {/* Results — plain div, no animation wrapper, iOS-safe */}
              {results.length > 0 && (
                <div ref={resultsRef} className="mt-3 space-y-2">
                  {results.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/60 active:bg-muted transition-colors"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-16 h-10 object-cover rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-semibold text-foreground leading-tight line-clamp-2">
                          {video.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate">{video.channelName}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                            {video.duration}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAdd(video)}
                        className="w-9 h-9 p-0 bg-primary hover:bg-primary/90 shrink-0 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* URL mode */}
          {mode === 'url' && (
            <div>
              <form onSubmit={handleFetchUrl} className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder="YouTube URL or video ID..."
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlVideo(null); setUrlError(null); }}
                    className="pl-9 bg-muted border-border/50 font-mono text-sm h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={urlLoading || !urlInput.trim()}
                  className="h-11 px-4 bg-primary hover:bg-primary/90 font-mono text-sm shrink-0"
                >
                  {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                </Button>
              </form>

              {urlError && (
                <div className="mt-2 flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="font-mono">{urlError}</span>
                </div>
              )}

              {urlVideo && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-primary/20">
                  <img
                    src={urlVideo.thumbnail}
                    alt={urlVideo.title}
                    className="w-16 h-10 object-cover rounded shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold text-foreground leading-tight line-clamp-2">
                      {urlVideo.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground truncate">{urlVideo.channelName}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                        {urlVideo.duration}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { handleAdd(urlVideo); setUrlVideo(null); setUrlInput(''); }}
                    className="w-9 h-9 p-0 bg-primary hover:bg-primary/90 shrink-0 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
