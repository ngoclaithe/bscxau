import React from 'react';
import { TrendingUp, Users, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useAdminStore } from '@/stores/admin-store';
import { formatNumber } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const { stats, fetchDashboard, isLoading } = useAdminStore();

  React.useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const volumeData = stats.volumeHistory && stats.volumeHistory.length > 0
    ? stats.volumeHistory
    : Array.from({ length: 7 }, (_, i) => ({
      date: `${i + 1}/2`,
      volume: 0,
    }));

  const COLORS = ['#10b981', '#ef4444'];

  const winLoseRatio = stats.winLoseRatio || { win: 0, lose: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Dashboard Tổng quan</span>
          </h1>
          <p className="text-muted-foreground">
            Giám sát hiệu suất và hoạt động của nền tảng
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboard} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tổng Users</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers, 0)}</div>
            <div className="text-xs text-success mt-1">+12.5% so với tháng trước</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tổng Trades</span>
              <TrendingUp className="h-4 w-4 text-info" />
            </div>
            <div className="text-2xl font-bold">{formatNumber(stats.totalTrades, 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Tất cả giao dịch</div>
          </CardContent>
        </Card>



        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Trades mới</span>
              <Activity className="h-4 w-4 text-success" />
            </div>
            <div className="text-2xl font-bold">
              {(stats.recentTrades || []).length}
            </div>
            <div className="text-xs text-success mt-1">Trong 24h qua</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Khối lượng 7 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData}>
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis
                  stroke="#888"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${formatNumber(value, 2)}`, 'Volume']}
                />
                <Bar dataKey="volume" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ Win/Lose</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Win', value: winLoseRatio.win },
                      { name: 'Lose', value: winLoseRatio.lose },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {[0, 1].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm">Trader thắng</span>
                </div>
                <span className="font-semibold">{winLoseRatio.win}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-danger" />
                  <span className="text-sm">Trader thua</span>
                </div>
                <span className="font-semibold">{winLoseRatio.lose}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Cảnh báo real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <Activity className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-warning">High Volume Alert</div>
                <div className="text-sm text-muted-foreground">
                  XAU/BSC đang có khối lượng giao dịch cao bất thường
                </div>
                <div className="text-xs text-muted-foreground mt-1">2 phút trước</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
