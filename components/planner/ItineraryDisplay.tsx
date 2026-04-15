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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Trip to {itinerary.destination}</h1>
      
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
        <TabsList>
          {itinerary.days.map((day) => (
            <TabsTrigger key={day.dayNumber} value={`day-${day.dayNumber}`}>Day {day.dayNumber}</TabsTrigger>
          ))}
        </TabsList>
        {itinerary.days.map((day) => (
          <TabsContent key={day.dayNumber} value={`day-${day.dayNumber}`}>
            <Card>
              <CardHeader><CardTitle>{day.theme}</CardTitle></CardHeader>
              <CardContent>
                <p>Morning: {day.morning.activity} at {day.morning.location}</p>
                <p>Afternoon: {day.afternoon.activity} at {day.afternoon.location}</p>
                <p>Evening: {day.evening.activity} at {day.evening.location}</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex gap-2">
        <Button onClick={() => window.print()}>Export PDF</Button>
      </div>
    </div>
  );
}
