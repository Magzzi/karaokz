'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { QueueItem } from '@/types/youtube';
import { Trash2, Play, Music, ExternalLink } from 'lucide-react';

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Queue ({queue.length})
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 p-0 overflow-hidden">
        {queue.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 p-6">
            <div className="text-center space-y-2">
              <Music className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="font-medium">Queue is empty</p>
              <p className="text-sm">Search and add songs to get started</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {queue.map((item, index) => {
                const isCurrentlyPlaying = item.id === currentVideoId;
                
                return (
                  <Card
                    key={item.queueId}
                    className={`transition-all ${
                      isCurrentlyPlaying
                        ? 'bg-primary/10 border-primary shadow-md'
                        : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {/* Queue Number & Thumbnail */}
                        <div className="relative shrink-0">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                          <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
                            {item.channelName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.duration}
                            </Badge>
                            {isCurrentlyPlaying && (
                              <Badge className="text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                Now Playing
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          {!isCurrentlyPlaying && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onPlaySong(item.queueId)}
                              className="h-8 px-3"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${item.id}`, '_blank')}
                            className="h-8 px-3"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemoveSong(item.queueId)}
                            className="h-8 px-3"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
