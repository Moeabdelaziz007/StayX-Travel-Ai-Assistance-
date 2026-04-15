'use client';
import { Itinerary } from '@/types/planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
}

export function ItineraryDisplay({ itinerary }: ItineraryDisplayProps) {
  const budgetData = [
    { name: 'Flights', value: itinerary.totalBudget.flights },
    { name: 'Hotels', value: itinerary.totalBudget.hotels },
    { name: 'Food', value: itinerary.totalBudget.food },
    { name: 'Activities', value: itinerary.totalBudget.activities },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderActivity = (activity: any, label: string) => (
    <Card className="mb-4 bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-emerald-400">{label}: {activity.activity}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-zinc-300 space-y-1">
        <p>📍 {activity.location} ({activity.duration})</p>
        <p>💰 Cost: ${activity.cost}</p>
        <p>💡 Tips: {activity.tips}</p>
        {activity.notes && <p>📝 Notes: {activity.notes}</p>}
        {activity.bookingLink && (
          <a href={activity.bookingLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            🔗 Book Now
          </a>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Your Trip to {itinerary.destination}</h1>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={budgetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {budgetData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <Tabs defaultValue="day-1">
        <TabsList className="bg-zinc-800">
          {itinerary.days.map((day) => (
            <TabsTrigger key={day.dayNumber} value={`day-${day.dayNumber}`} className="data-[state=active]:bg-emerald-600">Day {day.dayNumber}</TabsTrigger>
          ))}
        </TabsList>
        {itinerary.days.map((day) => (
          <TabsContent key={day.dayNumber} value={`day-${day.dayNumber}`}>
            <h2 className="text-xl font-semibold text-white mb-4">{day.theme}</h2>
            {renderActivity(day.morning, 'Morning')}
            {renderActivity(day.afternoon, 'Afternoon')}
            {renderActivity(day.evening, 'Evening')}
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex gap-2">
        <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700">Export PDF</Button>
      </div>
    </div>
  );
}
