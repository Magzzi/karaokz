'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, ListMusic, Smartphone, Monitor } from 'lucide-react';
import { RoomQueueItem } from '@/types/room';

interface RoomQueueProps {
  items: RoomQueueItem[];
  currentItemId: string | null;
  onPlay: (item: RoomQueueItem) => void;
  onRemove: (itemId: string) => void;
}

export default function RoomQueue({ items, currentItemId, onPlay, onRemove }: RoomQueueProps) {
  return (
    <div className="glass rounded-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 shrink-0 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="text-xs sm:text-sm font-semibold text-foreground font-mono uppercase tracking-wide">
            Queue
          </h2>
          {items.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">({items.length})</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4 pb-4">
            <div className="text-center space-y-2">
              <ListMusic className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground font-mono">Queue is empty</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Guests can add songs by scanning the QR code
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto px-2 sm:px-3 py-2 space-y-1.5">
            {items.map((item, index) => {
              const isPlaying = item.id === currentItemId;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: index * 0.04 }}
                  className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-md transition-colors ${
                    isPlaying
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-muted/40 hover:bg-muted/60'
                  }`}
                >
                  {/* Number */}
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                    isPlaying ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-mono text-[10px] sm:text-xs font-semibold text-foreground leading-tight truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.added_from === 'phone'
                        ? <Smartphone className="h-2.5 w-2.5 text-accent shrink-0" />
                        : <Monitor className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      }
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                        {item.singer_name ?? item.channel_name}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1 py-0 font-mono shrink-0 hidden sm:inline-flex"
                  >
                    {item.duration}
                  </Badge>

                  {/* Actions */}
                  <div className="flex gap-0.5 shrink-0">
                    {!isPlaying && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlay(item)}
                        className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-primary/20 hover:text-primary"
                      >
                        <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemove(item.id)}
                      className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
