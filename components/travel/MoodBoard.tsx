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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
      {images.map((img, i) => (
        <motion.div 
          key={img.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative rounded-[2rem] overflow-hidden group border border-white/5 ${
            i === 0 ? 'md:col-span-2 md:row-span-2' : ''
          } ${i === 3 ? 'md:col-span-2' : ''}`}
        >
          <Image 
            src={img.urls?.regular || img.urls?.small || img.urls} 
            alt={img.alt_description || destination} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-4 left-4 right-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <p className="text-white text-xs font-bold truncate">{img.alt_description || `View of ${destination}`}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
