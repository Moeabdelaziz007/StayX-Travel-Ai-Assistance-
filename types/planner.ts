export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  morning: { activity: string; location: string; duration: string; cost: number; tips: string };
  afternoon: { activity: string; location: string; duration: string; cost: number; tips: string };
  evening: { activity: string; location: string; duration: string; cost: number; tips: string };
  meals: { name: string; cuisine: string; priceRange: string; mustTry: string }[];
}

export interface Itinerary {
  destination: string;
  totalBudget: { flights: number; hotels: number; food: number; activities: number; total: number };
  days: ItineraryDay[];
  practicalInfo: { bestTimeToVisit: string; currency: string; language: string; emergencyNumbers: string[]; packingTips: string[] };
  hiddenGems: { name: string; description: string; why: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
