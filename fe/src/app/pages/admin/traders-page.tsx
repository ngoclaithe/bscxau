import React from 'react';
import { Users, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Monitor, Globe, ShieldAlert, CreditCard, History, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { useAdminStore, Trader } from '@/stores/admin-store';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export const TradersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedTrader, setSelectedTrader] = React.useState<Trader | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Balance adjustment state
  const [adjAmount, setAdjAmount] = React.useState<string>('');
  const [isAdjusting, setIsAdjusting] = React.useState(false);

  const { traders, traderMeta, fetchTraders, fetchTraderDetails, updateUserStatus, adjustBalance, isLoading } = useAdminStore();

  React.useEffect(() => {
    fetchTraders(currentPage);
  }, [fetchTraders, currentPage]);

  const handleRefresh = () => {
    fetchTraders(currentPage);
  };

  const handleViewDetails = async (trader: Trader) => {
    try {
      const details = await fetchTraderDetails(trader.id);
      setSelectedTrader(details);
      setIsDetailOpen(true);
      setAdjAmount('');
    } catch (e) {
      toast.error('Không thể lấy thông tin ví');
    }
  };

  const handleToggleStatus = async (trader: Trader) => {
    const action = trader.isActive ? 'Khóa' : 'Mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${action} người dùng ${trader.nickname || trader.email}?`)) return;

    try {
      await updateUserStatus(trader.id, { isActive: !trader.isActive, status: !trader.isActive ? 'active' : 'blocked' });
      toast.success(`${action} thành công`);
    } catch (e) {
      toast.error(`${action} thất bại`);
    }
  };

  const handleAdjustBalance = async (type: 'DEPOSIT' | 'WITHDRAW') => {
    if (!selectedTrader) return;
    const amount = parseFloat(adjAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setIsAdjusting(true);
    try {
      await adjustBalance(selectedTrader.id, { amount, type, note: 'Admin adjustment' });
      toast.success(`Đã ${type === 'DEPOSIT' ? 'cộng' : 'trừ'} ${formatCurrency(amount)}`);
      // Refresh details
      const details = await fetchTraderDetails(selectedTrader.id);
      setSelectedTrader(details);
      setAdjAmount('');
    } catch (e) {
      toast.error('Giao dịch thất bại');
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredTraders = (traders || []).filter((trader) =>
    (trader.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trader.nickname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trader.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgWinRate = (traders || []).length > 0
    ? (traders || []).reduce((sum, t) => sum + t.winRate, 0) / (traders || []).length
    : 0;

  const onlineCount = (traders || []).filter(t => t.isOnline).length;
  const suspiciousCount = (traders || []).filter((t) => t.status === 'suspicious').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Quản lý Traders</span>
          </h1>
          <p className="text-muted-foreground">Theo dõi và quản lý người dùng thực tế.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Tổng traders</div>
            <div className="text-2xl font-bold">{traderMeta?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Win Rate TB</div>
            <div className="text-2xl font-bold text-success">
              {formatPercent(avgWinRate)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Users Online
            </div>
            <div className="text-2xl font-bold text-success">
              {onlineCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Cảnh báo</div>
            <div className="text-2xl font-bold text-warning">
              {suspiciousCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo địa chỉ, nickname hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Traders Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" />
            Danh sách chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider">Trader</th>
                  <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider">Mạng / IP</th>
                  <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider">Volume</th>
                  <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider">Win Rate</th>
                  <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider">Đăng nhập cuối</th>
                  <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraders.map((trader) => (
                  <tr
                    key={trader.id}
                    className="border-b border-border hover:bg-accent/30 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-2">
                          {trader.isOnline && <span className="w-2 h-2 rounded-full bg-success ring-4 ring-success/20" />}
                          {!trader.isActive && <ShieldAlert className="h-3 w-3 text-danger" />}
                          {trader.nickname || 'Guest'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{trader.email || trader.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span>{trader.lastIp}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Monitor className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">Web Browser</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col">
                        <span className="font-bold">{formatCurrency(trader.totalVolume)}</span>
                        <span className="text-[10px] text-muted-foreground">{trader.totalTrades} giao dịch</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end">
                        <Badge variant={trader.winRate >= 60 ? 'success' : trader.winRate >= 40 ? 'warning' : 'danger'}>
                          {formatPercent(trader.winRate)}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        {trader.lastLoginAt
                          ? format(new Date(trader.lastLoginAt), 'HH:mm dd/MM', { locale: vi })
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={trader.status === 'suspicious' ? 'warning' : 'success'}
                          className="text-[10px] h-5"
                        >
                          {trader.status === 'suspicious' ? 'Nghi vấn' : 'Ổn định'}
                        </Badge>
                        {!trader.isActive && (
                          <Badge variant="danger" className="text-[9px] h-4">Đã khóa</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="xs" variant="outline" className="h-7 text-[10px]" onClick={() => handleViewDetails(trader)}>
                          Soi ví
                        </Button>
                        <Button
                          size="xs"
                          variant={trader.isActive ? "down" : "up"}
                          className="h-7 text-[10px]"
                          onClick={() => handleToggleStatus(trader)}
                        >
                          {trader.isActive ? 'Khóa' : 'Mở'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {traderMeta && traderMeta.totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Đang xem trang <span className="font-medium text-foreground">{currentPage}</span> / {traderMeta.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(traderMeta.totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(i + 1)}
                      disabled={isLoading}
                    >
                      {i + 1}
                    </Button>
                  )).slice(Math.max(0, currentPage - 3), Math.min(traderMeta.totalPages, currentPage + 2))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(traderMeta.totalPages, p + 1))}
                  disabled={currentPage === traderMeta.totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-xl">
              <CreditCard className="h-6 w-6 text-primary" />
              Chi tiết tài khoản: {selectedTrader?.nickname || selectedTrader?.email}
            </DialogTitle>
          </DialogHeader>

          {selectedTrader && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Số dư thực tế</div>
                    <div className="text-2xl font-bold text-success">{formatCurrency(selectedTrader.wallet?.balance || 0)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">Số dư đang treo (LOCKED)</div>
                    <div className="text-2xl font-bold text-warning">{formatCurrency(selectedTrader.wallet?.lockedBalance || 0)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Adjust Balance Section */}
              <div className="p-4 rounded-xl border-2 border-dashed border-border/50 bg-accent/10">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Điều chỉnh số dư trực tiếp
                </h3>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="Nhập số tiền..."
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="up"
                    className="gap-2"
                    onClick={() => handleAdjustBalance('DEPOSIT')}
                    disabled={isAdjusting}
                  >
                    <Plus className="h-4 w-4" /> Cộng tiền
                  </Button>
                  <Button
                    variant="down"
                    className="gap-2"
                    onClick={() => handleAdjustBalance('WITHDRAW')}
                    disabled={isAdjusting}
                  >
                    <Minus className="h-4 w-4" /> Trừ tiền
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  * Lưu ý: Thao tác này sẽ cập nhật số dư ngay lập tức và tạo lịch sử giao dịch.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold border-b pb-2">
                  <History className="h-4 w-4" />
                  Thông tin hệ thống
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID Người dùng:</span>
                    <span className="font-mono">{selectedTrader.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge variant={selectedTrader.isActive ? 'success' : 'danger'}>
                      {selectedTrader.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ngày tham gia:</span>
                    <span>{format(new Date(selectedTrader.createdAt), 'dd MMMM, yyyy', { locale: vi })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vai trò:</span>
                    <span className="capitalize font-bold text-primary">{selectedTrader.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng cửa sổ</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
