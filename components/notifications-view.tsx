'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle2, Info, AlertCircle, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success("Notification deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'booking': return <Info className="h-5 w-5 text-blue-500" />;
      case 'invitation': return <Bell className="h-5 w-5 text-green-500" />;
      default: return <AlertCircle className="h-5 w-5 text-zinc-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-light text-white tracking-tight">Notifications</h1>
        <p className="text-zinc-500 text-sm">Stay updated with your bookings, payments, and invites.</p>
      </header>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <div className="text-center py-20 text-zinc-600 border border-zinc-800/50 rounded-3xl bg-zinc-900/20">
            <BellOff className="h-10 w-10 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">All caught up!</p>
          </div>
        )}
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`group flex items-start gap-4 p-6 rounded-2xl border transition-all ${
              notif.read 
                ? 'bg-zinc-900/20 border-zinc-800/50 opacity-60' 
                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className={`mt-1 p-2 rounded-full ${notif.read ? 'bg-zinc-800/50' : 'bg-green-500/10'}`}>
              {getIcon(notif.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className={`text-sm font-medium ${notif.read ? 'text-zinc-400' : 'text-white'}`}>{notif.title}</h4>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{notif.message}</p>
              
              <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notif.read && (
                  <button className="text-[10px] uppercase tracking-widest font-bold text-green-500 hover:text-green-400" onClick={() => markAsRead(notif.id)}>
                    Mark as read
                  </button>
                )}
                <button className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 hover:text-red-500 flex items-center gap-1" onClick={() => deleteNotification(notif.id)}>
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
