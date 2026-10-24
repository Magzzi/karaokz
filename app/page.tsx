'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Hash, Users } from 'lucide-react';
import YouTubePlayer, { type PlayerHandle, type PlayerStatus } from '@/components/YouTubePlayer';
import SongLibrary from '@/components/SongLibrary';
import QueueList from '@/components/QueueList';
import NowSinging from '@/components/NowSinging';
import ControlBar from '@/components/ControlBar';
import StageShell from '@/components/StageShell';
import UpNext from '@/components/UpNext';
import QuotaDisplay from '@/components/QuotaDisplay';
import CreateRoomDialog from '@/components/CreateRoomDialog';
import JoinRoomDialog from '@/components/JoinRoomDialog';
import { QueueItem, YouTubeVideo } from '@/types/youtube';

const STORAGE_KEY = 'karaoke-state';
const IDLE: PlayerStatus = { playing: false, time: 0, duration: 0 };

/**
 * Solo mode: a single-screen queue kept in this browser.
 * Rooms (multi-device) live under /room/[code].
 */
export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [volume, setVolume] = useState(80);
  const [rate, setRate] = useState(1);
  const [player, setPlayer] = useState<PlayerStatus>(IDLE);
  const [sung, setSung] = useState(0);
  const playerRef = useRef<PlayerHandle>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { queue: savedQueue, currentQueueId: savedId } = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore after hydration
        setQueue(savedQueue || []);
        setCurrentQueueId(savedId || null);
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ queue, currentQueueId }));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [queue, currentQueueId, isHydrated]);

  const current = queue.find(item => item.queueId === currentQueueId) ?? null;

  const handleAddToQueue = useCallback((video: YouTubeVideo) => {
    const item: QueueItem = { ...video, queueId: `${video.id}-${Date.now()}` };
    setQueue(prev => [...prev, item]);
    // Autoplay when nothing is playing
    setCurrentQueueId(id => id ?? item.queueId);
  }, []);

  // Drop an item; if it was playing, the first remaining item takes over
  const removeItem = useCallback((queueId: string) => {
    const remaining = queue.filter(item => item.queueId !== queueId);
    setQueue(remaining);
    if (currentQueueId === queueId) setCurrentQueueId(remaining[0]?.queueId ?? null);
  }, [queue, currentQueueId]);

  const finishSong = useCallback(() => {
    if (!currentQueueId) return;
    setSung(n => n + 1);
    setPlayer(IDLE);
    removeItem(currentQueueId);
  }, [currentQueueId, removeItem]);

  const moveItem = useCallback((queueId: string, direction: 'up' | 'down') => {
    setQueue(prev => {
      const idx = prev.findIndex(i => i.queueId === queueId);
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const next = queue.find(item => item.queueId !== currentQueueId) ?? null;
  const live = current ? player : IDLE;

  return (
    <>
      <StageShell
        backdrop={current?.thumbnail}
        actions={
          <>
            <div className="hidden sm:block"><QuotaDisplay /></div>
            <button
              onClick={() => setShowJoinRoom(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Hash className="h-4 w-4 text-neon-cyan" /> <span className="hidden sm:inline">Join room</span>
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#ff4f9d] to-[#e8146d] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgb(255_45_135/0.45)]"
            >
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">Start a room</span>
            </button>
          </>
        }
        library={<SongLibrary onAdd={handleAddToQueue} />}
        stage={
          <>
            <YouTubePlayer
              key={currentQueueId ?? 'idle'}
              ref={playerRef}
              videoId={current?.id ?? null}
              volume={volume}
              rate={rate}
              onVideoEnd={finishSong}
              onStatus={setPlayer}
            />
            <UpNext title={next?.title ?? null} hint="Start a room so friends can queue songs from their phones" />
          </>
        }
        side={
          <>
            <NowSinging
              title={current?.title ?? null}
              thumbnail={current?.thumbnail ?? null}
              time={live.time}
              duration={live.duration}
              stats={{ queued: queue.length, singers: 0, sung }}
            />
            <QueueList
              entries={queue.map(item => ({ key: item.queueId, title: item.title, thumbnail: item.thumbnail }))}
              currentKey={currentQueueId}
              emptyHint="Pick songs from the library"
              onPlay={setCurrentQueueId}
              onMove={moveItem}
              onRemove={removeItem}
            />
          </>
        }
        controls={
          <ControlBar
            hasSong={!!current}
            playing={live.playing}
            onToggle={() => (live.playing ? playerRef.current?.pause() : playerRef.current?.play())}
            onNext={finishSong}
            volume={volume}
            onVolume={setVolume}
            rate={rate}
            onRate={setRate}
          />
        }
      />

      {/* Dialogs sit outside the stage so transformed ancestors can't trap them */}
      {showCreateRoom && <CreateRoomDialog onClose={() => setShowCreateRoom(false)} />}
      {showJoinRoom && <JoinRoomDialog onClose={() => setShowJoinRoom(false)} />}
    </>
  );
}
