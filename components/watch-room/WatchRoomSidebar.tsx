'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, MapPin } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import Markdown from 'react-markdown';

import { useI18n } from '@/lib/i18n';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

interface WatchRoomSidebarProps {
  videoTitle: string;
  videoDescription?: string;
}

export function WatchRoomSidebar({ videoTitle, videoDescription }: WatchRoomSidebarProps) {
  const { language } = useI18n();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [destination, setDestination] = useState('Loading...');

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      if (!videoTitle) return;
      
      setIsLoading(true);
      setContent('');
      setDestination('Loading...');
      
      try {
        // First, quickly extract destination name
        const destResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Extract the main travel destination (city or country) from this video title: "${videoTitle}". Just return the name, nothing else. If none, return "this destination".`
        });
        const dest = destResponse.text?.trim() || 'this destination';
        if (isMounted) setDestination(dest);

        const systemInstruction = `You are a travel expert. Based on the video content about ${dest}, provide: 1) Best time to visit, 2) Current average hotel prices, 3) Top 3 must-do activities, 4) Visa requirements for Egyptian travelers, 5) Estimated total trip budget for 7 days. Format the response nicely using Markdown. ${language === 'ar' ? 'Please provide the response in Arabic.' : 'Please provide the response in English.'}`;

        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.0-flash',
          contents: `Video Title: ${videoTitle}\nVideo Description: ${videoDescription || 'N/A'}\n\nPlease provide the travel insights.`,
          config: {
            systemInstruction,
          }
        });

        for await (const chunk of responseStream) {
          if (!isMounted) break;
          setContent((prev) => prev + chunk.text);
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
        if (isMounted) setContent("Failed to load travel insights. Please check your API key or connection.");
        if (isMounted) setDestination('Unknown Destination');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInsights();

    return () => {
      isMounted = false;
    };
  }, [videoTitle, videoDescription]);

  const handleAddToWishlist = async () => {
    if (!auth.currentUser) {
      toast.error("Please log in to add to wishlist");
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'wishlist'), {
        destination,
        videoTitle,
        addedAt: serverTimestamp(),
        type: 'destination_insight'
      });
      toast.success(`${destination} added to wishlist!`);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <Card className="flex flex-col h-full border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-500" />
          <h3 className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">{destination}</h3>
          {!isLoading && destination !== 'Loading...' && destination !== 'Unknown Destination' && (
            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 ml-2 hidden sm:inline-flex">
              AI Insight
            </Badge>
          )}
        </div>
        <Button 
          size="sm" 
          onClick={handleAddToWishlist}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline">{language === 'ar' ? 'أضف إلى قائمة الأمنيات' : 'Add to Wishlist'}</span>
        </Button>
      </div>

      <CardContent className="p-4 overflow-y-auto custom-scrollbar flex-1">
        <Accordion defaultValue={['insights']} className="w-full">
          <AccordionItem value="insights" className="border-zinc-800">
            <AccordionTrigger className="text-white hover:text-green-400 hover:no-underline">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                {language === 'ar' ? 'رؤى السفر بالذكاء الاصطناعي' : 'AI Travel Insights'}
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-zinc-300">
              {isLoading && !content ? (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                  <Skeleton className="h-4 w-5/6 bg-zinc-800" />
                  <Skeleton className="h-20 w-full bg-zinc-800 mt-4" />
                  <Skeleton className="h-4 w-2/3 bg-zinc-800" />
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                  <Markdown>{content}</Markdown>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
