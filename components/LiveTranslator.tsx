'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, ArrowRightLeft, Loader2, Languages, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

const LANGUAGES = [
  { code: 'en-US', name: 'English', short: 'EN' },
  { code: 'ar-SA', name: 'Arabic', short: 'AR' },
  { code: 'fr-FR', name: 'French', short: 'FR' },
  { code: 'es-ES', name: 'Spanish', short: 'ES' },
  { code: 'ja-JP', name: 'Japanese', short: 'JA' },
  { code: 'tr-TR', name: 'Turkish', short: 'TR' },
  { code: 'it-IT', name: 'Italian', short: 'IT' },
];

export function LiveTranslator() {
  const [sourceLang, setSourceLang] = useState('en-US');
  const [targetLang, setTargetLang] = useState('ar-SA');
  
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  
  const [activeSpeaker, setActiveSpeaker] = useState<'source' | 'target' | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
      } else {
        console.warn('Speech recognition not supported in this browser.');
      }
    }
  }, []);

  const handleTranslate = async (text: string, fromCode: string, toCode: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }
    
    setIsTranslating(true);
    try {
      const fromLang = LANGUAGES.find(l => l.code === fromCode)?.name;
      const toLang = LANGUAGES.find(l => l.code === toCode)?.name;
      
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Translate the following conversational text from ${fromLang} to ${toLang}. Ensure the translation is natural and culturally appropriate for spoken conversation. Do not add notes, just output the translation. Text: "${text}"`;
      
      const result = await model.generateContent(prompt);
      const output = result.response.text().trim();
      setTranslatedText(output);
    } catch (e) {
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const startListening = (langCode: string, speakerMode: 'source' | 'target') => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported on this browser (Try Chrome).');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    }

    setActiveSpeaker(speakerMode);
    recognitionRef.current.lang = langCode;
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
        
      if (speakerMode === 'source') {
        setSourceText(transcript);
      } else {
        setTranslatedText(transcript); 
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setActiveSpeaker(null);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      const textToTranslate = speakerMode === 'source' ? sourceText : translatedText;
      if (textToTranslate) {
        if (speakerMode === 'source') {
          handleTranslate(textToTranslate, sourceLang, targetLang);
        } else {
          invertTranslation(textToTranslate);
        }
      }
      setActiveSpeaker(null);
    };

    recognitionRef.current.start();
  };

  const invertTranslation = async (text: string) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      const fromLang = LANGUAGES.find(l => l.code === targetLang)?.name;
      const toLang = LANGUAGES.find(l => l.code === sourceLang)?.name;
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Translate from ${fromLang} to ${toLang}. Output only translation. Text: "${text}"`;
      const result = await model.generateContent(prompt);
      const output = result.response.text().trim();
      setSourceText(output); 
    } catch {
      toast.error('Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setActiveSpeaker(null);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const speakText = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported.');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
          <Languages className="h-8 w-8 text-blue-500" />
          Live Local Translator
        </h2>
        <p className="text-zinc-400">Bridge the gap instantly. Speak or type to translate conversations.</p>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl">
        <Select value={sourceLang} onValueChange={setSourceLang}>
          <SelectTrigger className="flex-1 bg-zinc-950 border-0 h-14 text-lg font-medium rounded-xl">
            <SelectValue placeholder="Language 1" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {LANGUAGES.map(l => (
              <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="ghost" size="icon" onClick={swapLanguages} className="shrink-0 hover:bg-zinc-800 rounded-full h-12 w-12 text-zinc-400 hover:text-white transition-all">
          <ArrowRightLeft className="h-6 w-6" />
        </Button>
        
        <Select value={targetLang} onValueChange={setTargetLang}>
          <SelectTrigger className="flex-1 bg-zinc-950 border-0 h-14 text-lg font-medium rounded-xl">
            <SelectValue placeholder="Language 2" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {LANGUAGES.map(l => (
              <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Source Language Card */}
        <Card className={`relative overflow-hidden flex flex-col border-2 transition-all duration-500 ${activeSpeaker === 'source' ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-zinc-300 flex items-center gap-2">
                <Globe className="h-4 w-4" /> You ({LANGUAGES.find(l => l.code === sourceLang)?.short})
              </span>
              <Button variant="ghost" size="icon" onClick={() => speakText(sourceText, sourceLang)} className="text-zinc-500 hover:text-white rounded-full">
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
            
            <textarea
              className="flex-1 bg-transparent border-0 text-2xl font-medium text-white resize-none focus:outline-none placeholder:text-zinc-700"
              placeholder="Type or speak here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onBlur={() => handleTranslate(sourceText, sourceLang, targetLang)}
            />
          </div>
          
          <div className="p-4 bg-black/20 flex justify-center border-t border-zinc-800/50">
            <Button 
              size="lg" 
              className={`rounded-full h-16 w-16 shadow-2xl transition-all ${isListening && activeSpeaker === 'source' ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={() => isListening && activeSpeaker === 'source' ? stopListening() : startListening(sourceLang, 'source')}
            >
              {isListening && activeSpeaker === 'source' ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>
        </Card>

        {/* Target Language Card */}
        <Card className={`relative overflow-hidden flex flex-col border-2 transition-all duration-500 ${activeSpeaker === 'target' ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
          <AnimatePresence>
            {isTranslating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <div className="bg-black/80 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
                  <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                  <span className="font-medium text-white">Translating...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-zinc-300 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Local ({LANGUAGES.find(l => l.code === targetLang)?.short})
              </span>
              <Button variant="ghost" size="icon" onClick={() => speakText(translatedText, targetLang)} className="text-zinc-500 hover:text-white rounded-full">
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
            
            <textarea
              className="flex-1 bg-transparent border-0 text-2xl font-medium text-emerald-400 resize-none focus:outline-none placeholder:text-zinc-700"
              placeholder="Translation will appear here..."
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              readOnly={!isListening || activeSpeaker !== 'target'}
            />
          </div>
          
          <div className="p-4 bg-black/20 flex justify-center border-t border-zinc-800/50">
            <Button 
              size="lg" 
              className={`rounded-full h-16 w-16 shadow-2xl transition-all ${isListening && activeSpeaker === 'target' ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              onClick={() => isListening && activeSpeaker === 'target' ? stopListening() : startListening(targetLang, 'target')}
            >
              {isListening && activeSpeaker === 'target' ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
