import React, { useEffect } from 'react';
import { useAdminWalletStore } from '@/stores/admin-wallet-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Loader2, RefreshCcw, Check, X } from 'lucide-react';

export const AdminTransactionsPage: React.FC = () => {
    const {
        deposits, withdraws,
        fetchDeposits, fetchWithdraws,
        isLoading,
        approveDeposit, rejectDeposit,
        approveWithdraw, rejectWithdraw
    } = useAdminWalletStore();

    useEffect(() => {
        fetchDeposits();
        fetchWithdraws();
    }, []);

    const handleApprovePayload = async (id: string, type: 'deposit' | 'withdraw') => {
        if (confirm(`Xác nhận duyệt lệnh ${type === 'deposit' ? 'nạp' : 'rút'} tiền?`)) {
            if (type === 'deposit') await approveDeposit(id);
            else await approveWithdraw(id);
        }
    };

    const handleRejectPayload = async (id: string, type: 'deposit' | 'withdraw') => {
        if (confirm(`Xác nhận từ chối lệnh ${type === 'deposit' ? 'nạp' : 'rút'} tiền?`)) {
            if (type === 'deposit') await rejectDeposit(id);
            else await rejectWithdraw(id);
        }
    };

    const refreshData = () => {
        fetchDeposits();
        fetchWithdraws();
    };

    const renderStatus = (status: string) => {
        let colorClass = 'bg-red-50 text-red-700 ring-red-600/20';
        if (status === 'PENDING') colorClass = 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
        else if (status === 'COMPLETED' || status === 'APPROVED') colorClass = 'bg-green-50 text-green-700 ring-green-600/20';

        return (
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Quản lý Giao dịch</span>
                    </h1>
                    <p className="text-muted-foreground">Theo dõi và xử lý các lệnh nạp rút tiền.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="gap-2">
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            <Tabs defaultValue="deposits" className="w-full">
                <TabsList>
                    <TabsTrigger value="deposits">Lệnh Nạp tiền</TabsTrigger>
                    <TabsTrigger value="withdraws">Lệnh Rút tiền</TabsTrigger>
                </TabsList>

                <TabsContent value="deposits" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách nạp tiền</CardTitle>
                            <CardDescription>Hiển thị các giao dịch nạp tiền gần nhất.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50 text-sm">
                                    <div className="col-span-2">Người dùng</div>
                                    <div>Số tiền</div>
                                    <div>CodePay</div>
                                    <div>Ngân hàng</div>
                                    <div>Trạng thái</div>
                                    <div className="text-right">Hành động</div>
                                </div>

                                {deposits.length === 0 && !isLoading && (
                                    <div className="p-8 text-center text-muted-foreground">Chưa có giao dịch nào</div>
                                )}

                                {isLoading && deposits.length === 0 && (
                                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                                )}

                                {deposits.map((item) => (
                                    <div key={item.id} className="grid grid-cols-7 gap-4 p-4 border-b last:border-0 items-center text-sm">
                                        <div className="col-span-2">
                                            <div className="font-medium">{item.user.nickname || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{item.user.email}</div>
                                        </div>
                                        <div className="font-bold text-green-600">
                                            +{formatCurrency(item.amount)}
                                        </div>
                                        <div className="font-mono bg-muted px-2 py-1 rounded w-fit text-xs">
                                            {item.codePay}
                                        </div>
                                        <div>
                                            <div className="text-xs">{item.bankAccount?.bankCode}</div>
                                            <div className="text-xs text-muted-foreground truncate" title={item.bankAccount?.accountNumber}>
                                                {item.bankAccount?.accountNumber}
                                            </div>
                                        </div>
                                        <div>
                                            {renderStatus(item.status)}
                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                {new Date(item.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right flex justify-end gap-2">
                                            {item.status === 'PENDING' && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprovePayload(item.id, 'deposit')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRejectPayload(item.id, 'deposit')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="withdraws" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách rút tiền</CardTitle>
                            <CardDescription>Hiển thị các yêu cầu rút tiền của người dùng.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50 text-sm">
                                    <div className="col-span-2">Người dùng</div>
                                    <div>Số tiền</div>
                                    <div>Ngân hàng nhận</div>
                                    <div>Số tài khoản</div>
                                    <div>Trạng thái</div>
                                    <div className="text-right">Hành động</div>
                                </div>

                                {withdraws.length === 0 && !isLoading && (
                                    <div className="p-8 text-center text-muted-foreground">Chưa có giao dịch nào</div>
                                )}

                                {isLoading && withdraws.length === 0 && (
                                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                                )}

                                {withdraws.map((item) => (
                                    <div key={item.id} className="grid grid-cols-7 gap-4 p-4 border-b last:border-0 items-center text-sm">
                                        <div className="col-span-2">
                                            <div className="font-medium">{item.user.nickname || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{item.user.email}</div>
                                        </div>
                                        <div className="font-bold text-red-600">
                                            -{formatCurrency(item.amount)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold">{item.bankCode || item.bankName}</div>
                                            <div className="text-[10px] text-muted-foreground">{item.bankName}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-mono">{item.accountNumber}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">{item.accountName}</div>
                                        </div>
                                        <div>
                                            {renderStatus(item.status)}
                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                {new Date(item.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right flex justify-end gap-2">
                                            {item.status === 'PENDING' && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprovePayload(item.id, 'withdraw')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRejectPayload(item.id, 'withdraw')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
