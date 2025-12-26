'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { searchYouTubeVideos } from '@/lib/youtube';
import { YouTubeVideo } from '@/types/youtube';
import { Search, Plus, Loader2, X } from 'lucide-react';

interface YouTubeSearchProps {
  onAddToQueue: (video: YouTubeVideo) => void;
}

/**
 * YouTube Search Component
 * Allows users to search for karaoke videos and add them to the queue
 */
export default function YouTubeSearch({ onAddToQueue }: YouTubeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const videos = await searchYouTubeVideos(query);
      setResults(videos);
    } catch (err) {
      setError('Failed to search. Please check your API key configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Search for songs or artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !query.trim()} className="flex-1 sm:flex-none">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="sm:hidden">Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Search</span>
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleClear}
            disabled={!query && results.length === 0}
            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Search Results ({results.length})
          </h3>
          <div className="space-y-2 max-h-[60vh] lg:max-h-[500px] overflow-y-auto pr-2">
            {results.map((video) => (
              <Card key={video.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-28 md:w-32 shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full aspect-video object-cover rounded"
                      />
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 text-gray-900 dark:text-gray-100">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {video.channelName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {video.duration}
                      </Badge>
                    </div>
                    
                    {/* Add Button */}
                    <Button
                      size="sm"
                      onClick={() => onAddToQueue(video)}
                      className="shrink-0 w-full sm:w-auto sm:self-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="sm:inline">Add</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
