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
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search for songs or artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          onClick={handleClear}
          disabled={!query && results.length === 0}
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
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
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Search Results</h3>
          <div className="space-y-2 max-h-150 overflow-y-auto">
            {results.map((video) => (
              <Card key={video.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded shrink-0"
                    />
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{video.channelName}</p>
                      <Badge variant="secondary" className="text-xs">
                        {video.duration}
                      </Badge>
                    </div>
                    
                    {/* Add Button */}
                    <Button
                      size="sm"
                      onClick={() => onAddToQueue(video)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
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
