# StayX - AI-Powered Travel Assistant

StayX is a modern travel application that leverages Google Gemini AI to provide a seamless travel planning and booking experience.

## Features

### 🎙️ AI Voice Assistant
- **Real-time Interaction**: Powered by Gemini Live API (`gemini-2.0-flash-exp`).
- **Voice Orb UI**: Animated visual feedback for listening, thinking, and speaking states.
- **Tool Calling**: The AI can check weather, search flights, plan itineraries, and more via voice commands.

### 📅 Smart Trip Planning
- **Detailed Itineraries**: Generate day-by-day plans with activities and estimated costs.
- **Google Calendar Integration**: Sync your trips and bookings directly to your Google Calendar.
- **Notifications**: Smart notification system with custom sounds for new bookings and events.

### ✈️ Travel Integrations
- **Flights & Hotels**: Integrated with Travelpayouts (Aviasales & Hotellook) for real-time search and affiliate bookings.
- **SIM Cards**: Find and purchase travel eSIMs (Airalo, Holafly) directly through the assistant.
- **Weather & Info**: Real-time weather data via Open-Meteo and comprehensive country information via RestCountries.
- **Visuals**: AI-generated destination images powered by Pollinations AI.

### 🎥 Watch Together
- **Synced Video Rooms**: Watch travel videos with friends in real-time with synchronized playback and chat.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Google Gemini API, Groq
- **Database & Auth**: Firebase (Firestore, Realtime Database, Auth)
- **Styling**: Tailwind CSS, Framer Motion
- **Payments**: Stripe Integration

## Getting Started

1. **Configure Environment Variables**:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `TRAVELPAYOUTS_AFFILIATE_ID`
   - `STRIPE_SECRET_KEY`

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Current Status
- ✅ AI Voice Assistant Core
- ✅ Travelpayouts Integration (Flights, Hotels)
- ✅ SIM Card Affiliate Integration
- ✅ RestCountries & Pollinations AI Tools
- ✅ Google Calendar Sync (Simulated & OAuth Placeholder)
- 🚧 PWA Support (Temporarily Disabled for Stability)
