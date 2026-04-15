'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { motion } from 'motion/react';

export function MoodBoard({ destination }: { destination: string }) {
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      // Fallback to picsum if no API key
      const key = process.env.UNSPLASH_ACCESS_KEY;
      if (key) {
        try {
          const res = await fetch(`https://api.unsplash.com/search/photos?query=${destination}&per_page=6&client_id=${key}`);
          const data = await res.json();
          setImages(data.results);
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback
        setImages([
          { id: '1', urls: { regular: `https://picsum.photos/seed/${destination}1/400/300` }, alt_description: destination },
          { id: '2', urls: { regular: `https://picsum.photos/seed/${destination}2/400/300` }, alt_description: destination },
          { id: '3', urls: { regular: `https://picsum.photos/seed/${destination}3/400/300` }, alt_description: destination },
          { id: '4', urls: { regular: `https://picsum.photos/seed/${destination}4/400/300` }, alt_description: destination },
        ]);
      }
    };
    fetchImages();
  }, [destination]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((img, i) => (
        <motion.div 
          key={img.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="relative aspect-square rounded-2xl overflow-hidden"
        >
          <Image 
            src={img.urls.regular} 
            alt={img.alt_description || destination} 
            fill 
            className="object-cover hover:scale-110 transition-transform duration-500" 
            referrerPolicy="no-referrer"
          />
        </motion.div>
      ))}
    </div>
  );
}
