'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QueueItem } from '@/types/youtube';
import { Trash2, Play, ListMusic, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

interface QueueProps {
  queue: QueueItem[];
  currentVideoId: string | null;
  onPlaySong: (queueId: string) => void;
  onRemoveSong: (queueId: string) => void;
}

/**
 * Karaoke Queue Component
 * Displays queued songs with play and remove actions, pagination, and scrolling
 */
export default function Queue({ queue, currentVideoId, onPlaySong, onRemoveSong }: QueueProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(queue.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQueue = queue.slice(startIndex, endIndex);
  
  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="glass rounded-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="text-xs sm:text-sm font-semibold text-foreground font-mono uppercase tracking-wide">
            Queue
          </h2>
          {queue.length > 0 && (
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">({queue.length})</span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {queue.length === 0 ? (
          <div className="h-full flex items-center justify-center px-3 sm:px-5 pb-3 sm:pb-5">
            <div className="text-center space-y-2 sm:space-y-3">
              <ListMusic className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">No songs in the queue yet.</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/70">Search and add songs above!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto px-2 sm:px-3 md:px-4 pb-2 sm:pb-4">
            <motion.div 
              className="space-y-1.5 sm:space-y-2"
              initial="hidden"
              animate="show"
              key={currentPage}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } }
              }}
            >
              {paginatedQueue.map((item, index) => {
                const actualIndex = startIndex + index;
                const isCurrentlyPlaying = item.id === currentVideoId;
                
                return (
                  <motion.div
                    key={item.queueId}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.3 } }
                    }}
                    className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 md:p-2.5 rounded-md transition-colors ${
                      isCurrentlyPlaying
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                  >
                    {/* Queue Number */}
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold font-mono shrink-0 ${
                      isCurrentlyPlaying
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {actualIndex + 1}
                    </div>

                    {/* Thumbnail */}
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded shrink-0"
                    />

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-mono text-[10px] sm:text-xs font-semibold text-foreground leading-tight truncate">
                        {item.title}
                      </h4>
                      <p className="text-muted-foreground text-[9px] sm:text-[10px] truncate">
                        {item.channelName}
                      </p>
                    </div>

                    {/* Duration Badge */}
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 font-mono shrink-0 hidden sm:inline-flex">
                      {item.duration}
                    </Badge>

                    {/* Actions */}
                    <div className="flex gap-0.5 sm:gap-1 shrink-0">
                      {!isCurrentlyPlaying && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPlaySong(item.queueId)}
                          className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-primary/20 hover:text-primary"
                        >
                          <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveSong(item.queueId)}
                        className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-t border-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
              {currentPage}/{totalPages}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-muted/60"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Page numbers - hide on very small screens */}
              <div className="hidden xs:flex gap-0.5 sm:gap-1">
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage === 1) {
                    pageNum = i + 1;
                  } else if (currentPage === totalPages) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      onClick={() => goToPage(pageNum)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 p-0 text-[10px] sm:text-xs font-mono ${
                        currentPage === pageNum 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-muted/60"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
