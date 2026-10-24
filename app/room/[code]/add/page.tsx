'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Mic2, Music2, Pencil, SkipForward } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import SongLibrary from '@/components/SongLibrary';
import QueueList from '@/components/QueueList';
import { StageBackdrop } from '@/components/StageShell';
import { useRoomQueue } from '@/lib/useRoomQueue';
import { splitTitle } from '@/lib/sources';
import { YouTubeVideo } from '@/types/youtube';

// Guest view, opened from the host's QR code on a phone.
// Layout stays in normal document flow (no inner scroll areas) for iOS Safari.
export default function AddSongPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { status, items, currentItemId, current, add, remove, move } = useRoomQueue(code);

  const singerKey = `karaoke-singer-${code.toUpperCase()}`;
  const [singerName, setSingerName] = useState('');
  const [editingSinger, setEditingSinger] = useState(false);
  const [singerInput, setSingerInput] = useState('');
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(singerKey) ?? '';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved name after hydration
    setSingerName(stored);
    if (!stored) setEditingSinger(true);
  }, [singerKey]);

  const saveSingerName = () => {
    const name = singerInput.trim();
    setSingerName(name);
    localStorage.setItem(singerKey, name);
    setEditingSinger(false);
  };

  // Removing the playing song makes the host move on to the next one
  const handleSkip = () => {
    if (!current) return;
    const { song } = splitTitle(current.title);
    const who = current.singer_name ? ` (${current.singer_name})` : '';
    if (confirm(`Skip "${song}"${who} for everyone?`)) remove(current.id);
  };

  const handleAdd = useCallback(async (video: YouTubeVideo) => {
    await add(video, singerName || null, 'phone');
    setLastAdded(splitTitle(video.title).song);
    setTimeout(() => setLastAdded(null), 3000);
  }, [add, singerName]);

  if (status !== 'ready') {
    return (
      <div className="flex items-center justify-center bg-background px-4 min-h-screen" style={{ minHeight: '100dvh' }}>
        {status === 'loading' ? (
          <Music2 className="h-9 w-9 text-neon-pink animate-pulse" />
        ) : (
          <div className="text-center space-y-2">
            <p className="text-3xl font-black italic tracking-wider">{code.toUpperCase()}</p>
            <p className="text-muted-foreground">Room not found or has ended.</p>
          </div>
        )}
      </div>
    );
  }

  const mySongs = singerName ? items.filter(i => i.singer_name === singerName) : [];
  const myNext = mySongs.find(i => i.id !== currentItemId);
  const songsAhead = myNext ? items.findIndex(i => i.id === myNext.id) - (current ? 1 : 0) : -1;

  return (
    // dvh so the layout follows the iOS visual viewport (shrinks with the keyboard)
    <div className="relative isolate min-h-screen" style={{ minHeight: '100dvh' }}>
      <StageBackdrop image={current?.thumbnail} />

      <header className="sticky top-0 z-10 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="px-4 py-3 flex items-center justify-between max-w-md mx-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="sm" />
            <span className="rounded-lg border border-neon-pink/40 bg-neon-pink/10 px-2 py-0.5 text-xs font-semibold tracking-widest text-neon-pink">
              {code.toUpperCase()}
            </span>
          </div>
          {singerName && !editingSinger && (
            <button
              onClick={() => { setSingerInput(singerName); setEditingSinger(true); }}
              className="flex items-center gap-1.5 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-sm text-neon-cyan min-w-0"
            >
              <Mic2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[7rem]">{singerName}</span>
              <Pencil className="h-3 w-3 shrink-0 opacity-70" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto pb-10">
        <AnimatePresence>
          {editingSinger && (
            <motion.div
              className="panel p-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p className="font-semibold">{singerName ? 'Change your stage name' : "What's your stage name?"}</p>
              <p className="text-sm text-muted-foreground mb-3">It shows on the big screen when it&apos;s your turn.</p>
              <form onSubmit={(e) => { e.preventDefault(); saveSingerName(); }} className="flex gap-2">
                <input
                  autoFocus
                  value={singerInput}
                  onChange={(e) => setSingerInput(e.target.value)}
                  placeholder="Your name…"
                  className="h-12 flex-1 min-w-0 rounded-xl border border-white/10 bg-black/25 px-4 text-base outline-none focus:border-neon-cyan/60"
                />
                <button
                  type="submit"
                  disabled={!singerInput.trim()}
                  className="h-12 rounded-xl bg-gradient-to-b from-[#ff4f9d] to-[#e8146d] px-5 font-semibold text-white disabled:opacity-40"
                >
                  Let&apos;s go
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {current && <NowPlayingCard title={current.title} thumbnail={current.thumbnail} singerName={current.singer_name} onSkip={handleSkip} />}

        {/* Your turn status */}
        {singerName && !editingSinger && (
          <div className="panel !rounded-2xl px-4 py-3 flex items-center gap-3">
            <Mic2 className="h-6 w-6 shrink-0 text-neon-pink" />
            <p className="text-sm">
              {current?.singer_name === singerName ? (
                <span className="font-semibold text-neon-green">You&apos;re on! Grab the mic 🎤</span>
              ) : myNext ? (
                songsAhead <= 0
                  ? <span className="font-semibold text-neon-orange">You&apos;re up next, get ready!</span>
                  : <>Your next song is in <span className="font-semibold text-neon-cyan">{songsAhead} song{songsAhead === 1 ? '' : 's'}</span></>
              ) : (
                <span className="text-muted-foreground">You have no songs queued yet.</span>
              )}
            </p>
          </div>
        )}

        <AnimatePresence>
          {lastAdded && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-2.5 text-sm text-neon-cyan"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span className="truncate">Added {lastAdded} to the queue</span>
            </motion.div>
          )}
        </AnimatePresence>

        <SongLibrary onAdd={handleAdd} layout="page" />

        <QueueList
          entries={items.map(i => ({
            key: i.id,
            title: i.title,
            thumbnail: i.thumbnail,
            singerName: i.singer_name,
            fromPhone: i.added_from === 'phone',
          }))}
          currentKey={currentItemId}
          fill={false}
          onMove={move}
          onRemove={remove}
        />
      </div>
    </div>
  );
}

function NowPlayingCard({ title, thumbnail, singerName, onSkip }: {
  title: string; thumbnail: string; singerName: string | null; onSkip: () => void;
}) {
  const { song, artist } = splitTitle(title);
  return (
    <div className="panel p-3 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt="" className="h-14 w-[5.33rem] rounded-lg object-cover shrink-0 ring-2 ring-neon-pink/60" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neon-pink">{singerName ? `${singerName} is singing` : 'Now Singing'}</p>
        <p className="font-semibold leading-tight truncate">{song}</p>
        {artist && <p className="text-sm text-neon-cyan/80 truncate">{artist}</p>}
      </div>
      <button
        onClick={onSkip}
        className="shrink-0 h-12 rounded-xl border border-white/15 bg-white/5 px-3.5 flex items-center gap-1.5 text-sm font-semibold active:scale-95 transition-transform hover:border-neon-orange/60 hover:text-neon-orange"
      >
        <SkipForward className="h-4 w-4" /> Skip
      </button>
    </div>
  );
}
