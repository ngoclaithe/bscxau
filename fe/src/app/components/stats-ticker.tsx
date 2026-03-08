import React from 'react';
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export const StatsTicker: React.FC = () => {
  const [stats, setStats] = React.useState({
    volume24h: 15420350.75,
    activeTraders: 3456,
    totalTrades: 45678,
    avgPayout: 85,
  });

  // Simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        volume24h: prev.volume24h + Math.random() * 10000,
        activeTraders: prev.activeTraders + Math.floor(Math.random() * 5 - 2),
        totalTrades: prev.totalTrades + Math.floor(Math.random() * 3),
        avgPayout: 85,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const items = [
    {
      icon: DollarSign,
      label: 'Volume 24h',
      value: formatCurrency(stats.volume24h),
      trend: '+12.5%',
    },
    {
      icon: Activity,
      label: 'Tổng lệnh',
      value: formatNumber(stats.totalTrades, 0),
      trend: '+8.3%',
    },
    {
      icon: Users,
      label: 'Traders hoạt động',
      value: formatNumber(stats.activeTraders, 0),
      trend: '+15.2%',
    },
    {
      icon: TrendingUp,
      label: 'Payout TB',
      value: `${stats.avgPayout}%`,
      trend: 'Stable',
    },
  ];

  return (
    <div className="bg-card border-y border-border py-4 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-semibold">{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
