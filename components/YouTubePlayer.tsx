'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Maximize, Mic2 } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- the IFrame API ships no types */
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface PlayerHandle {
  play(): void;
  pause(): void;
}

export interface PlayerStatus {
  playing: boolean;
  time: number;
  duration: number;
}

interface YouTubePlayerProps {
  videoId: string | null;
  volume: number; // 0..100
  rate: number; // playback speed, 1 = normal
  singerName?: string | null;
  onVideoEnd: () => void;
  onStatus?: (status: PlayerStatus) => void;
  ref?: Ref<PlayerHandle>;
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise(resolve => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * YouTube IFrame player without YouTube's own controls; the stage provides
 * play/pause, seek, volume, tempo and fullscreen. Mount one per song (key it
 * by queue item) so each song gets a fresh player.
 */
export default function YouTubePlayer({ videoId, volume, rate, singerName, onVideoEnd, onStatus, ref }: YouTubePlayerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [status, setStatus] = useState<PlayerStatus>({ playing: false, time: 0, duration: 0 });
  const [blocked, setBlocked] = useState(false);

  // Callbacks and settings read from inside YouTube's event handlers
  const onVideoEndRef = useRef(onVideoEnd);
  const onStatusRef = useRef(onStatus);
  const volumeRef = useRef(volume);
  const rateRef = useRef(rate);
  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
    onStatusRef.current = onStatus;
  }, [onVideoEnd, onStatus]);

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo?.(),
    pause: () => playerRef.current?.pauseVideo?.(),
  }), []);

  useEffect(() => {
    if (!videoId || !hostRef.current) return;
    const host = hostRef.current;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let skip: ReturnType<typeof setTimeout> | undefined;

    const report = () => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const next: PlayerStatus = {
        playing: p.getPlayerState?.() === window.YT.PlayerState.PLAYING,
        time: p.getCurrentTime() ?? 0,
        duration: p.getDuration() ?? 0,
      };
      setStatus(next);
      onStatusRef.current?.(next);
    };

    loadYouTubeApi().then(() => {
      if (cancelled) return;
      // YouTube replaces the target element, so give it one React doesn't own
      const target = document.createElement('div');
      host.appendChild(target);
      playerRef.current = new window.YT.Player(target, {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, fs: 0, playsinline: 1, iv_load_policy: 3 },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(volumeRef.current);
            e.target.setPlaybackRate(rateRef.current);
            e.target.playVideo();
            report();
          },
          onStateChange: (e: any) => {
            report();
            if (e.data === window.YT.PlayerState.ENDED) onVideoEndRef.current();
          },
          // 100: removed/private, 101/150: owner disabled embedding. Skip it.
          onError: (e: any) => {
            if (![100, 101, 150].includes(e.data)) return;
            setBlocked(true);
            skip = setTimeout(() => onVideoEndRef.current(), 4000);
          },
        },
      });
      poll = setInterval(report, 500);
    });

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(skip);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [videoId]);

  useEffect(() => {
    volumeRef.current = volume;
    playerRef.current?.setVolume?.(volume);
  }, [volume]);

  useEffect(() => {
    rateRef.current = rate;
    playerRef.current?.setPlaybackRate?.(rate);
  }, [rate]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!status.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * status.duration;
    playerRef.current?.seekTo?.(t, true);
    setStatus(s => ({ ...s, time: t }));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frameRef.current?.requestFullscreen?.();
  };

  const pct = status.duration ? (status.time / status.duration) * 100 : 0;

  return (
    <div
      ref={frameRef}
      className="relative w-full aspect-video rounded-[1.4rem] p-1.5 bg-gradient-to-b from-[#2a3170] to-[#0d1030] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9),0_0_0_1px_rgb(130_150_255/0.2)]"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] bg-black">
        {videoId ? (
          <>
            <div ref={hostRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />

            {blocked && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090b22]/95 text-center px-6">
                <div>
                  <p className="text-lg font-semibold text-neon-orange">This song can&apos;t play outside YouTube</p>
                  <p className="mt-1 text-sm text-muted-foreground">The channel blocked embedding for it. Skipping to the next song…</p>
                </div>
              </div>
            )}

            {singerName && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-sm font-medium border border-white/10">
                <Mic2 className="h-4 w-4 text-neon-green" />
                <span className="text-white/80">On the mic:</span>
                <span className="text-neon-green">{singerName}</span>
              </div>
            )}

            {/* Progress + fullscreen */}
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-3">
              <div className="group relative flex-1 h-4 flex items-center cursor-pointer" onClick={seek}>
                <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-[#5ad1ff]" style={{ width: `${pct}%` }} />
                </div>
                <div
                  className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_var(--neon-cyan)]"
                  style={{ left: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-white/90 shrink-0">
                {formatTime(status.time)} / {formatTime(status.duration)}
              </span>
              <button
                onClick={toggleFullscreen}
                className="h-8 w-8 shrink-0 rounded-lg border border-white/25 bg-black/40 flex items-center justify-center text-white/90 hover:text-white hover:border-white/50 transition-colors"
                title="Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#1b2160_0%,#090b22_70%)]">
            <div className="text-center px-6">
              <div className="mx-auto mb-4 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-neon-pink/15 border border-neon-pink/40 flex items-center justify-center shadow-[0_0_40px_rgb(255_45_135/0.35)]">
                <Mic2 className="h-8 w-8 sm:h-10 sm:w-10 text-neon-pink" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">The stage is yours</h3>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
                Pick a song from the library to start the night.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
