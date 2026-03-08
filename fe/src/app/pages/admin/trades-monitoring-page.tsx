import React from 'react';
import { Activity, Filter, Download, RefreshCw, Search, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { useAdminStore } from '@/stores/admin-store';
import { formatCurrency, formatSymbol } from '@/lib/utils';
import { api } from '@/lib/api';

export const TradesMonitoringPage: React.FC = () => {
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'settled'>('all');
  const { trades, fetchTrades, isLoading } = useAdminStore();

  // Advanced filters
  const [userQuery, setUserQuery] = React.useState('');
  const [minAmount, setMinAmount] = React.useState('');
  const [pairSymbol, setPairSymbol] = React.useState('');
  const [showLargeOnly, setShowLargeOnly] = React.useState(false);
  const [filteredTrades, setFilteredTrades] = React.useState<any[]>([]);

  const fetchFilteredTrades = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter.toUpperCase());
      if (userQuery) params.append('userQuery', userQuery);
      if (minAmount) params.append('minAmount', minAmount);
      if (pairSymbol) params.append('pairSymbol', pairSymbol);

      const endpoint = showLargeOnly
        ? `/admin/trades/large?${params.toString()}`
        : `/admin/trades/filtered?${params.toString()}`;

      const data = await api.get<any[]>(endpoint);
      setFilteredTrades(data);
    } catch (error) {
      console.error('Failed to fetch filtered trades', error);
    }
  }, [filter, userQuery, minAmount, pairSymbol, showLargeOnly]);

  React.useEffect(() => {
    if (userQuery || minAmount || pairSymbol || showLargeOnly) {
      fetchFilteredTrades();
      const interval = setInterval(fetchFilteredTrades, 10000);
      return () => clearInterval(interval);
    } else {
      fetchTrades(filter);
      const interval = setInterval(() => fetchTrades(filter), 15000);
      return () => clearInterval(interval);
    }
  }, [fetchTrades, fetchFilteredTrades, filter, userQuery, minAmount, pairSymbol, showLargeOnly]);

  const displayTrades = (userQuery || minAmount || pairSymbol || showLargeOnly) ? filteredTrades : trades;

  const stats = {
    total: displayTrades.length,
    pending: displayTrades.filter((t) => t.status !== 'SETTLED').length,
    settled: displayTrades.filter((t) => t.status === 'SETTLED').length,
    totalVolume: displayTrades.reduce((sum, t) => sum + Number(t.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Giám sát lệnh</span>
          </h1>
          <p className="text-muted-foreground">Theo dõi hoạt động giao dịch realtime.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => userQuery || minAmount || pairSymbol || showLargeOnly ? fetchFilteredTrades() : fetchTrades(filter)} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc nâng cao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">User (Tên/Email/ID)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên, email hoặc ID..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Số tiền tối thiểu</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="VD: 1000"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cặp giao dịch</label>
              <Input
                placeholder="VD: BTC/USD"
                value={pairSymbol}
                onChange={(e) => setPairSymbol(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={showLargeOnly ? 'default' : 'outline'}
                className="w-full gap-2"
                onClick={() => setShowLargeOnly(!showLargeOnly)}
              >
                <TrendingUp className="h-4 w-4" />
                {showLargeOnly ? 'Đang lọc lệnh lớn' : 'Chỉ lệnh lớn'}
              </Button>
            </div>
          </div>

          {(userQuery || minAmount || pairSymbol || showLargeOnly) && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline">
                Đang lọc: {[
                  userQuery && `User: ${userQuery}`,
                  minAmount && `Min: ${formatCurrency(parseInt(minAmount))}`,
                  pairSymbol && `Pair: ${pairSymbol}`,
                  showLargeOnly && 'Lệnh lớn'
                ].filter(Boolean).join(' | ')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUserQuery('');
                  setMinAmount('');
                  setPairSymbol('');
                  setShowLargeOnly(false);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Tổng lệnh</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Đang chờ</div>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Đã thanh toán</div>
            <div className="text-2xl font-bold text-success">{stats.settled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Tổng volume</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'pending', label: 'Đang hoạt động' },
          { value: 'settled', label: 'Đã thanh toán' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === tab.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Thời gian</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Trader</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Pair</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Hướng</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Số tiền</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Trạng thái</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {displayTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(trade.openTime).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {trade.user?.nickname || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold">{formatSymbol(trade.pair?.symbol)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={trade.direction === 'UP' ? 'success' : 'danger'}>
                        {trade.direction}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(trade.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={trade.status === 'SETTLED' ? 'success' : 'warning'}>
                        {trade.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {trade.status === 'SETTLED' && trade.result ? (
                        <Badge variant={trade.result.result === 'WIN' ? 'success' : 'danger'}>
                          {trade.result.result}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div >
  );
};
