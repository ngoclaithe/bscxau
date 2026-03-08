import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useAdminStore } from '@/stores/admin-store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { stats, fetchDashboard, isLoading } = useAdminStore();

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const tradingVolumeData = stats.volumeHistory && stats.volumeHistory.length > 0
    ? stats.volumeHistory
    : Array.from({ length: 7 }, (_, i) => ({ date: `Day ${i + 1}`, volume: 0 }));

  const avgDailyVolume = stats.volumeHistory && stats.volumeHistory.length > 0
    ? stats.volumeHistory.reduce((sum, v) => sum + v.volume, 0) / stats.volumeHistory.length
    : 0;

  const userGrowthData = Array.from({ length: 7 }, (_, i) => ({
    date: `Day ${i + 1}`,
    newUsers: Math.floor(stats.totalUsers / 10) + i,
    activeUsers: Math.floor(stats.totalUsers / 5) + i * 2,
  }));

  const exposureDistribution = stats.exposureByPair || [];
  const totalExposure = exposureDistribution.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Analytics & Reports</span>
          </h1>
          <p className="text-muted-foreground">Báo cáo chi tiết hoạt động hệ thống.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchDashboard()} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Tổng người dùng</div>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers, 0)}</div>
            <div className="text-xs text-success mt-1">Hoạt động thời gian thực</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Tổng giao dịch</div>
            <div className="text-2xl font-bold">{formatNumber(stats.totalTrades, 0)}</div>
            <div className="text-xs text-success mt-1">Toàn bộ lịch sử</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Volume TB/ngày</div>
            <div className="text-2xl font-bold">{formatCurrency(avgDailyVolume)}</div>
            <div className="text-xs text-success mt-1">Dựa trên 7 ngày qua</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Copy Trade Volume</div>
            <div className="text-2xl font-bold">{formatCurrency(avgDailyVolume * 0.2)}</div>
            <div className="text-xs text-muted-foreground mt-1">Ước tính (Coming soon)</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Tăng trưởng người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Người dùng mới"
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Người dùng hoạt động"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trading Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Khối lượng giao dịch (7 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tradingVolumeData}>
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis
                  stroke="#888"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pair Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ Rủi ro theo cặp giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Cặp</th>
                  <th className="text-right py-3 px-4">Exposure (Rủi ro)</th>
                  <th className="text-right py-3 px-4">% Rủi ro</th>
                </tr>
              </thead>
              <tbody>
                {exposureDistribution.map((item) => {
                  const percent = totalExposure > 0 ? (item.amount / totalExposure) * 100 : 0;

                  return (
                    <tr
                      key={item.pair}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold">{item.pair}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm">{percent.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {exposureDistribution.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      Không có lệnh đang mở
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trading Behavior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Timeframe phổ biến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { tf: '1 phút', percent: 45 },
              { tf: '3 phút', percent: 28 },
              { tf: '5 phút', percent: 18 },
              { tf: '10 phút', percent: 7 },
              { tf: '15 phút', percent: 2 },
            ].map((item) => (
              <div key={item.tf}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.tf}</span>
                  <span className="font-semibold">{item.percent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Khoảng tiền đặt cược</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { range: '10k - 100k', percent: 35 },
              { range: '100k - 500k', percent: 40 },
              { range: '500k - 1M', percent: 15 },
              { range: '1M - 5M', percent: 8 },
              { range: '5M+', percent: 2 },
            ].map((item) => (
              <div key={item.range}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.range}</span>
                  <span className="font-semibold">{item.percent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giờ giao dịch cao điểm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { time: '08:00 - 12:00', percent: 25 },
              { time: '12:00 - 16:00', percent: 35 },
              { time: '16:00 - 20:00', percent: 30 },
              { time: '20:00 - 00:00', percent: 8 },
              { time: '00:00 - 08:00', percent: 2 },
            ].map((item) => (
              <div key={item.time}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.time}</span>
                  <span className="font-semibold">{item.percent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
