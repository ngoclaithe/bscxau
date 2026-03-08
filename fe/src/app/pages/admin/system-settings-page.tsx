import React from 'react';
import { Save, Power, Database, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/admin-store';

export const SystemSettingsPage: React.FC = () => {
    const { pauseTrading, resumeTrading, pairConfigs, fetchPairs, isLoading } = useAdminStore();
    const isTradingPaused = pairConfigs.every(p => !p.isActive) && pairConfigs.length > 0;

    React.useEffect(() => {
        fetchPairs();
    }, [fetchPairs]);

    const handleToggleTrading = async (checked: boolean) => {
        try {
            if (!checked) await pauseTrading();
            else await resumeTrading();
            toast.success(!checked ? 'Đã tạm dừng giao dịch' : 'Đã tiếp tục giao dịch');
        } catch (e) {
            toast.error('Thao tác thất bại');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Cài đặt Hệ thống</span>
                    </h1>
                    <p className="text-muted-foreground">Cấu hình các tham số toàn cục của sàn.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cấu hình chung</CardTitle>
                        <CardDescription>Thông số vận hành cơ bản</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg opacity-50 cursor-not-allowed">
                            <div className="space-y-0.5">
                                <div className="font-medium flex items-center gap-2">
                                    <Power className="h-4 w-4" />
                                    Maintenance Mode
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Tạm dừng toàn bộ hệ thống để bảo trì (Coming soon)
                                </div>
                            </div>
                            <Switch checked={false} disabled />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <div className="font-medium flex items-center gap-2">
                                    <Power className={`h-4 w-4 ${isTradingPaused ? 'text-red-500' : 'text-green-500'}`} />
                                    Trading Status
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {isTradingPaused ? 'Hệ thống đang tạm dừng giao dịch' : 'Hệ thống đang hoạt động bình thường'}
                                </div>
                            </div>
                            <Switch
                                checked={!isTradingPaused}
                                onCheckedChange={handleToggleTrading}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2 opacity-50">
                            <label className="text-sm font-medium">Trading Fee (%)</label>
                            <Input type="number" defaultValue={5} disabled />
                        </div>

                        <div className="space-y-2 opacity-50">
                            <label className="text-sm font-medium">Min Withdrawal (VND)</label>
                            <Input type="number" defaultValue={10} disabled />
                        </div>

                        <Button disabled className="w-full gap-2">
                            <Save className="h-4 w-4" />
                            Lưu cấu hình
                        </Button>
                    </CardContent>
                </Card>

                {/* Network & Blockchain */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blockchain & Network</CardTitle>
                        <CardDescription>Kết nối RPC và Smart Contracts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Network Name</label>
                            <Input defaultValue="Binance Smart Chain" disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">RPC URL</label>
                            <div className="flex gap-2">
                                <Input defaultValue="https://bsc-dataseed.binance.org/" disabled />
                                <Button variant="outline" size="icon" onClick={() => toast.success('Đã kiểm tra kết nối RPC')}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
                            <p>Contract Address: 0x123...abc</p>
                            <p>Settlement Contract: 0x456...def</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Oracle Status Mock */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-indigo-500" />
                                Oracle Status
                            </CardTitle>
                            <CardDescription>Trạng thái cập nhật giá từ các nguồn</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2" onClick={fetchPairs}>
                            <RefreshCw className="h-3 w-3" /> Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pairConfigs.map((pair) => (
                            <div key={pair.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                <div className="flex items-center gap-4">
                                    <div className={`h-2 w-2 rounded-full ${pair.isActive ? 'bg-success' : 'bg-danger'}`} />
                                    <div>
                                        <div className="font-bold">{pair.symbol}</div>
                                        <div className="text-xs text-muted-foreground">Source: Realtime Oracle</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-mono font-medium">{pair.payoutRate}% Payout</div>
                                    <div className="text-xs text-success flex items-center justify-end gap-1">
                                        <Activity className="h-3 w-3" />
                                        Active
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
