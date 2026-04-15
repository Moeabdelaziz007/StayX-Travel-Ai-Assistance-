'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface AISummaryProps {
  summary: {
    text: string;
    reviewCount: number;
  };
}

export function AISummary({ summary }: AISummaryProps) {
  return (
    <Card className="bg-zinc-900 border-green-900/30 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Sparkles className="h-5 w-5" />
          AI Summary
        </CardTitle>
        <Badge variant="outline" className="w-fit text-zinc-400">
          Based on {summary.reviewCount} reviews
        </Badge>
      </CardHeader>
      <CardContent className="text-zinc-300 leading-relaxed">
        {summary.text}
      </CardContent>
    </Card>
  );
}
