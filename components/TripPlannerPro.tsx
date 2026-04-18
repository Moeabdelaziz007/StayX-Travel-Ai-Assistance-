'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Calendar, 
  CurrencyDollar, 
  MapPin, 
  Download, 
  Star, 
  Clock, 
  Buildings,
  ArrowRight,
  CircleNotch,
  Warning
} from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { generateDetailedItinerary, getCityGuide, getLiveHotelPrices } from '@/lib/travel-tools';
import { toast } from 'sonner';
import NextImage from 'next/image';

const InteractiveMap = dynamic(
  () => import('./InteractiveMap').then(mod => mod.InteractiveMap),
  { ssr: false, loading: () => <div className="h-[300px] w-full bg-zinc-900 rounded-[2rem] flex items-center justify-center animate-pulse">Loading Map...</div> }
);

export function TripPlannerPro() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [budget, setBudget] = useState('moderate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [cityGuide, setCityGuide] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!destination) {
      toast.error("Please enter a destination");
      return;
    }
    setLoading(true);
    setCityGuide(null);
    setLivePrices(null);
    try {
      const dates = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const [data, guide, prices] = await Promise.all([
        generateDetailedItinerary({ 
          destination, 
          days: parseInt(days), 
          budget, 
          interests: selectedInterests 
        }),
        getCityGuide(destination),
        getLiveHotelPrices(destination, dates)
      ]);
      setTripData(data);
      if (guide) setCityGuide(guide.substring(0, 400) + '...');
      setLivePrices(prices);
      setActiveDay(0);
      toast.success("Itinerary generated!");
    } catch (e) {
      toast.error("Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;
    
    // Temporarily turn off animations and show all days for PDF capture
    const originalActive = activeDay;
    setActiveDay(-1); // special state to show all

    // Wait for react to render all days
    setTimeout(async () => {
      // Dynamic import
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Inject professional PDF styling for the exported element
      const style = document.createElement('style');
      style.innerHTML = `
        .pdf-export-only { display: block !important; }
        .ui-only { display: none !important; }
        body { font-family: 'Outfit', sans-serif; background: white !important; color: black !important; }
        h1, h2, h3, h4 { color: #000 !important; }
        .bg-zinc-900, .bg-zinc-950, .bg-zinc-900\\/40 { background-color: #f4f4f5 !important; color: #000 !important; border: 1px solid #d4d4d8 !important; }
        .text-white, .text-zinc-300, .text-zinc-400 { color: #000 !important; }
      `;
      document.head.appendChild(style);

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${destination}_StayX_Itinerary.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Apply PDF-specific class to wrap
      element.classList.add('pdf-mode');

      await html2pdf().set(opt).from(element).save();
      
      // Cleanup
      element.classList.remove('pdf-mode');
      document.head.removeChild(style);
      
      // Restore view
      setActiveDay(originalActive);
    }, 500);
  };

  const getImageUrl = (keyword: string) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword + ' scenic travel high quality 8k')}?width=1280&height=720&nologo=true`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-['Outfit']">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40 z-0" />
        
        {/* Animated Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]"
        />

        <div className="relative z-10 text-center space-y-6 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent"
          >
            Explore the Unseen
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-400 font-light"
          >
            Visual. Smart. Personalized.
          </motion.p>

          {/* Search Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 flex flex-col md:flex-row gap-4 p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl"
          >
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input 
                placeholder="Where to?" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-14 pl-12 bg-transparent border-none text-lg focus-visible:ring-0"
              />
            </div>
            <div className="w-full md:w-40">
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="h-14 bg-transparent border-white/10 rounded-2xl">
                  <Calendar className="mr-2 h-5 w-5" />
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {[1,2,3,4,5,7,10,14].map(d => (
                    <SelectItem key={d} value={d.toString()}>{d} Days</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger className="h-14 bg-transparent border-white/10 rounded-2xl">
                  <CurrencyDollar className="mr-2 h-5 w-5" />
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={loading}
              className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all hover:scale-105"
            >
              {loading ? <CircleNotch className="h-6 w-6 animate-spin" /> : <><Compass className="mr-2 h-6 w-6" /> Plan Trip</>}
            </Button>
          </motion.div>

          {/* Interests Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-6"
          >
            {["History", "Adventure", "Relaxation", "Food", "Culture", "Nightlife", "Nature", "Shopping", "Arts"].map((interest) => (
              <button
                key={interest}
                onClick={() => {
                  setSelectedInterests(prev => 
                    prev.includes(interest) 
                      ? prev.filter(i => i !== interest) 
                      : [...prev, interest]
                  );
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedInterests.includes(interest)
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                    : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-20 min-h-[60vh]">
        <AnimatePresence mode="wait">
          {!tripData && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 py-20"
            >
              <div className="h-32 w-32 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                <Compass className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-zinc-500">Your journey starts here</h3>
                <p className="text-zinc-600">Enter a destination to generate a personalized AI itinerary.</p>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 py-20"
            >
              <CircleNotch className="h-16 w-16 animate-spin text-indigo-500" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Crafting your adventure...</h3>
                <p className="text-zinc-400 animate-pulse">Consulting travel guides and local experts.</p>
              </div>
            </motion.div>
          )}

          {tripData && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
              ref={pdfRef}
            >
              {/* Trip Header */}
              <div className="relative h-[400px] rounded-[3rem] overflow-hidden group">
                <NextImage 
                  src={getImageUrl(destination)} 
                  alt={destination} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-12 w-full flex flex-col md:flex-row justify-between items-end gap-6">
                  <div className="space-y-4 max-w-2xl">
                    <h2 className="text-5xl font-bold text-white tracking-tight">{tripData.trip_title}</h2>
                    <p className="text-zinc-300 text-lg leading-relaxed">{tripData.summary}</p>
                    
                    {(cityGuide || livePrices) && (
                      <div className="flex flex-col gap-3 mt-4">
                        {cityGuide && (
                          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-sm text-zinc-300">
                            <strong>Wikivoyage Overview:</strong> {cityGuide}
                          </div>
                        )}
                        {livePrices && (
                          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 p-4 rounded-2xl text-sm text-emerald-100 flex items-start gap-3">
                            <CurrencyDollar className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
                            <p><strong>Live Market Prices (Search Grounded):</strong> {livePrices}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl text-center">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Cost</p>
                      <p className="text-xl font-bold text-emerald-400">{tripData.currency} {tripData.total_estimated_cost}</p>
                    </div>
                    <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl text-center">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-xl font-bold text-white">{tripData.daily_plan.length} Days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-bold text-white">Daily Itinerary</h3>
                    {activeDay !== -1 && (
                      <Button 
                        variant="outline" 
                        onClick={downloadPDF}
                        className="rounded-2xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 gap-2"
                      >
                        <Download className="h-5 w-5" /> Download PDF
                      </Button>
                    )}
                  </div>

                  {/* Day Tabs */}
                  {activeDay !== -1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                      {tripData.daily_plan.map((day: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveDay(i)}
                          className={`px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${
                            activeDay === i 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                              : 'bg-zinc-900/50 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Day {day.day}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Day Content */}
                  {(activeDay === -1 ? tripData.daily_plan : [tripData.daily_plan[activeDay]]).map((dayPlan: any, dayIndex: number) => (
                    <motion.div 
                      key={activeDay === -1 ? dayIndex : activeDay}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8 pb-12"
                    >
                      {activeDay === -1 && <h4 className="text-2xl font-bold text-white mb-2">Day {dayPlan.day}</h4>}
                      <div className="relative h-[250px] rounded-3xl overflow-hidden">
                        <NextImage 
                          src={getImageUrl(dayPlan.best_image_keyword)} 
                          alt="Day theme" 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <h4 className="text-3xl font-bold text-white">{dayPlan.theme}</h4>
                        </div>
                      </div>

                      <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                        {dayPlan.activities.map((act: any, i: number) => (
                          <div key={i} className="relative pl-12 group">
                            <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-zinc-950 group-hover:scale-125 transition-transform" />
                            <div className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl hover:bg-zinc-900/60 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                                  <Clock className="h-4 w-4" /> {act.time}
                                </div>
                                <span className="text-xs font-bold text-emerald-500">{act.cost}</span>
                              </div>
                              <h5 className="text-xl font-bold text-white mb-2">{act.activity}</h5>
                              <p className="text-zinc-400 text-sm leading-relaxed mb-4">{act.description}</p>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <MapPin className="h-3 w-3" /> {act.location}
                                </div>
                                {act.booking_link && (
                                  <a 
                                    href={act.booking_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                  >
                                    View Attraction <ArrowRight className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Hotels & Map */}
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Buildings className="h-8 w-8 text-indigo-500" /> Recommended Hotels
                    </h3>
                    <div className="space-y-4">
                      {tripData.hotels.map((hotel: any, i: number) => (
                        <div key={i} className="group bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden hover:bg-zinc-900/60 transition-all">
                          <div className="relative h-40">
                            <NextImage 
                              src={getImageUrl(hotel.image_keyword)} 
                              alt={hotel.name} 
                              fill 
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1 text-yellow-500 text-xs font-bold">
                              <Star className="h-3 w-3 fill-current" /> {hotel.rating}
                            </div>
                          </div>
                          <div className="p-6 space-y-2">
                            <h4 className="text-xl font-bold text-white">{hotel.name}</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed">{hotel.description}</p>
                            <div className="pt-4 flex justify-between items-center border-t border-zinc-800">
                              <span className="text-emerald-400 font-bold">{hotel.price_per_night} / night</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-indigo-400 hover:text-indigo-300 gap-1"
                                asChild
                              >
                                <a href={hotel.booking_link || "#"} target="_blank" rel="noopener noreferrer">
                                  Book Now <ArrowRight className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-white">Interactive Map</h3>
                    <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border border-zinc-800">
                      <InteractiveMap locations={tripData.daily_plan.flatMap((d: any) => d.activities.map((a: any) => ({ lat: a.lat, lng: a.lng, title: a.activity }))).filter((loc: any) => loc.lat && loc.lng)} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 text-center text-zinc-600 text-sm">
        <p>© 2026 StayX AI Travel Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}
