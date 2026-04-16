'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ThumbsUp, Timer } from 'lucide-react';
import NextImage from 'next/image';

interface VoteCandidate {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  votes: string[]; // Array of UIDs
}

interface VotingOverlayProps {
  roomId: string;
  isActive: boolean;
}

export function VotingOverlay({ roomId, isActive }: VotingOverlayProps) {
  const [candidates, setCandidates] = useState<VoteCandidate[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Fetch top 3 from playlist as candidates
    const fetchCandidates = async () => {
      const q = query(collection(db, 'rooms', roomId, 'playlist'), orderBy('order', 'asc'), limit(3));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({
        id: d.id,
        videoId: d.data().videoId,
        title: d.data().title,
        thumbnail: d.data().thumbnail,
        votes: []
      }));
      setCandidates(items);
      
      // Reset timer
      setTimeLeft(15);
      setHasVoted(false);
    };

    fetchCandidates();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, roomId]);

  // Sync votes in real-time if we want it strictly collaborative
  // For simplicity, we can store votes on the room document or a 'current_vote' subcollection
  // Let's use room document 'votingData' field for real-time sync of votes

  useEffect(() => {
    if (!isActive) return;
    const roomRef = doc(db, 'rooms', roomId);
    return onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.currentVotes) {
        setCandidates(prev => prev.map(c => ({
          ...c,
          votes: data.currentVotes[c.id] || []
        })));
      }
    });
  }, [isActive, roomId]);

  const handleVote = async (candidateId: string) => {
    if (hasVoted || !auth.currentUser) return;
    
    setHasVoted(true);
    const roomRef = doc(doc(db, 'rooms', roomId).collection('votes'), candidateId);
    // Actually, let's update a map on the room doc for simplicity in 15s window
    const roomDocRef = doc(db, 'rooms', roomId);
    
    // Using a simple object structure for votes: { currentVotes: { [candidateId]: [uids] } }
    // We fetch current data first (or use a smarter atomic update)
    // For this prototype, I'll use simple update
    const snap = await getDocs(collection(db, 'rooms', roomId, 'playlist')); // dummy call to trigger if needed? no
    
    // Better way: use arrayUnion in a map is hard. 
    // I'll just use a subcollection and a listener
  };

  // Wait, I already have onSnapshot. Let's stick to a subcollection 'votes'
  const submitVote = async (candidateId: string) => {
    if (hasVoted || !auth.currentUser) return;
    setHasVoted(true);
    
    // Add vote to subcollection
    await updateDoc(doc(db, 'rooms', roomId), {
      [`votingData.votes.${auth.currentUser.uid}`]: candidateId
    });
  };

  // Derived votes count from room data
  const voteCounts = candidates.map(c => {
    // This is filtered from roomData.votingData.votes which is { uid: candidateId }
    return 0; // Placeholder
  });

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
      >
        <div className="max-w-4xl w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter">NEXT DESTINATION?</h2>
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Timer className="h-4 w-4" /> Voting ends in {timeLeft}s
              </p>
            </div>
            <div className="text-right">
              <span className="text-8xl font-black text-white/10 absolute -top-10 right-10 pointer-events-none">{timeLeft}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {candidates.map((candidate, idx) => (
              <motion.div 
                key={candidate.id}
                whileHover={{ y: -10 }}
                className={`relative rounded-3xl overflow-hidden border-2 transition-all cursor-pointer ${hasVoted ? 'pointer-events-none' : 'hover:border-emerald-500 border-zinc-800 bg-zinc-900 shadow-2xl'}`}
                onClick={() => submitVote(candidate.id)}
              >
                <div className="aspect-video relative">
                  <NextImage src={candidate.thumbnail} alt={candidate.title} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-bold text-white line-clamp-2">{candidate.title}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-zinc-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Candidate #{idx + 1}</span>
                    <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs text-emerald-400">
                      <ThumbsUp className="h-3 w-3" /> {candidate.votes.length}
                    </Button>
                  </div>
                  <Progress value={(candidate.votes.length / 10) * 100} className="h-1 bg-zinc-800" indicatorClassName="bg-emerald-500" />
                </div>

                {hasVoted && (
                  <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                      <ThumbsUp className="h-6 w-6" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <p className="text-center text-zinc-500 mt-12 text-xs uppercase tracking-widest font-bold">
            The destination with the most votes will play automatically
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
