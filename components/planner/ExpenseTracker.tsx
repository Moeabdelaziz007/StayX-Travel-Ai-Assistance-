'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  category: 'food' | 'transport' | 'activities' | 'other';
  amount: number;
  description: string;
}

export function ExpenseTracker({ budget }: { budget: number }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState<Expense['category']>('food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const remaining = budget - totalSpent;

  const addExpense = () => {
    if (!amount || !description) {
      toast.error("Please fill in all fields");
      return;
    }
    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      category,
      amount: parseFloat(amount),
      description,
    };
    setExpenses([...expenses, newExpense]);
    setAmount('');
    setDescription('');
    toast.success("Expense added!");
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-500" />
          Expense Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <p className="text-xs text-zinc-400">Budget</p>
            <p className="text-lg font-bold text-white">${budget}</p>
          </div>
          <div className={`p-4 rounded-xl bg-zinc-950 border ${remaining < 0 ? 'border-red-500' : 'border-zinc-800'}`}>
            <p className="text-xs text-zinc-400">Remaining</p>
            <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>${remaining}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Select value={category} onValueChange={(v: any) => setCategory(v)}>
            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="activities">Activities</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            type="number"
            placeholder="Amount ($)" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-white"
          />
          <Input 
            placeholder="Description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-white"
          />
          <Button onClick={addExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Expense
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {expenses.map(expense => (
            <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm">
              <div>
                <p className="text-white font-medium">{expense.description}</p>
                <p className="text-zinc-500 text-xs capitalize">{expense.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">${expense.amount}</span>
                <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)} className="h-6 w-6 text-zinc-500 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
