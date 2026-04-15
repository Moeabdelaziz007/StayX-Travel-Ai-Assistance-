'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Share2, Mail, Check, X, Facebook, Twitter, Instagram, Send, Globe, MessageSquare } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export function SocialView() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Received invitations
    const q = query(
      collection(db, 'invitations'), 
      where('receiverEmail', '==', auth.currentUser.email),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // User's trips for sharing
    const qTrips = query(
      collection(db, 'trips'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeTrips = onSnapshot(qTrips, (snapshot) => {
      setTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeTrips();
    };
  }, []);

  const handleInvite = async () => {
    if (!email || !selectedTrip) {
      toast.error("Please enter an email and select a trip");
      return;
    }
    try {
      await addDoc(collection(db, 'invitations'), {
        senderId: auth.currentUser?.uid,
        senderName: auth.currentUser?.displayName,
        receiverEmail: email,
        bookingId: selectedTrip,
        bookingType: 'trip',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success("Invitation sent!");
      setEmail('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'invitations', id), { status });
      toast.success(`Invitation ${status}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = "Check out my latest travel plans on StayX!";
    let shareUrl = '';
    
    switch (platform.toLowerCase()) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'instagram':
        toast.info("Instagram sharing is best done via our mobile app. Copied link to clipboard!");
        navigator.clipboard.writeText(url);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-[3rem] overflow-hidden flex items-end p-12">
        <div className="absolute inset-0 bg-zinc-900">
          <Image 
            src="https://picsum.photos/seed/social/1200/600" 
            alt="Social" 
            fill
            className="object-cover opacity-30 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="px-3 py-1 rounded-full bg-green-500 text-black text-[10px] font-bold uppercase tracking-widest">Community</div>
            <span className="text-zinc-400 text-xs font-mono">Connect. Share. Explore.</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.8]"
          >
            Social <span className="text-green-500">Hub</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-zinc-400 text-lg leading-relaxed"
          >
            Your travel network, reimagined. Invite friends to join your journey or share your adventures with the world.
          </motion.p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Interactions */}
        <div className="lg:col-span-7 space-y-12">
          {/* Invite Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-4">
              <span className="h-px flex-1 bg-zinc-800" />
              Invite Friends
              <span className="h-px w-12 bg-green-500" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Friend&apos;s Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                  <Input 
                    placeholder="friend@example.com" 
                    className="h-14 pl-12 bg-zinc-900/50 border-zinc-800 text-white rounded-2xl focus:ring-green-500/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Trip</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                  <select 
                    className="w-full h-14 pl-12 bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none"
                    value={selectedTrip}
                    onChange={(e) => setSelectedTrip(e.target.value)}
                  >
                    <option value="">Choose a trip...</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>{trip.destination}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <Button 
              className="w-full h-16 rounded-2xl bg-green-500 hover:bg-green-600 text-black font-bold text-lg transition-all active:scale-[0.98]" 
              onClick={handleInvite}
            >
              <Send className="mr-2 h-5 w-5" />
              Dispatch Invitation
            </Button>
          </div>

          {/* Share Section */}
          <div className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Share2 className="h-32 w-32 text-green-500" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2">Broadcast Your Journey</h3>
              <p className="text-zinc-400 mb-8 max-w-md">Let your followers know where you&apos;re headed next. One-click sharing to all major platforms.</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
                  { name: 'Twitter', icon: Twitter, color: 'text-white' },
                  { name: 'Instagram', icon: Instagram, color: 'text-pink-500' }
                ].map(platform => (
                  <Button 
                    key={platform.name}
                    variant="outline" 
                    className="h-14 px-6 rounded-2xl border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:text-white flex items-center gap-3"
                    onClick={() => handleShare(platform.name)}
                  >
                    <platform.icon className={`h-5 w-5 ${platform.color}`} />
                    <span className="font-bold">{platform.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Inbox */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white italic uppercase tracking-tighter">Inbox</h2>
              <Badge className="bg-green-500 text-black font-bold">{invitations.length}</Badge>
            </div>
            
            <div className="space-y-4">
              {invitations.length === 0 && (
                <div className="text-center py-20 rounded-[2.5rem] border border-dashed border-zinc-800 bg-zinc-900/20">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-500 font-medium">Your inbox is quiet.</p>
                </div>
              )}
              {invitations.map(inv => (
                <motion.div 
                  key={inv.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between group hover:border-green-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-zinc-800 group-hover:border-green-500/30 transition-colors">
                      <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{inv.senderName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-white text-lg">{inv.senderName}</h4>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Invited you to a trip
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {inv.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          className="h-10 w-10 rounded-full bg-green-500 text-black hover:bg-green-400" 
                          onClick={() => handleStatus(inv.id, 'accepted')}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          className="h-10 w-10 rounded-full border-zinc-800 bg-zinc-950 text-red-500 hover:bg-red-500/10" 
                          onClick={() => handleStatus(inv.id, 'declined')}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <Badge className={`px-4 py-1.5 rounded-full font-bold ${inv.status === 'accepted' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {inv.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
