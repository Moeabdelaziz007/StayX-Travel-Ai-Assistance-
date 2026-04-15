'use client';
import { useTripPlanner } from '@/hooks/useTripPlanner';
import { TripChat } from '@/components/planner/TripChat';
import { ItineraryDisplay } from '@/components/planner/ItineraryDisplay';

export default function PlannerPage() {
  const { messages, itinerary, isLoading, sendMessage } = useTripPlanner();

  return (
    <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-screen">
      <TripChat messages={messages} onSendMessage={sendMessage} isLoading={isLoading} />
      {itinerary ? (
        <ItineraryDisplay itinerary={itinerary} />
      ) : (
        <div className="flex items-center justify-center border rounded-lg bg-zinc-950">
          <p className="text-zinc-400">Your itinerary will appear here once planned.</p>
        </div>
      )}
    </div>
  );
}
