'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';
import NextImage from 'next/image';

interface AnalysisResult {
  isValid: boolean;
  daysUntilExpiry: number;
  warnings: string[];
  recommendations: string[];
  extractedData: any;
}

export function DocumentAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const analyzeDocument = async () => {
    if (!file || !preview) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const base64Data = preview.split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              },
              {
                text: "Analyze this travel document image. Extract all relevant information and return as JSON. Also provide: 1) isValid (boolean — is it currently valid?), 2) daysUntilExpiry (number), 3) warnings (array of strings — any issues or things to be aware of), 4) recommendations (array of strings — actionable advice).",
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text || "{}";
      setResult(JSON.parse(resultText));
      toast.success("Document analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze document.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center hover:border-zinc-600 transition-colors">
        <input type="file" onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
          <Upload className="h-10 w-10 text-zinc-500" />
          <span className="text-zinc-400">Drag & drop or click to upload</span>
        </label>
      </div>

      {preview && (
        <div className="mt-4 relative h-48 w-full">
          <NextImage 
            src={preview} 
            alt="Preview" 
            fill 
            className="object-contain rounded-lg" 
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      {preview && (
        <Button onClick={analyzeDocument} disabled={isProcessing} className="w-full mt-4">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          {isProcessing ? "Analyzing..." : "Analyze Document"}
        </Button>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <Alert variant={result.isValid ? "default" : "destructive"}>
            {result.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>{result.isValid ? "Valid Document" : "Invalid or Expiring Document"}</AlertTitle>
            <AlertDescription>
              {result.daysUntilExpiry !== undefined && `Days until expiry: ${result.daysUntilExpiry}`}
            </AlertDescription>
          </Alert>
          
          {result.warnings.map((w, i) => (
            <Alert key={i} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{w}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-500 text-center">
        Privacy Disclaimer: Documents are processed in memory only and are not stored on our servers.
      </p>
    </div>
  );
}
