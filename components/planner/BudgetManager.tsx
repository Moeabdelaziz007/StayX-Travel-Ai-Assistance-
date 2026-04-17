'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, Plus, DollarSign, Wallet, TrendingDown, Lightbulb, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['food', 'transport', 'activities', 'other'];
const CATEGORY_COLORS: Record<string, string> = {
  food: '#f59e0b',       // amber-500
  transport: '#3b82f6',  // blue-500
  activities: '#10b981', // emerald-500
  other: '#8b5cf6',      // violet-500
};

export function BudgetManager() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(3000); // Default simulated trip budget
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Expense form
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Fetch expenses
  useEffect(() => {
    if (!user) return;
    
    // In a real app we'd filter by active Trip ID, but here we'll filter by user for simplicity
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      setLoading(false);
    }, (error) => {
      // Don't crash hard if index is missing yet, just show empty
      console.warn("Could not fetch expenses:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle dynamic currency exchange using the free er-api
  useEffect(() => {
    const fetchRate = async () => {
      if (currency === 'USD') {
        setExchangeRate(1);
        return;
      }
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        const data = await response.json();
        // We want to convert TO USD for our base budget tracking
        if (data && data.rates && data.rates.USD) {
          setExchangeRate(data.rates.USD);
        }
      } catch (err) {
        console.error("Exchange rate failed", err);
      }
    };
    fetchRate();
  }, [currency]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;
    setIsAdding(true);
    
    try {
      const numericAmount = parseFloat(amount);
      const convertedAmount = currency === 'USD' ? numericAmount : numericAmount * exchangeRate;
      
      await addDoc(collection(db, 'expenses'), {
        userId: user.uid,
        amount: convertedAmount,
        originalAmount: numericAmount,
        originalCurrency: currency,
        description,
        category,
        createdAt: serverTimestamp(),
      });
      setAmount('');
      setDescription('');
      toast.success('Expense added to your budget');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
      toast.error('Failed to log expense');
    } finally {
      setIsAdding(false);
    }
  };

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenses]);

  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(categoryTotals).map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: categoryTotals[cat],
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
    })).filter(d => d.value > 0);
  }, [expenses]);

  const budgetRemaining = budget - totalSpent;
  const percentUsed = Math.min((totalSpent / budget) * 100, 100);
  const isNearingBudget = percentUsed >= 80;
  const isOverBudget = percentUsed >= 100;

  if (loading) {
    return (
      <Card className="w-full h-64 flex items-center justify-center bg-zinc-900/50 border-white/5 rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl overflow-hidden shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Budget</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-3xl font-black text-white">${budget.toLocaleString()}</h3>
                </div>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-emerald-500/10 rounded-full text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl overflow-hidden shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Spent</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-3xl font-black text-rose-400">${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                </div>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-rose-500/10 rounded-full text-rose-400">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-zinc-800 rounded-xl overflow-hidden shadow-md ${isOverBudget ? 'bg-rose-500/10 border-rose-500/50' : isNearingBudget ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-900/60'}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${isOverBudget ? 'text-rose-400' : isNearingBudget ? 'text-amber-500' : 'text-zinc-500'}`}>Remaining</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className={`text-3xl font-black ${isOverBudget ? 'text-rose-500' : 'text-emerald-400'}`}>
                    ${Math.max(budgetRemaining, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </h3>
                </div>
              </div>
              <div className="h-10 flex items-center">
                 <span className="text-sm font-bold text-zinc-400">{percentUsed.toFixed(1)}% Used</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar & AI Warnings */}
      <div className="space-y-4">
        <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : isNearingBudget ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        
        {isNearingBudget && (
          <div className={`p-4 rounded-xl flex items-start gap-4 ${isOverBudget ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            {isOverBudget ? <AlertCircle className="h-6 w-6 text-rose-500 shrink-0" /> : <Lightbulb className="h-6 w-6 text-amber-500 shrink-0" />}
            <div>
              <h4 className={`text-sm font-bold ${isOverBudget ? 'text-rose-400' : 'text-amber-500'}`}>
                {isOverBudget ? "Budget Exceeded!" : "Nearing Budget Limit"}
              </h4>
              <p className="text-xs text-zinc-300 mt-1">
                {isOverBudget 
                  ? "You have exceeded your planned trip budget. Consider skipping paid excursions or swapping upcoming restaurant reservations for street food/markets." 
                  : "You've used over 80% of your budget. Our AI suggests taking public transit (Metro/Bus) instead of Taxis for the remainder of your trip to save an estimated $120."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown Chart */}
        <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <PieChart className="h-8 w-8 text-zinc-700" />
                <p className="text-xs font-bold uppercase tracking-widest">No expenses yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Expense Form */}
        <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Log New Expense</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="bg-zinc-950 border-zinc-800 text-white rounded-lg focus-visible:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Currency</label>
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Dinner at Burj Khalifa" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-white rounded-lg focus-visible:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={isAdding || !amount || !description} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg mt-2">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Log Expense</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Feed of recent expenses */}
      {expenses.length > 0 && (
        <Card className="bg-zinc-900/60 border-zinc-800 rounded-xl overflow-hidden mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other }} />
                    <div>
                      <p className="text-sm font-bold text-white">{expense.description}</p>
                      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${expense.amount?.toFixed(2)}</p>
                    {expense.originalCurrency !== 'USD' && (
                      <p className="text-[10px] text-zinc-500">{expense.originalAmount} {expense.originalCurrency}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
