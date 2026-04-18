# StayX - AI-Powered Travel Assistant 🌍

StayX is a comprehensive AI travel platform powered by Google Gemini, offering voice assistance, smart trip planning, real-time price comparison, and social travel features.

## 🚀 Key Features

### 🎙️ AI Voice Agent (Gemini Live)
- **Real-time Interaction**: Powered by Gemini 2.0 Flash for low-latency voice chat.
- **Animated VoiceOrb**: Fluid visual feedback indicating listening, thinking, and speaking states.
- **Advanced Tool Calling**: Seamlessly execute weather checks, flight searches, hotel bookings, and calendar updates via voice.
- **Google Calendar Sync**: View and manage your travel schedule with direct integration.

### 📋 Smart Dashboard & Widgets
- **Weather Widget**: Real-time forecasts for any destination via Open-Meteo.
- **Currency Converter**: Instant exchange rates for various currencies using the ExchangeRate API.
- **AI Visa Helper**: Personalized visa requirement analysis powered by AI.
- **Progress Tracker**: Quick actions and trip status monitoring at a glance.
- **Travel Mood Board**: Curated travel inspiration from Unsplash.
- **Arabic Travelers**: Showcase of the top Middle Eastern travel influencers and creators.

### ✈️ SmartGet Search Engine
- **AI-Powered Comparison**: Real-time price analysis with Gemini Grounding (Google Search).
- **Foursquare Integration**: Discover top-rated local spots, restaurants, and hidden gems.
- **Multimodal Search**: Supports voice, visual (image analysis), and smart text autocomplete.
- **Category Filtering**: Granular filters for hotels, flights, and dining.

### 🗺️ AI Trip Planner Pro
- **Dynamic Itineraries**: AI-generated day-by-day plans tailored to your interests.
- **Budget Management**: Set and track travel budgets effectively.
- **Expense Tracker**: Persistent logging of travel costs synced to Firestore.
- **City Guides & PDF Export**: Detailed local info with the ability to export plans for offline use.

### 🎥 STAYTV Watch Room
- **Social Viewing**: Synchronized YouTube playback for planning trips with friends.
- **AI Chat Moderation**: Real-time chat with AI commands for specific travel insights per video.
- **Room Invitations**: Collaborative planning via Firestore-backed invitation system.

### 🌐 International Tools
- **Live Translator**: Real-time speech and text translation powered by Gemini.
- **Travel Phrasebook**: Instant access to essential local phrases.
- **Travel Buddy Matching**: AI-driven compatibility analysis based on interests and travel styles.
- **Document Analyzer**: Smart scanning and analysis of passports, tickets, and bookings.

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **AI Backend:** Google Gemini 2.0 Flash (Live), Groq (Llama 3), Pollinations AI
- **Database & Auth:** Firebase (Firestore, Authentication)
- **Styling:** Tailwind CSS 4, Shadcn UI, Framer Motion
- **Third-Party APIs:** TravelPayouts, Foursquare, Open-Meteo, RestCountries, Unsplash, YouTube
- **Payments:** Stripe (Affiliate & Direct)
- **Maps:** Leaflet + Nominatim

## ⚙️ Environment Variables
```env
# AI & Search
NEXT_PUBLIC_GEMINI_API_KEY=
GROQ_API_KEY=

# Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_FOURSQUARE_API_KEY=
TRAVELPAYOUTS_AFFILIATE_ID=
AIRALO_AFFILIATE_ID=
UNSPLASH_ACCESS_KEY=

# Backend & Payments
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
STRIPE_SECRET_KEY=
```

## 📦 Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure your `.env.local` based on `.env.example`.
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)
