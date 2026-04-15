'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { BuddyCard } from '@/components/buddies/BuddyCard';
import { MatchModal } from '@/components/buddies/MatchModal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BuddiesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [optedIn, setOptedIn] = useState(false);

  useEffect(() => {
    const checkOptInAndFetch = async () => {
      if (!auth.currentUser) return;
      const profileRef = doc(db, 'users', auth.currentUser.uid, 'travelProfile', 'current');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists() && profileSnap.data().optIn) {
        setOptedIn(true);
        fetchMatches(profileSnap.data());
      } else {
        setLoading(false);
      }
    };
    checkOptInAndFetch();
  }, []);

  const fetchMatches = async (myProfile: any) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // 1. Find potential matches (simplified query for demo, in reality needs complex date overlap)
      const profilesRef = collection(db, 'users');
      // Note: A real implementation would need a collection group query or a flat 'travelProfiles' collection to query across all users efficiently.
      // For this prototype, we'll assume a flat collection 'travelProfiles' exists for querying.
      
      // Fetching matches from the matches collection where user is a participant
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('users', 'array-contains', auth.currentUser.uid), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      const fetchedMatches = [];
      for (const matchDoc of snapshot.docs) {
        const matchData = matchDoc.data();
        const otherUserId = matchData.users.find((id: string) => id !== auth.currentUser?.uid);
        
        // Fetch other user's profile
        const otherProfileSnap = await getDoc(doc(db, 'users', otherUserId, 'travelProfile', 'current'));
        if (otherProfileSnap.exists()) {
           fetchedMatches.push({
             id: matchDoc.id,
             ...matchData,
             otherUser: { userId: otherUserId, ...otherProfileSnap.data() }
           });
        }
      }
      setMatches(fetchedMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (matchId: string, otherUserId: string) => {
    if (!auth.currentUser) return;
    try {
      const matchRef = doc(db, 'matches', matchId);
      // Update status. In a real app, you'd check if the other user also accepted to change status to 'connected'
      await updateDoc(matchRef, {
        [`user${auth.currentUser.uid}Status`]: 'accepted'
      });
      
      // Send notification
      await setDoc(doc(collection(db, 'notifications')), {
        userId: otherUserId,
        title: 'New Connection Request',
        message: 'Someone wants to connect with you for a trip!',
        type: 'system',
        read: false,
        createdAt: serverTimestamp()
      });
      
      toast.success("Connection request sent!");
      setMatches(matches.filter(m => m.id !== matchId));
    } catch (error) {
      toast.error("Failed to connect.");
    }
  };

  const handlePass = async (matchId: string) => {
    if (!auth.currentUser) return;
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        [`user${auth.currentUser.uid}Status`]: 'declined',
        status: 'declined'
      });
      setMatches(matches.filter(m => m.id !== matchId));
    } catch (error) {
      toast.error("Failed to pass.");
    }
  };

  if (!optedIn && !loading) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[60vh] text-center">
        <h1 className="text-3xl font-bold mb-4">Travel Buddies</h1>
        <p className="text-zinc-400 mb-6 max-w-md">You need to opt-in to the matching feature in your travel profile to find travel buddies.</p>
        <Button>Go to Profile Settings</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Find Travel Buddies</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <div key={match.id} className="relative">
              <BuddyCard 
                match={match} 
                otherUser={match.otherUser} 
                onConnect={handleConnect} 
                onPass={handlePass} 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 text-xs bg-black/50 hover:bg-black/70"
                onClick={() => setSelectedMatch(match)}
              >
                Details
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-zinc-500 mt-20">
          <p>No new matches found at the moment.</p>
          <p className="text-sm mt-2">Try updating your travel dates or destination.</p>
        </div>
      )}

      <MatchModal 
        match={selectedMatch} 
        isOpen={!!selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
      />
    </div>
  );
}
