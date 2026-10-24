'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Heart, Link2, Loader2, Plus, Search, X } from 'lucide-react';
import { searchYouTubeVideos, fetchVideoById, extractVideoId, getApiErrorMessage } from '@/lib/youtube';
import { ALLOWED_CHANNEL_NAMES, splitTitle } from '@/lib/sources';
import { useFavorites } from '@/lib/favorites';
import { YouTubeVideo } from '@/types/youtube';

// Quick searches inside the allowed channels (each costs one search)
const PRESETS = ['OPM', 'Duet', 'Love Songs', '90s', 'Rock'];

type View = { kind: 'favorites' } | { kind: 'search'; label: string } | { kind: 'url' };

interface SongLibraryProps {
  onAdd: (video: YouTubeVideo) => void | Promise<void>;
  // 'panel' scrolls inside its column; 'page' flows with the document (phones)
  layout?: 'panel' | 'page';
}

export default function SongLibrary({ onAdd, layout = 'panel' }: SongLibraryProps) {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [view, setView] = useState<View>({ kind: 'favorites' });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isQuotaError: boolean } | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // On phones, bring results into view (iOS-safe: window scroll, not scrollIntoView)
  useEffect(() => {
    if (layout !== 'page' || !results.length || !listRef.current) return;
    const t = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    }, 200);
    return () => clearTimeout(t);
  }, [results, layout]);

  const runSearch = async (q: string, label: string) => {
    if (!q.trim()) return;
    setView({ kind: 'search', label });
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const videos = await searchYouTubeVideos(q);
      setResults(videos);
      if (!videos.length) setError({ message: `No ${ALLOWED_CHANNEL_NAMES} songs found.`, isQuotaError: false });
    } catch (err) {
      const parsed = getApiErrorMessage(err);
      setError(parsed);
      if (parsed.isQuotaError) setView({ kind: 'url' });
    } finally {
      setLoading(false);
    }
  };

  const runUrlFetch = async (input: string) => {
    const videoId = extractVideoId(input);
    if (!videoId) {
      setError({ message: 'Paste a YouTube link or an 11-character video ID.', isQuotaError: false });
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const video = await fetchVideoById(videoId);
      if (!video) setError({ message: 'Video not found.', isQuotaError: false });
      else setResults([video]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Dismiss the phone keyboard before results arrive
    e.currentTarget.querySelector('input')?.blur();
    if (view.kind === 'url') runUrlFetch(query);
    else runSearch(query, query.trim());
  };

  const switchToUrl = () => {
    setView(v => (v.kind === 'url' ? { kind: 'favorites' } : { kind: 'url' }));
    setQuery('');
    setResults([]);
    setError(null);
  };

  const add = async (video: YouTubeVideo) => {
    await onAdd(video);
    setJustAdded(video.id);
    setTimeout(() => setJustAdded(id => (id === video.id ? null : id)), 1800);
  };

  const list = view.kind === 'favorites' ? favorites : results;
  const isUrl = view.kind === 'url';
  const panel = layout === 'panel';

  return (
    <div className={`panel flex flex-col ${panel ? 'h-full min-h-0 overflow-hidden' : ''}`}>
      <div className="p-3 sm:p-4 pb-2 space-y-3 shrink-0">
        <form onSubmit={submit} className="flex gap-2">
          <div className="relative flex-1">
            {isUrl
              ? <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
            <input
              type={isUrl ? 'url' : 'search'}
              inputMode={isUrl ? 'url' : 'search'}
              value={query}
              onChange={e => { setQuery(e.target.value); setError(null); }}
              placeholder={isUrl ? `Paste a ${ALLOWED_CHANNEL_NAMES} link…` : 'Search songs'}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-10 text-base placeholder:text-muted-foreground outline-none focus:border-neon-cyan/60 focus:shadow-[0_0_0_3px_rgb(31_184_255/0.15)] transition [&::-webkit-search-cancel-button]:hidden"
            />
            {loading ? (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-neon-cyan" />
            ) : query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={switchToUrl}
            title={isUrl ? 'Back to search' : 'Add by YouTube link or ID'}
            className={`h-12 w-12 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${
              isUrl ? 'neon-cyan-ring bg-neon-cyan/15 text-neon-cyan' : 'border-white/10 bg-black/25 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 className="h-5 w-5" />
          </button>
        </form>

        {!isUrl && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={view.kind === 'favorites'} onClick={() => { setView({ kind: 'favorites' }); setError(null); }}>
              <Heart className={`h-3.5 w-3.5 ${view.kind === 'favorites' ? 'fill-current' : ''}`} /> Favorites
            </Chip>
            {PRESETS.map(p => (
              <Chip key={p} active={view.kind === 'search' && view.label === p} onClick={() => runSearch(p, p)}>
                {p}
              </Chip>
            ))}
          </div>
        )}

        {error && (
          <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
            error.isQuotaError ? 'border-neon-orange/40 bg-neon-orange/10 text-neon-orange' : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}>
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error.message}</span>
          </div>
        )}
      </div>

      <div ref={listRef} className={`px-3 pb-3 space-y-2 ${panel ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
        {list.map(video => (
          <SongRow
            key={video.id}
            video={video}
            added={justAdded === video.id}
            favorite={isFavorite(video.id)}
            onAdd={() => add(video)}
            onToggleFavorite={() => toggleFavorite(video)}
          />
        ))}

        {!loading && !list.length && !error && (
          <div className="py-10 px-4 text-center text-sm text-muted-foreground">
            {view.kind === 'favorites' ? (
              <>
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No favorites yet.</p>
                <p className="text-xs mt-1 opacity-70">Search, then tap the heart to keep a song here. Favorites don&apos;t use search quota.</p>
              </>
            ) : isUrl ? (
              <p>Paste a {ALLOWED_CHANNEL_NAMES} video link or ID. Works even when the daily search quota runs out.</p>
            ) : null}
          </div>
        )}

        {list.length > 0 && (
          <p className="pt-1 text-center text-[11px] text-muted-foreground/70">Songs from {ALLOWED_CHANNEL_NAMES} only</p>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-gradient-to-b from-[#2ab8ff] to-[#0b84e8] text-white shadow-[0_0_16px_rgb(31_184_255/0.45)]'
          : 'bg-white/[0.05] border border-white/10 text-foreground/85 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function SongRow({ video, added, favorite, onAdd, onToggleFavorite }: {
  video: YouTubeVideo; added: boolean; favorite: boolean; onAdd: () => void; onToggleFavorite: () => void;
}) {
  const { song, artist } = splitTitle(video.title);
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border p-2 transition-colors ${
        added ? 'neon-cyan-ring bg-neon-cyan/10' : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
    >
      <button onClick={onAdd} className="flex flex-1 min-w-0 items-center gap-3 text-left" title="Add to queue">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbnail} alt="" className="h-12 w-[5.33rem] rounded-lg object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight line-clamp-2">{song}</p>
          <p className="text-sm text-muted-foreground truncate">
            {artist ?? video.channelName}
            <span className="opacity-60"> · {video.duration}</span>
          </p>
        </div>
      </button>
      <button
        onClick={onToggleFavorite}
        className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center transition-colors ${favorite ? 'text-neon-pink' : 'text-muted-foreground hover:text-foreground'}`}
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
      </button>
      <button
        onClick={onAdd}
        className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
          added ? 'bg-neon-cyan text-primary-foreground' : 'bg-white/[0.07] text-foreground group-hover:bg-neon-cyan group-hover:text-primary-foreground'
        }`}
        aria-label="Add to queue"
      >
        {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
