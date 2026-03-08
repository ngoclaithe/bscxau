import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/app/components/ui/pagination';
import { useTradingStore } from '@/stores/trading-store';
import { useWalletStore } from '@/stores/wallet-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatPercent } from '@/lib/utils';



export const PortfolioPage: React.FC = () => {
  const { closedOrders, totalTrades, fetchMyTrades } = useTradingStore();
  const { balance, lockedBalance, fetchWallet } = useWalletStore();
  const { isAuthenticated } = useAuthStore();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchMyTrades((currentPage - 1) * pageSize, pageSize);
      fetchWallet();
    }
  }, [isAuthenticated, fetchMyTrades, fetchWallet, currentPage]);

  // Use useMemo for heavy calculations
  const analytics = useMemo(() => {
    if (!closedOrders.length) return null;

    let totalProfit = 0;
    let winTrades = 0;
    let loseTrades = 0;
    let totalInvested = 0;
    const pnlHistory: { date: string; value: number }[] = [];
    const tradesByPair: Record<string, number> = {};

    // Sort by openTime to calculate running PnL
    const sortedOrders = [...closedOrders].sort(
      (a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
    );

    let runningPnl = 0;

    sortedOrders.forEach((order) => {
      const profit = Number(order.result?.profit || 0);
      const amount = Number(order.amount || 0);
      const isWin = order.result?.result === 'WIN';

      totalProfit += profit;
      totalInvested += amount;
      if (isWin) winTrades++;
      else loseTrades++;

      runningPnl += profit;
      pnlHistory.push({
        date: new Date(order.openTime).toLocaleDateString('vi-VN'),
        value: runningPnl
      });

      const pairName = order.pair?.symbol || 'Unknown';
      tradesByPair[pairName] = (tradesByPair[pairName] || 0) + 1;
    });

    const winRate = (winTrades / closedOrders.length) * 100;
    const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const pairData = Object.entries(tradesByPair).map(([name, value]) => ({
      name,
      value
    }));

    return {
      totalProfit,
      winTrades,
      loseTrades,
      totalLoaded: closedOrders.length,
      winRate,
      roi,
      pnlHistory,
      pairData
    };
  }, [closedOrders]);


  const totalPages = Math.ceil(totalTrades / pageSize);

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center p-20 text-muted-foreground">
      Vui lòng đăng nhập để xem danh mục đầu tư.
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh mục đầu tư</h1>
          <p className="text-muted-foreground">Theo dõi hiệu suất giao dịch và phân bổ tài sản của bạn.</p>
        </div>
        {/* <div className="flex bg-muted/50 p-1 rounded-lg border">
          <div className="px-4 py-2 text-sm font-medium">Tự động cập nhật: BẬT</div>
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover-lift border-primary/10 transition-all hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Số dư khả dụng</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
              Đang khóa: {formatCurrency(lockedBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-primary/10 transition-all hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Win Rate</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{formatPercent(analytics?.winRate || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {analytics?.winTrades || 0} Thắng / {analytics?.loseTrades || 0} Thua
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Chi tiết lịch sử lệnh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/5 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[150px]">Cặp tiền</TableHead>
                    <TableHead>Hướng</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Số vốn</TableHead>
                    <TableHead>Giá vào</TableHead>
                    <TableHead>Giá đóng</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedOrders.length > 0 ? (
                    closedOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-white/[0.02] border-white/5">
                        <TableCell className="font-bold">{order.pair?.symbol || 'Unknown'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.direction === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                            {order.direction}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const src = (order as any).orderSource as string | undefined;
                            const cfg: Record<string, { label: string; cls: string }> = {
                              BOT: { label: '🤖 BOT', cls: 'bg-amber-500/20 text-amber-500' },
                              COPY_TRADE: { label: '📋 Copy', cls: 'bg-orange-500/20 text-orange-400' },
                              MANUAL: { label: '👤 Thủ công', cls: 'bg-blue-500/20 text-blue-400' },
                            };
                            const c = cfg[src ?? 'MANUAL'] ?? cfg.MANUAL;
                            return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.cls}`}>{c.label}</span>;
                          })()}
                        </TableCell>
                        <TableCell>{formatCurrency(order.amount)}</TableCell>
                        <TableCell className="font-mono text-xs">{Number(order.entryPrice).toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">{Number(order.result?.settlePrice).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(order.openTime).toLocaleString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                        Không tìm thấy lệnh nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (totalPages > 7 && (pageNum > 2 && pageNum < totalPages - 1 && Math.abs(pageNum - currentPage) > 1)) {
                        if (pageNum === 3 || pageNum === totalPages - 2) return <PaginationItem key={pageNum}><PaginationEllipsis /></PaginationItem>;
                        return null;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === pageNum}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
