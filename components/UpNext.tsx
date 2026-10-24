import { ChevronsRight, Mic2 } from 'lucide-react';
import { splitTitle } from '@/lib/sources';

// Strip under the player that calls the next singer to get ready
export default function UpNext({ title, singerName, hint }: { title: string | null; singerName?: string | null; hint?: string }) {
  if (!title) {
    return hint ? (
      <div className="panel !rounded-2xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
        <Mic2 className="h-4 w-4 text-neon-pink shrink-0" />
        <span className="truncate">{hint}</span>
      </div>
    ) : null;
  }

  const { song, artist } = splitTitle(title);
  return (
    <div className="panel !rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="shrink-0 rounded-lg bg-neon-orange/15 border border-neon-orange/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-neon-orange">
        Up next
      </span>
      <ChevronsRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="min-w-0 truncate">
        <span className="font-semibold">{song}</span>
        {artist && <span className="text-muted-foreground"> · {artist}</span>}
      </p>
      {singerName && (
        <p className="ml-auto shrink-0 text-sm text-neon-pink">
          Get ready, <span className="font-semibold">{singerName}</span>!
        </p>
      )}
    </div>
  );
}
