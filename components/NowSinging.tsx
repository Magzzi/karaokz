import { Crown, ListMusic, Mic2, Trophy, Users } from 'lucide-react';
import { splitTitle } from '@/lib/sources';
import { formatTime } from './YouTubePlayer';

interface NowSingingProps {
  title: string | null;
  thumbnail: string | null;
  singerName?: string | null;
  time: number;
  duration: number;
  stats: { queued: number; singers: number; sung: number };
}

export default function NowSinging({ title, thumbnail, singerName, time, duration, stats }: NowSingingProps) {
  const { song, artist } = title ? splitTitle(title) : { song: null, artist: null };
  const remaining = Math.max(0, duration - time);
  const progress = duration ? time / duration : 0;

  return (
    <div className="space-y-3 shrink-0">
      <div className="panel p-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <Crown className="absolute -top-3 -left-1.5 h-5 w-5 text-[#ffc53d] fill-[#ffc53d] -rotate-12 drop-shadow-[0_0_6px_rgb(255_197_61/0.7)]" />
          <div className="h-[4.5rem] w-[4.5rem] rounded-full p-[3px] bg-gradient-to-br from-neon-pink via-neon-violet to-neon-cyan shadow-[0_0_20px_rgb(255_45_135/0.4)]">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <div className="h-full w-full rounded-full bg-muted flex items-center justify-center">
                <Mic2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neon-pink">{singerName ? `${singerName} is singing` : 'Now Singing'}</p>
          <p className="text-xl font-bold leading-tight truncate">{song ?? 'Nobody yet'}</p>
          <p className="text-sm text-neon-cyan/80 truncate">{artist ?? (title ? '' : 'Queue a song to begin')}</p>
        </div>

        <CountdownRing progress={progress} label={duration ? formatTime(remaining) : '--:--'} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<ListMusic className="h-6 w-6 text-neon-cyan" />} label="In Queue" value={stats.queued} color="text-neon-cyan" />
        <Stat icon={<Users className="h-6 w-6 text-neon-orange" />} label="Singers" value={stats.singers} color="text-neon-orange" />
        <Stat icon={<Trophy className="h-6 w-6 text-neon-green" />} label="Sung" value={stats.sung} color="text-neon-green" />
      </div>
    </div>
  );
}

function CountdownRing({ progress, label }: { progress: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0" title="Time left">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--neon-pink)" />
            <stop offset="100%" stopColor="var(--neon-violet)" />
          </linearGradient>
        </defs>
        <circle cx="36" cy="36" r={r} fill="rgb(0 0 0 / 0.35)" stroke="rgb(255 255 255 / 0.08)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * progress}
          className="transition-[stroke-dashoffset] duration-500 ease-linear drop-shadow-[0_0_6px_rgb(255_45_135/0.6)]"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{label}</span>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="panel !rounded-2xl px-3 py-2.5 flex items-center gap-2.5">
      {icon}
      <div className="leading-tight">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      </div>
    </div>
  );
}
