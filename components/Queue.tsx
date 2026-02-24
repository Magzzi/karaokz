'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QueueItem } from '@/types/youtube';
import { Trash2, Play, ListMusic } from 'lucide-react';

interface QueueProps {
  queue: QueueItem[];
  currentVideoId: string | null;
  onPlaySong: (queueId: string) => void;
  onRemoveSong: (queueId: string) => void;
}

/**
 * Karaoke Queue Component
 * Displays queued songs with play and remove actions
 */
export default function Queue({ queue, currentVideoId, onPlaySong, onRemoveSong }: QueueProps) {
  return (
    <div className="glass rounded-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wide">
            Queue
          </h2>
          {queue.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">({queue.length})</span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {queue.length === 0 ? (
          <div className="h-full flex items-center justify-center px-5 pb-5">
            <div className="text-center space-y-3">
              <ListMusic className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">No songs in the queue yet.</p>
                <p className="text-xs text-muted-foreground/70">Search and add songs above!</p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <motion.div 
              className="px-4 pb-4 space-y-2"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {queue.map((item, index) => {
                const isCurrentlyPlaying = item.id === currentVideoId;
                
                return (
                  <motion.div
                    key={item.queueId}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.3 } }
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-md transition-colors ${
                      isCurrentlyPlaying
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                  >
                    {/* Queue Number */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      isCurrentlyPlaying
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-8 object-cover rounded shrink-0"
                    />

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-mono text-xs font-semibold text-foreground leading-tight truncate">
                        {item.title}
                      </h4>
                      <p className="text-muted-foreground text-[10px] truncate">
                        {item.channelName}
                      </p>
                    </div>

                    {/* Duration Badge */}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-mono shrink-0">
                      {item.duration}
                    </Badge>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      {!isCurrentlyPlaying && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPlaySong(item.queueId)}
                          className="w-7 h-7 p-0 hover:bg-primary/20 hover:text-primary"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveSong(item.queueId)}
                        className="w-7 h-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
