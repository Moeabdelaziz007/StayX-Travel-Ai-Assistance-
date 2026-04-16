'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, RefreshCw, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ExchangeRates {
  [key: string]: number;
}

export function CurrencyWidget({ defaultTarget = 'EUR' }: { defaultTarget?: string }) {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState(defaultTarget);
  const [amount, setAmount] = useState<string>('100');
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      setRates(data.rates);
      
      const date = new Date(data.time_last_update_unix * 1000);
      setLastUpdated(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Could not load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [baseCurrency]);

  const handleSwap = () => {
    setBaseCurrency(targetCurrency);
    setTargetCurrency(baseCurrency);
  };

  const getConvertedAmount = () => {
    if (!rates || !amount || isNaN(Number(amount))) return '0.00';
    const rate = rates[targetCurrency];
    if (!rate) return '0.00';
    return (Number(amount) * rate).toFixed(2);
  };

  // Common currencies for the dropdown
  const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AED', 'SAR', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

  return (
    <Card className="w-full bg-zinc-900/50 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="bg-emerald-500/20 p-1.5 rounded-md text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
            Currency Converter
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchRates} 
            disabled={loading}
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Amount</label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-2 pr-12 text-lg font-semibold bg-zinc-950/50 border-zinc-800 focus-visible:ring-emerald-500 rounded-xl"
              />
              <select 
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="absolute right-0 top-0 bottom-0 bg-transparent border-l border-zinc-800/50 px-2 text-xs font-bold text-zinc-300 focus:outline-none rounded-r-xl outline-none"
              >
                {commonCurrencies.map(cur => (
                  <option key={`base-${cur}`} value={cur} className="bg-zinc-900">{cur}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleSwap}
            className="h-8 w-8 rounded-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-emerald-400 shadow-md"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Converted</label>
            <div className="relative">
              <div className="flex items-center w-full h-10 pl-3 pr-12 bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
                <span className="text-lg font-bold text-emerald-400 truncate">
                  {rates ? getConvertedAmount() : '...'}
                </span>
              </div>
              <select 
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="absolute right-0 top-0 bottom-0 bg-zinc-800/20 border-l border-zinc-800/50 px-2 text-xs font-bold text-zinc-300 focus:outline-none rounded-r-xl outline-none"
              >
                {commonCurrencies.map(cur => (
                  <option key={`target-${cur}`} value={cur} className="bg-zinc-900">{cur}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {rates && (
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800/50">
            <span className="text-[10px] font-medium text-zinc-500">
              1 {baseCurrency} = {rates[targetCurrency]?.toFixed(4)} {targetCurrency}
            </span>
            <span className="text-[10px] text-zinc-600">
              Updated {lastUpdated}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
