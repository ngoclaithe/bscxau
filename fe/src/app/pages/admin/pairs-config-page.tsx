import React from 'react';
import { Settings, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { useAdminStore } from '@/stores/admin-store';
import { formatPercent, formatSymbol } from '@/lib/utils';
import * as Switch from '@radix-ui/react-switch';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

export const PairsConfigPage: React.FC = () => {
  const { pairConfigs, fetchPairs, updatePair, createPair, isLoading } = useAdminStore();
  const [editingPair, setEditingPair] = React.useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newSymbol, setNewSymbol] = React.useState('');
  const [newPayout, setNewPayout] = React.useState(0.85);

  React.useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  const handleTogglePair = async (id: string, isActive: boolean) => {
    await updatePair(id, { isActive });
    toast.success(`Pair đã ${isActive ? 'kích hoạt' : 'tắt'}`);
  };

  const handleUpdatePayout = async (id: string, payoutRate: number) => {
    if (payoutRate < 0.5 || payoutRate > 0.95) {
      toast.error('Payout phải từ 50% đến 95%');
      return;
    }
    await updatePair(id, { payoutRate });
    toast.success('Đã cập nhật payout');
    setEditingPair(null);
  };

  const handleAddPair = async () => {
    if (!newSymbol.trim()) {
      toast.error('Vui lòng nhập symbol');
      return;
    }
    await createPair(newSymbol.toUpperCase(), newPayout);
    toast.success('Đã thêm pair mới');
    setShowAddDialog(false);
    setNewSymbol('');
    setNewPayout(0.85);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Cấu hình Pairs</span>
          </h1>
          <p className="text-muted-foreground">Quản lý cặp giao dịch và tỷ lệ thanh toán</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPairs} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
            <Dialog.Trigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm pair mới
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50">
                <Dialog.Title className="text-xl font-bold mb-4">Thêm Pair Mới</Dialog.Title>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Symbol (VD: BTC/USD)</label>
                    <Input
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="BTC/USD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Payout Rate (0.5 - 0.95)</label>
                    <Input
                      type="number"
                      value={newPayout}
                      onChange={(e) => setNewPayout(parseFloat(e.target.value))}
                      step={0.01}
                      min={0.5}
                      max={0.95}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Dialog.Close asChild>
                      <Button variant="outline" className="flex-1">
                        Hủy
                      </Button>
                    </Dialog.Close>
                    <Button className="flex-1" onClick={handleAddPair} disabled={isLoading}>
                      Thêm
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {pairConfigs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có trading pair nào. Thêm pair mới để bắt đầu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pairConfigs.map((config) => (
            <Card key={config.id} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{formatSymbol(config.symbol)}</h3>
                      <Badge variant={config.isActive ? 'success' : 'default'} className="mt-1">
                        {config.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                      </Badge>
                    </div>
                  </div>
                  <Switch.Root
                    checked={config.isActive}
                    onCheckedChange={(isActive) => handleTogglePair(config.id, isActive)}
                    className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-success transition-colors"
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5 shadow-lg" />
                  </Switch.Root>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <label className="block text-sm text-muted-foreground mb-2">
                      Tỷ lệ thanh toán
                    </label>
                    {editingPair === config.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          defaultValue={config.payoutRate}
                          step={0.01}
                          min={0.5}
                          max={0.95}
                          onBlur={(e) =>
                            handleUpdatePayout(config.id, parseFloat(e.target.value))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdatePayout(config.id, parseFloat(e.currentTarget.value));
                            }
                          }}
                          autoFocus
                          className="w-24"
                        />
                        <Button size="sm" variant="ghost" onClick={() => setEditingPair(null)}>
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="text-lg font-bold text-success cursor-pointer hover:text-success/80 transition-colors"
                        onClick={() => setEditingPair(config.id)}
                      >
                        {formatPercent(config.payoutRate * 100, 0)}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <label className="block text-sm text-muted-foreground mb-2">ID</label>
                    <div className="text-sm font-mono text-muted-foreground truncate">
                      {config.id}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <label className="block text-sm text-muted-foreground mb-2">Trạng thái</label>
                    <div className={`text-lg font-bold ${config.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thống kê Pairs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Tổng pairs</div>
              <div className="text-2xl font-bold">{pairConfigs.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-success/10">
              <div className="text-sm text-muted-foreground mb-1">Đang hoạt động</div>
              <div className="text-2xl font-bold text-success">
                {pairConfigs.filter((p) => p.isActive).length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Payout trung bình</div>
              <div className="text-2xl font-bold">
                {pairConfigs.length > 0
                  ? formatPercent(
                    (pairConfigs.reduce((sum, p) => sum + p.payoutRate, 0) / pairConfigs.length) *
                    100,
                    0
                  )
                  : '0%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
