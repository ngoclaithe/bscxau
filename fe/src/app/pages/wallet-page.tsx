import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useWalletStore } from '@/stores/wallet-store';
import { formatCurrency } from '@/lib/utils';
import { Activity, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { DepositDialog } from '@/app/components/deposit-dialog';
import { WithdrawDialog } from '@/app/components/withdraw-dialog';

export const WalletPage: React.FC = () => {
    const { balance, lockedBalance, fetchWallet, fetchHistory, transactions, isLoading } = useWalletStore();
    const [isDepositOpen, setIsDepositOpen] = React.useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);
    const [selectedDeposit, setSelectedDeposit] = React.useState<any>(null);

    React.useEffect(() => {
        fetchWallet();
        fetchHistory();
    }, []);

    const STATUS_MAP: Record<string, { label: string; color: string }> = {
        PENDING: { label: 'Đang xử lý', color: 'text-yellow-500' },
        COMPLETED: { label: 'Thành công', color: 'text-green-500' },
        SUCCESS: { label: 'Thành công', color: 'text-green-500' },
        FAILED: { label: 'Thất bại', color: 'text-red-500' },
        CANCELLED: { label: 'Đã hủy', color: 'text-gray-500' },
        REJECTED: { label: 'Từ chối', color: 'text-red-500' },
    };

    const renderTransaction = (tx: any) => {
        const statusInfo = STATUS_MAP[tx.status] || { label: tx.status, color: 'text-muted-foreground' };

        return (
            <div key={tx.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                    <div className={`font-semibold ${tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'DEPOSIT' ? 'Nạp tiền' : 'Rút tiền'}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                    {tx.codePay && <div className="text-xs font-mono bg-muted px-1 rounded w-fit mt-1">Code: {tx.codePay}</div>}

                    {tx.type === 'DEPOSIT' && tx.status === 'PENDING' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 px-2 text-xs border border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                            onClick={() => {
                                setSelectedDeposit(tx);
                                setIsDepositOpen(true);
                            }}
                        >
                            Xem Mã QR
                        </Button>
                    )}
                </div>
                <div className="text-right">
                    <div className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <div className={`text-xs capitalize ${statusInfo.color}`}>{statusInfo.label}</div>
                </div>
            </div>
        )
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Ví của tôi</h1>
                <p className="text-muted-foreground">Quản lý nạp rút và lịch sử giao dịch</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <Card className="md:col-span-2 bg-gradient-to-br from-background to-accent/20 border-primary/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Tổng số dư khả dụng</div>
                                <div className="text-4xl font-bold text-primary">
                                    {isLoading && balance === 0 ? '...' : formatCurrency(balance)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Đang khóa trong lệnh: <span className="font-semibold text-foreground">{formatCurrency(lockedBalance)}</span>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <Button
                                    size="lg"
                                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => setIsDepositOpen(true)}
                                >
                                    <ArrowDownLeft className="h-4 w-4" />
                                    Nạp tiền
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={() => setIsWithdrawOpen(true)}
                                >
                                    <ArrowUpRight className="h-4 w-4" />
                                    Rút tiền
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats or Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Thông tin ví</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Trạng thái</span>
                                <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                                    <Activity className="h-3 w-3" /> Hoạt động
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Loại tài khoản</span>
                                <span className="text-sm font-medium">Standard</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Lưu ý: Vui lòng kiểm tra kỹ thông tin trước khi thực hiện giao dịch nạp rút.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Lịch sử giao dịch
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">Tất cả</TabsTrigger>
                            <TabsTrigger value="deposit">Nạp tiền</TabsTrigger>
                            <TabsTrigger value="withdraw">Rút tiền</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {isLoading && transactions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">Đang tải lịch sử...</div>
                            ) : transactions.length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.map(renderTransaction)}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Chưa có lịch sử giao dịch nào
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="deposit">
                            {transactions.filter(t => t.type === 'DEPOSIT').length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.filter(t => t.type === 'DEPOSIT').map(renderTransaction)}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Chưa có lịch sử nạp tiền
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="withdraw">
                            {transactions.filter(t => t.type === 'WITHDRAW').length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.filter(t => t.type === 'WITHDRAW').map(renderTransaction)}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Chưa có lịch sử rút tiền
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <DepositDialog
                isOpen={isDepositOpen}
                onClose={() => {
                    setIsDepositOpen(false);
                    setSelectedDeposit(null);
                }}
                onSuccess={() => {
                    setSelectedDeposit(null);
                    fetchHistory();
                    fetchWallet();
                }}
                initialData={selectedDeposit}
            />
            <WithdrawDialog
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                onSuccess={() => {
                    fetchHistory();
                    fetchWallet();
                }}
            />
        </div>
    );
};
