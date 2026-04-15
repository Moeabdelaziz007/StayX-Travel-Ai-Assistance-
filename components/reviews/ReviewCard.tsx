'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';

interface Review {
  id: string;
  displayName: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
}

export function ReviewCard({ review }: { review: Review }) {
  const handleHelpful = async () => {
    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        helpful: increment(1)
      });
      toast.success("Helpful vote recorded!");
    } catch (error) {
      toast.error("Failed to vote.");
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          {review.title}
          <div className="flex items-center gap-1 text-yellow-400">
            {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400" />)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-300 mb-4">{review.body}</p>
        <div className="flex justify-between items-center text-sm text-zinc-500">
          <span>By {review.displayName}</span>
          <Button variant="ghost" size="sm" onClick={handleHelpful}>
            <ThumbsUp className="h-4 w-4 mr-1" /> {review.helpful}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
