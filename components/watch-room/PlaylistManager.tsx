'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, GripVertical, Play, Search } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import NextImage from 'next/image';
import { toast } from 'sonner';

interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  order: number;
}

interface PlaylistManagerProps {
  roomId: string;
  onSelect: (videoId: string) => void;
}

export function PlaylistManager({ roomId, onSelect }: PlaylistManagerProps) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'rooms', roomId, 'playlist'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setPlaylist(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlaylistItem)));
    });
  }, [roomId]);

  const addToPlaylist = async (video: any) => {
    try {
      const maxOrder = playlist.length > 0 ? Math.max(...playlist.map(i => i.order)) : 0;
      await addDoc(collection(db, 'rooms', roomId, 'playlist'), {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        addedBy: auth.currentUser?.uid || 'anonymous',
        order: maxOrder + 1,
        addedAt: serverTimestamp()
      });
      toast.success("Added to playlist");
      setSearchQuery('');
    } catch (e) {
      toast.error("Failed to add video");
    }
  };

  const removeFromPlaylist = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', roomId, 'playlist', id));
    } catch (e) {
      toast.error("Failed to remove video");
    }
  };

  const handleReorder = async (newOrder: PlaylistItem[]) => {
    setPlaylist(newOrder);
    const batch = writeBatch(db);
    newOrder.forEach((item, index) => {
      const ref = doc(db, 'rooms', roomId, 'playlist', item.id);
      batch.update(ref, { order: index });
    });
    await batch.commit();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?destination=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        addToPlaylist(data[0]);
      } else {
        toast.error("No videos found");
      }
    } catch (e) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-500" /> Collaborative Playlist
        </h3>
        <div className="flex gap-2">
          <Input 
            placeholder="Search or paste YouTube URL..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs bg-zinc-950 border-zinc-800"
          />
          <Button size="sm" onClick={handleSearch} disabled={isSearching} className="h-8 bg-zinc-800 hover:bg-zinc-700">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Reorder.Group 
          values={playlist} 
          onReorder={handleReorder} 
          className="p-2 space-y-2"
        >
          {playlist.map((item) => (
            <PlaylistItem 
              key={item.id} 
              item={item} 
              onRemove={() => removeFromPlaylist(item.id)}
              onSelect={() => onSelect(item.videoId)}
            />
          ))}
          {playlist.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-xs italic">
              Playlist is empty. Add some travel videos!
            </div>
          )}
        </Reorder.Group>
      </ScrollArea>
    </div>
  );
}

function PlaylistItem({ item, onRemove, onSelect }: { item: PlaylistItem, onRemove: () => void, onSelect: () => void }) {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={item}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-colors"
    >
      <div 
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing text-zinc-600 group-hover:text-zinc-400"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div className="relative w-16 aspect-video rounded overflow-hidden flex-shrink-0">
        <NextImage src={item.thumbnail} alt={item.title} fill className="object-cover" unoptimized />
        <button 
          onClick={onSelect}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
        >
          <Play className="h-4 w-4 text-white fill-white" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-zinc-200 truncate pr-2">{item.title}</p>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onRemove}
        className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </Reorder.Item>
  );
}
