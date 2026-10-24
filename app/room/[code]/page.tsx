'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Music2, QrCode } from 'lucide-react';
import YouTubePlayer, { type PlayerHandle, type PlayerStatus } from '@/components/YouTubePlayer';
import SongLibrary from '@/components/SongLibrary';
import QueueList from '@/components/QueueList';
import NowSinging from '@/components/NowSinging';
import ControlBar from '@/components/ControlBar';
import StageShell from '@/components/StageShell';
import UpNext from '@/components/UpNext';
import ShareRoomDialog from '@/components/ShareRoomDialog';
import QuotaDisplay from '@/components/QuotaDisplay';
import { Button } from '@/components/ui/button';
import { touchRoom, endRoom, markPlaying } from '@/lib/rooms';
import { useRoomQueue } from '@/lib/useRoomQueue';
import { YouTubeVideo } from '@/types/youtube';

const IDLE: PlayerStatus = { playing: false, time: 0, duration: 0 };

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const { status, room, items, currentItemId, current, add, remove, move, play, ended } = useRoomQueue(code);
  const [showQR, setShowQR] = useState(false);
  const [volume, setVolume] = useState(80);
  const [rate, setRate] = useState(1);
  const [player, setPlayer] = useState<PlayerStatus>(IDLE);
  const [sung, setSung] = useState(0);
  const playerRef = useRef<PlayerHandle>(null);

  // Touch room on load and every 5 minutes while PC is on the page
  useEffect(() => {
    if (!room) return;
    touchRoom(room.id);
    const interval = setInterval(() => touchRoom(room.id), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [room]);

  // Publish what's playing so guests' phones show it and can skip it
  useEffect(() => {
    if (room) markPlaying(room.id, currentItemId);
  }, [room, currentItemId]);

  const finishSong = useCallback(() => {
    setSung(n => n + 1);
    setPlayer(IDLE);
    ended();
  }, [ended]);

  const handleAdd = useCallback((video: YouTubeVideo) => add(video, null, 'pc'), [add]);

  const handleEndSession = async () => {
    if (!room) return;
    if (!confirm('End this karaoke session? Guests will lose access.')) return;
    await endRoom(room.id);
    router.push('/');
  };

  if (status !== 'ready') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        {status === 'loading' ? (
          <Music2 className="h-10 w-10 text-neon-pink animate-pulse" />
        ) : (
          <div className="text-center space-y-4">
            <p className="text-3xl font-black italic tracking-wider">{code.toUpperCase()}</p>
            <p className="text-muted-foreground">Room not found or has ended.</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" /> Go home
            </Button>
          </div>
        )}
      </div>
    );
  }

  const singers = new Set(items.map(i => i.singer_name).filter(Boolean)).size;
  const next = items.find(i => i.id !== currentItemId) ?? null;
  const live = current ? player : IDLE;

  return (
    <>
      <StageShell
        backdrop={current?.thumbnail}
        actions={
          <>
            <div className="hidden sm:block"><QuotaDisplay /></div>
            <span className="hidden sm:inline-flex items-center rounded-xl border border-neon-pink/40 bg-neon-pink/10 px-3 py-2 text-sm font-semibold tracking-widest text-neon-pink">
              {code.toUpperCase()}
            </span>
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#2ab8ff] to-[#0b84e8] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgb(31_184_255/0.4)]"
            >
              <QrCode className="h-4 w-4" /> <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              onClick={handleEndSession}
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              title="End session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        }
        library={<SongLibrary onAdd={handleAdd} />}
        stage={
          <>
            {/* Keyed by item so the same video queued twice in a row still restarts */}
            <YouTubePlayer
              key={currentItemId ?? 'idle'}
              ref={playerRef}
              videoId={current?.video_id ?? null}
              singerName={current?.singer_name}
              volume={volume}
              rate={rate}
              onVideoEnd={finishSong}
              onStatus={setPlayer}
            />
            <UpNext
              title={next?.title ?? null}
              singerName={next?.singer_name}
              hint={`Guests join at /room/${code.toUpperCase()}/add, or scan the Invite QR`}
            />
          </>
        }
        side={
          <>
            <NowSinging
              title={current?.title ?? null}
              thumbnail={current?.thumbnail ?? null}
              singerName={current?.singer_name}
              time={live.time}
              duration={live.duration}
              stats={{ queued: items.length, singers, sung }}
            />
            <QueueList
              entries={items.map(i => ({
                key: i.id,
                title: i.title,
                thumbnail: i.thumbnail,
                singerName: i.singer_name,
                fromPhone: i.added_from === 'phone',
              }))}
              currentKey={currentItemId}
              emptyHint="Guests can add songs by scanning the Invite QR"
              onPlay={play}
              onMove={move}
              onRemove={remove}
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

      {showQR && <ShareRoomDialog code={code} onClose={() => setShowQR(false)} />}
    </>
  );
}
