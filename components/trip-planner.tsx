'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Hotel, MapPin, Sparkles, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ExpenseTracker } from './planner/ExpenseTracker';

export function TripPlanner() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [airline, setAirline] = useState('');
  const [hotelChain, setHotelChain] = useState('');
  const [activities, setActivities] = useState('');
  const [budget, setBudget] = useState(2000);

  const handlePlanTrip = () => {
    if (!destination) {
      toast.error("Please enter a destination");
      return;
    }
    toast.success(`Planning your trip to ${destination} from ${startDate} to ${endDate}!`);
    console.log({ destination, startDate, endDate, airline, hotelChain, activities });
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-500" />
            AI Trip Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Destination Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Destination
            </h3>
            <Input 
              placeholder="Where to?" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Start
              </h3>
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> End
              </h3>
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400">Preferences</h3>
            <Select onValueChange={(v: string | null) => v && setAirline(v)}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                <SelectValue placeholder="Preferred Airline" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="jal">Japan Airlines</SelectItem>
                <SelectItem value="ana">All Nippon Airways</SelectItem>
                <SelectItem value="emirates">Emirates</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(v: string | null) => v && setHotelChain(v)}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                <SelectValue placeholder="Preferred Hotel Chain" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="hilton">Hilton</SelectItem>
                <SelectItem value="marriott">Marriott</SelectItem>
                <SelectItem value="hyatt">Hyatt</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Activities (e.g., Sushi, Temples)" 
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
            <Input 
              type="number"
              placeholder="Total Budget ($)" 
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>

          <Button onClick={handlePlanTrip} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold">
            Plan My Trip
          </Button>
        </CardContent>
      </Card>
      
      <ExpenseTracker budget={budget} />
    </div>
  );
}
