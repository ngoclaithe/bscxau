import React from 'react';
import { useTradingStore } from '@/stores/trading-store';
import { useAuthStore } from '@/stores/auth-store';
import { CandlestickChart } from '@/app/components/candlestick-chart';
import { TradingPanel } from '@/app/components/trading-panel';
import { socketService } from '@/lib/socket';
import * as Tabs from '@radix-ui/react-tabs';

import { formatSymbol } from '@/lib/utils';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const TradingPage: React.FC = () => {
  const {
    currentPrice,
    openOrders,
    closedOrders,
    timeframe,
    updatePrice,
    prices,
    fetchPairs,
    fetchMyTrades,
    selectedPair,
    pairs,
    setSelectedPair,
  } = useTradingStore();
  const { isAuthenticated } = useAuthStore();

  const [candleData, setCandleData] = React.useState<CandleData[]>([]);
  const lastCandleTimeRef = React.useRef<number>(0);
  const [prevPrice, setPrevPrice] = React.useState<number>(0);

  // Use BTC/USD as default - matches BE oracle symbol
  const currentSymbol = selectedPair?.symbol || 'BTC/USD';



  // Initialize candle data
  React.useEffect(() => {
    setCandleData([]);

    const loadCandles = async () => {
      const candles = await useTradingStore.getState().fetchCandles(currentSymbol);
      if (candles && candles.length > 0) {
        setCandleData(candles);
        const lastCandle = candles[candles.length - 1];
        lastCandleTimeRef.current = lastCandle.time;
      }
    };

    loadCandles();
  }, [currentSymbol]);

  React.useEffect(() => {
    socketService.connect();

    const handlePriceUpdate = (data: { pair: string; price: number; timestamp?: number }) => {
      const incomingPrice = Number(data.price);

      setPrevPrice((prev) => prev || incomingPrice);
      updatePrice(data.pair, incomingPrice); // Store price globally for the sidebar

      if (data.pair === currentSymbol) {
        const time = data.timestamp || Date.now();
        const currentMinute = Math.floor(time / 60000) * 60000;

        setCandleData((prev) => {
          if (prev.length === 0) {
            lastCandleTimeRef.current = currentMinute;
            return [{
              time: currentMinute,
              open: incomingPrice,
              high: incomingPrice,
              low: incomingPrice,
              close: incomingPrice,
            }];
          }

          const lastIndex = prev.length - 1;
          const lastCandle = prev[lastIndex];

          let effectiveMinute = currentMinute;
          // Compensate for potential clock skew between backend server time and Binance DB time
          if (effectiveMinute < lastCandle.time) {
            effectiveMinute = lastCandle.time;
          }

          const newData = [...prev];

          if (effectiveMinute > lastCandle.time) {
            lastCandleTimeRef.current = effectiveMinute;
            newData.push({
              time: effectiveMinute,
              open: incomingPrice,
              high: incomingPrice,
              low: incomingPrice,
              close: incomingPrice,
            });
            if (newData.length > 200) newData.shift();
          } else {
            const updatedCandle = { ...lastCandle };
            updatedCandle.close = incomingPrice;
            updatedCandle.high = Math.max(Number(updatedCandle.high), incomingPrice);
            updatedCandle.low = Math.min(Number(updatedCandle.low), incomingPrice);
            newData[lastIndex] = updatedCandle;
          }
          return newData;
        });
      }
    };

    socketService.onPriceUpdate(handlePriceUpdate);

    return () => {
      socketService.offPriceUpdate(handlePriceUpdate);
    };
  }, [updatePrice, currentSymbol]);

  React.useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchMyTrades(0, 10);
      const interval = setInterval(() => fetchMyTrades(0, 10), 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchMyTrades]);

  const activeOrders = openOrders.map((order) => ({
    id: order.id,
    entryPrice: order.entryPrice,
    direction: order.direction as 'UP' | 'DOWN',
    timeframe: order.timeframe || timeframe || 60,
    placedAt: order.openTime ? new Date(order.openTime).getTime() : (order.createdAt ? new Date(order.createdAt).getTime() : Date.now()),
  }));

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="trading-layout flex flex-col" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* ─── Main Trading Area ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left Sidebar: Market List */}
        <div className="w-[160px] shrink-0 border-r border-border bg-card/40 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thị trường</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pairs.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center">Đang tải...</div>
            ) : (
              pairs.map((pair) => {
                const isSelected = selectedPair?.id === pair.id || (!selectedPair && pair.symbol === 'BTC/USD');
                return (
                  <button
                    key={pair.id}
                    onClick={() => setSelectedPair(pair)}
                    className={`w-full px-3 py-3 text-left transition-colors border-b border-border/40 hover:bg-accent/50 ${isSelected ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : ''}`}
                  >
                    <div className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-foreground'}`}>
                      {formatSymbol(pair.symbol)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                      {formatPrice(prices[pair.symbol] || 0)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Chart Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-background overflow-hidden">


          {/* Chart */}
          <div className="flex-1 min-h-0 p-2">
            <CandlestickChart
              key={currentSymbol}
              symbol={currentSymbol}
              data={candleData}
              currentPrice={currentPrice}
              activeOrders={activeOrders}
            />
          </div>

          {/* Bottom Tabs: Positions / History */}
          <div className="border-t border-border bg-card/40 shrink-0 h-[20vh] flex flex-col">
            <Tabs.Root defaultValue="open" className="flex flex-col h-full">
              <Tabs.List className="flex gap-1 px-3 pt-2 border-b border-border/60">
                <Tabs.Trigger
                  value="open"
                  className="px-4 py-1.5 text-xs rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-amber-400 data-[state=active]:text-amber-400 text-muted-foreground transition-colors font-medium"
                >
                  Lệnh đang mở ({openOrders.length})
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="closed"
                  className="px-4 py-1.5 text-xs rounded-t-lg data-[state=active]:border-b-2 data-[state=active]:border-amber-400 data-[state=active]:text-amber-400 text-muted-foreground transition-colors font-medium"
                >
                  Lịch sử giao dịch
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="open" className="p-2 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <OrderListInline orders={openOrders} type="open" />
              </Tabs.Content>

              <Tabs.Content value="closed" className="p-2 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <OrderListInline orders={closedOrders.slice(0, 20)} type="closed" />
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>

        {/* Right Panel: Order / Trading Panel */}
        <div className="w-[280px] shrink-0 border-l border-border bg-card/40 overflow-y-auto">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đặt lệnh</span>
          </div>
          <div className="p-3">
            <TradingPanel />
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Inline compact order list for bottom panel ───
interface InlineOrderProps {
  orders: ReturnType<typeof useTradingStore.getState>['openOrders'];
  type: 'open' | 'closed';
}

const OrderListInline: React.FC<InlineOrderProps> = ({ orders, type }) => {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (type === 'open') {
      const interval = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [type]);

  const calcTimeLeft = (expireTime?: string) => {
    if (!expireTime) return 0;
    const now = Date.now();
    const expire = new Date(expireTime);
    if (isNaN(expire.getTime())) return 0;
    return Math.max(0, expire.getTime() - now);
  };

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (orders.length === 0) {
    return <div className="py-4 text-center text-xs text-muted-foreground">Chưa có lệnh nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b border-border/40">
            <th className="text-left py-1 px-2 font-medium">Cặp</th>
            <th className="text-left py-1 px-2 font-medium">Hướng</th>
            <th className="text-right py-1 px-2 font-medium">Số tiền</th>
            <th className="text-right py-1 px-2 font-medium">Giá vào</th>
            {type === 'open' && <th className="text-right py-1 px-2 font-medium">TG còn</th>}
            {type === 'closed' && <th className="text-right py-1 px-2 font-medium">Kết quả</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const timeLeft = type === 'open' ? calcTimeLeft(order.expireTime) : 0;
            const isWin = order.result?.result === 'WIN';
            return (
              <tr key={order.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                <td className="py-1.5 px-2 font-medium">{formatSymbol(order.pair?.symbol || 'BTC/USD')}</td>
                <td className="py-1.5 px-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {order.direction === 'UP' ? '▲ TĂNG' : '▼ GIẢM'}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right font-mono">{Number(order.amount || 0).toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right font-mono">{Number(order.entryPrice).toFixed(2)}</td>
                {type === 'open' && (
                  <td className="py-1.5 px-2 text-right font-mono text-amber-400">
                    {fmtTime(Math.floor(timeLeft / 1000))}
                  </td>
                )}
                {type === 'closed' && (
                  <td className={`py-1.5 px-2 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isWin ? `+${Number(order.result?.profit || 0).toFixed(2)}` : `-${Number(order.amount || 0).toFixed(2)}`}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
