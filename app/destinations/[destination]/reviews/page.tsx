'use client';
import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { AISummary } from '@/components/reviews/AISummary';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';

export default function DestinationReviewsPage({ params }: { params: { destination: string } }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const destination = decodeURIComponent(params.destination);

  const fetchReviews = useCallback(async () => {
    const q = query(collection(db, 'reviews'), where('destination', '==', destination), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [destination]);

  const fetchSummary = useCallback(async () => {
    const summaryDoc = await getDoc(doc(db, 'destinations', destination, 'aiSummary', 'latest'));
    if (summaryDoc.exists()) {
      setSummary(summaryDoc.data());
    }
  }, [destination]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const [reviewsData, summaryData] = await Promise.all([fetchReviews(), fetchSummary()]);
      if (active) {
        // Data is already set by the fetch functions
      }
    };
    loadData();
    return () => { active = false; };
  }, [fetchReviews, fetchSummary]);


  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold">Reviews for {destination}</h1>
      
      {summary && <AISummary summary={summary} />}
      
      <ReviewForm destination={destination} onReviewSubmitted={fetchReviews} />
      
      <div className="grid gap-4">
        {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
      </div>
    </div>
  );
}
