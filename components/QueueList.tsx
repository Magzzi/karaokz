'use client';

import { ArrowDown, ArrowUp, ListMusic, MoreVertical, Play, Smartphone, Trash2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { splitTitle } from '@/lib/sources';

export interface QueueEntry {
  key: string;
  title: string;
  thumbnail: string;
  singerName?: string | null;
  fromPhone?: boolean;
}

interface QueueListProps {
  entries: QueueEntry[];
  currentKey: string | null;
  emptyHint?: string;
  // Fills its column and scrolls inside it; otherwise grows with the page
  fill?: boolean;
  onPlay?: (key: string) => void;
  onMove?: (key: string, direction: 'up' | 'down') => void;
  onRemove: (key: string) => void;
}

export default function QueueList({ entries, currentKey, emptyHint, fill = true, onPlay, onMove, onRemove }: QueueListProps) {
  const singers = new Set(entries.map(e => e.singerName).filter(Boolean)).size;

  return (
    <div className={`panel flex flex-col overflow-hidden ${fill ? 'flex-1 min-h-[18rem] lg:min-h-0' : ''}`}>
      <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold">Song Queue</h2>
        <span
          className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-sm tabular-nums"
          title={singers ? `${singers} singer${singers === 1 ? '' : 's'}` : `${entries.length} songs`}
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          {singers || entries.length}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-muted-foreground">
          <ListMusic className="h-9 w-9 opacity-40" />
          <p className="text-sm">The queue is empty</p>
          {emptyHint && <p className="text-xs opacity-70">{emptyHint}</p>}
        </div>
      ) : (
        <ol className={`px-3 pb-3 space-y-2 ${fill ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
          {entries.map((entry, idx) => {
            const { song, artist } = splitTitle(entry.title);
            const isCurrent = entry.key === currentKey;
            return (
              <li
                key={entry.key}
                className={`flex items-center gap-3 rounded-xl border p-2 pr-1 transition-colors ${
                  isCurrent ? 'neon-cyan-ring bg-neon-cyan/10' : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className="w-7 shrink-0 flex justify-center">
                  {isCurrent ? <EqualizerIcon /> : <span className="text-lg text-muted-foreground tabular-nums">{idx + 1}</span>}
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.thumbnail} alt="" className="h-11 w-[4.9rem] rounded-lg object-cover shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight truncate">{song}</p>
                  <p className="text-sm text-neon-cyan/75 truncate flex items-center gap-1">
                    {entry.fromPhone && <Smartphone className="h-3 w-3 shrink-0 text-neon-pink" />}
                    {entry.singerName ? <span className="text-neon-pink/90">{entry.singerName}</span> : artist}
                    {entry.singerName && artist && <span className="text-muted-foreground"> · {artist}</span>}
                  </p>
                </div>

                {isCurrent && (
                  <span className="hidden sm:inline-block lg:hidden shrink-0 rounded-full border border-neon-pink/70 bg-neon-pink/15 px-2.5 py-0.5 text-xs font-medium text-neon-pink">
                    Now Singing
                  </span>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger className="h-9 w-8 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 outline-none">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Song actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    {onPlay && !isCurrent && (
                      <DropdownMenuItem onSelect={() => onPlay(entry.key)}>
                        <Play className="h-4 w-4" /> Play now
                      </DropdownMenuItem>
                    )}
                    {onMove && (
                      <>
                        <DropdownMenuItem disabled={idx === 0} onSelect={() => onMove(entry.key, 'up')}>
                          <ArrowUp className="h-4 w-4" /> Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={idx === entries.length - 1} onSelect={() => onMove(entry.key, 'down')}>
                          <ArrowDown className="h-4 w-4" /> Move down
                        </DropdownMenuItem>
                      </>
                    )}
                    {(onPlay || onMove) && <DropdownMenuSeparator />}
                    <DropdownMenuItem variant="destructive" onSelect={() => onRemove(entry.key)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function EqualizerIcon() {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-label="Playing">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-[4px] rounded-sm bg-neon-cyan animate-[eq_0.9s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
