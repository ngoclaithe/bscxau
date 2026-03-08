import React from 'react';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { useTradingStore } from '@/stores/trading-store';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from './ui/input';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { toast } from 'sonner';

export const TradingPanel: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    selectedPair,
    timeframe,
    amount,
    setTimeframe,
    setAmount,
    placeTrade,
    fetchPairs,
  } = useTradingStore();

  React.useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  const timeframes = [
    { value: 60, label: '1 phút' },
    { value: 180, label: '3 phút' },
    { value: 300, label: '5 phút' },
    { value: 600, label: '10 phút' },
    { value: 900, label: '15 phút' },
  ];

  const payout = selectedPair?.payoutRate || 0.85;
  const estimatedProfit = amount * payout;

  const handleTrade = async (direction: 'UP' | 'DOWN') => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập trước');
      return;
    }
    if (amount < 1) {
      toast.error('Số tiền tối thiểu là 1 VND');
      return;
    }
    try {
      await placeTrade(direction);
      toast.success(`Đã đặt lệnh ${direction === 'UP' ? 'TĂNG' : 'GIẢM'} thành công!`);
    } catch (error: any) {
      toast.error(error.message || 'Đặt lệnh thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs mb-1.5 text-muted-foreground font-medium">Thời gian</label>
        <div className="grid grid-cols-3 gap-1.5">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2 py-1.5 rounded-md text-xs transition-colors ${timeframe === tf.value
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              <Clock className="h-3 w-3 inline mr-0.5" />
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1.5 text-muted-foreground font-medium">Số tiền (VND)</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          min={1}
          step={1}
          placeholder="Nhập số tiền"
          className="h-9 text-sm"
        />
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {[
            { v: 10000, l: '10k' },
            { v: 20000, l: '20k' },
            { v: 50000, l: '50k' },
            { v: 100000, l: '100k' },
            { v: 500000, l: '500k' },
            { v: 1000000, l: '1M' },
            { v: 5000000, l: '5M' },
            { v: 10000000, l: '10M' },
          ].map((preset) => (
            <button
              key={preset.v}
              onClick={() => setAmount(preset.v)}
              className="px-1 py-1 rounded-md text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full text-center whitespace-nowrap"
            >
              {preset.l}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 border border-border/40 p-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Tỷ lệ thanh toán</span>
          <span className="font-semibold text-emerald-400">{formatPercent(payout * 100, 0)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Lợi nhuận dự kiến</span>
          <span className="font-semibold">{formatCurrency(estimatedProfit)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Tổng nhận về</span>
          <span className="font-bold text-amber-400">{formatCurrency(amount + estimatedProfit)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => handleTrade('UP')}
          disabled={!isAuthenticated || !selectedPair}
          className="flex items-center justify-center gap-1.5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
        >
          <ArrowUp className="h-4 w-4" />
          Tăng
        </button>
        <button
          onClick={() => handleTrade('DOWN')}
          disabled={!isAuthenticated || !selectedPair}
          className="flex items-center justify-center gap-1.5 py-3 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
        >
          <ArrowDown className="h-4 w-4" />
          Giảm
        </button>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-center text-muted-foreground">
          Đăng nhập để bắt đầu giao dịch
        </p>
      )}
    </div>
  );
};
