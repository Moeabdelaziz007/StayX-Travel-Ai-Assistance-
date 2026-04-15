'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface ReviewFormProps {
  destination: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ destination, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || title.length < 5 || body.length < 100) {
      toast.error("Please fill in all fields correctly.");
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        destination,
        rating,
        title,
        body,
        helpful: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Review submitted!");
      onReviewSubmitted();
    } catch (error) {
      toast.error("Failed to submit review.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-zinc-950">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`cursor-pointer ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`} onClick={() => setRating(star)} />
        ))}
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (max 100 chars)" maxLength={100} />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your review (min 100 chars)" maxLength={2000} />
      <p className="text-xs text-zinc-500">{body.length}/2000</p>
      <Button type="submit">Submit Review</Button>
    </form>
  );
}
