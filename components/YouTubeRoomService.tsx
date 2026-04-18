'use client';
import { useState } from 'react';
import YouTube from 'react-youtube';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, Search, Video } from 'lucide-react';

export function YouTubeRoomService({ destination }: { destination: string }) {
  const [query, setQuery] = useState(destination || '');
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const searchVideos = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/youtube/search?destination=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (Array.isArray(data)) setVideos(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-red-500" /> YouTube Room Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search for videos..."
          />
          <Button onClick={() => searchVideos(query)} className="bg-red-600 hover:bg-red-700">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
        
        {selectedVideoId ? (
          <div className="aspect-video">
            <YouTube videoId={selectedVideoId} opts={{ width: '100%', height: '100%' }} />
            <Button variant="ghost" className="mt-2 text-zinc-400" onClick={() => setSelectedVideoId(null)}>← Back to list</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {videos.map((vid) => (
              <div key={vid.videoId} className="cursor-pointer" onClick={() => setSelectedVideoId(vid.videoId)}>
                <img src={vid.thumbnail} alt={vid.title} className="rounded-lg mb-2" />
                <p className="text-xs font-bold line-clamp-2">{vid.title}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
