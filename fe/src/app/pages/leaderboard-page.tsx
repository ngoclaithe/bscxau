import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { formatPercent, formatCurrency, getAvatarUrl } from '@/lib/utils';
import { useLeaderboardStore } from '@/stores/leaderboard-store';

export const LeaderboardPage: React.FC = () => {
  const { leaderboard, isLoading, timeframe, setTimeframe, fetchLeaderboard } = useLeaderboardStore();

  React.useEffect(() => {
    fetchLeaderboard();
  }, []); // Initial fetch

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Bảng Xếp Hạng
          </h1>
          <p className="text-muted-foreground mt-2">Top những nhà giao dịch xuất sắc nhất</p>
        </div>

        <div className="flex bg-muted p-1 rounded-lg">
          {(['day', 'week', 'month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${timeframe === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t === 'day' ? 'Hôm nay' : t === 'week' ? 'Tuần này' : 'Tháng này'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Top 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {leaderboard.slice(0, 3).map((trader) => (
            <Card key={trader.id} className={`relative overflow-hidden ${trader.rank === 1 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2 relative group cursor-pointer">
                  <a href={`/u/${trader.nickname}`} className="block w-full h-full">
                    <img src={getAvatarUrl(trader.avatarUrl)} alt={trader.nickname} className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-110" />
                  </a>
                  <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-sm pointer-events-none">
                    <Medal className={`w-6 h-6 ${getMedalColor(trader.rank)}`} />
                  </div>
                </div>
                <CardTitle>
                  <a href={`/u/${trader.nickname}`} className="hover:text-primary hover:underline transition-colors">
                    {trader.nickname}
                  </a>
                </CardTitle>
                <Badge variant="outline" className="mt-1">Rank #{trader.rank}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">PnL</span>
                    <span className="font-bold text-green-500">+{formatCurrency(trader.pnl)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-medium">{formatPercent(trader.winRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trades</span>
                    <span className="font-medium">{trader.totalTrades}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List View */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Traders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-medium">Rank</th>
                    <th className="px-6 py-3 font-medium">Trader</th>
                    <th className="px-6 py-3 font-medium text-right">PnL</th>
                    <th className="px-6 py-3 font-medium text-right">ROI</th>
                    <th className="px-6 py-3 font-medium text-right">Win Rate</th>
                    <th className="px-6 py-3 font-medium text-right">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((trader) => (
                    <tr key={trader.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        {trader.rank <= 3 && <Medal className={`w-4 h-4 ${getMedalColor(trader.rank)}`} />}
                        #{trader.rank}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <a href={`/u/${trader.nickname}`} className="block w-8 h-8 rounded-full bg-muted overflow-hidden hover:opacity-80 transition-opacity">
                            <img src={getAvatarUrl(trader.avatarUrl)} alt={trader.nickname} className="w-full h-full object-cover" />
                          </a>
                          <a href={`/u/${trader.nickname}`} className="font-medium hover:text-primary hover:underline transition-colors">
                            {trader.nickname}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-500">
                        +{formatCurrency(trader.pnl)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-500">+{formatPercent(trader.roi)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatPercent(trader.winRate)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {trader.totalTrades}
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        Chưa có dữ liệu xếp hạng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
