import React from 'react';
import { TrendingUp, TrendingDown, Target, RefreshCw, Zap, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { useAdminStore } from '@/stores/admin-store';
import { formatSymbol } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PriceData {
    pair: string;
    price: number;
}

interface PriceTarget {
    pair: string;
    targetPrice: number;
    startTime: string;
    endTime: string;
    direction: 'UP' | 'DOWN' | 'STABLE';
}

export const PriceManipulationPage: React.FC = () => {
    const { isLoading } = useAdminStore();
    const [prices, setPrices] = React.useState<PriceData[]>([]);
    const [activeTargets, setActiveTargets] = React.useState<PriceTarget[]>([]);
    const [selectedPair, setSelectedPair] = React.useState<string>('BTC/USD');
    const [targetPrice, setTargetPrice] = React.useState<number>(0);
    const [duration, setDuration] = React.useState<number>(60);
    const [immediatePrice, setImmediatePrice] = React.useState<number>(0);

    const fetchPrices = React.useCallback(async () => {
        try {
            const data = await api.get<{ prices: PriceData[]; activeTargets: PriceTarget[] }>(
                '/admin/prices'
            );
            setPrices(data.prices);
            setActiveTargets(data.activeTargets);

            // Set initial target price based on current price
            const currentPair = data.prices.find((p) => p.pair === selectedPair);
            if (currentPair && targetPrice === 0) {
                setTargetPrice(currentPair.price);
                setImmediatePrice(currentPair.price);
            }
        } catch (e) {
            console.error('Failed to fetch prices', e);
        }
    }, [selectedPair, targetPrice]);

    React.useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 2000);
        return () => clearInterval(interval);
    }, [fetchPrices]);

    const handleSetTarget = async () => {
        try {
            await api.post(
                '/admin/prices/target',
                {
                    pair: selectedPair,
                    targetPrice,
                    durationSeconds: duration,
                }
            );
            toast.success(`Đã đặt giá mục tiêu ${targetPrice} cho ${selectedPair} trong ${duration}s`);
            fetchPrices();
        } catch (e) {
            toast.error('Không thể đặt giá mục tiêu');
            console.error(e);
        }
    };

    const handleSetImmediate = async () => {
        try {
            await api.post(
                '/admin/prices/set',
                {
                    pair: selectedPair,
                    price: immediatePrice,
                }
            );
            toast.success(`Đã đặt giá ${immediatePrice} cho ${selectedPair}`);
            fetchPrices();
        } catch (e) {
            toast.error('Không thể đặt giá');
            console.error(e);
        }
    };

    const handleCancelTarget = async (pair: string) => {
        try {
            await api.delete(`/admin/prices/target/${encodeURIComponent(pair)}`);
            toast.success(`Đã hủy mục tiêu cho ${pair}`);
            fetchPrices();
        } catch (e) {
            toast.error('Không thể hủy mục tiêu');
            console.error(e);
        }
    };

    const handleResetPrice = async (pair: string) => {
        try {
            const result = await api.post<{ success: boolean; pair: string; price: number }>(
                `/admin/prices/reset/${encodeURIComponent(pair)}`,
                {}
            );
            toast.success(`Đã khôi phục giá Binance cho ${pair}: $${result.price.toFixed(2)}`);
            fetchPrices();
        } catch (e) {
            toast.error('Không thể khôi phục giá');
            console.error(e);
        }
    };

    const getDirectionIcon = (direction: string) => {
        switch (direction) {
            case 'UP':
                return <TrendingUp className="h-4 w-4 text-success" />;
            case 'DOWN':
                return <TrendingDown className="h-4 w-4 text-destructive" />;
            default:
                return <Target className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    const getRemainingTime = (endTime: string) => {
        const remaining = new Date(endTime).getTime() - Date.now();
        if (remaining <= 0) return 'Hoàn thành';
        const seconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Điều chỉnh Giá</span>
                    </h1>
                    <p className="text-muted-foreground">Can thiệp giá thị trường (Admin only).</p>
                </div>
                <Button variant="outline" onClick={fetchPrices} disabled={isLoading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            {/* Current Prices */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {prices.map((priceData) => {
                    const target = activeTargets.find((t) => t.pair === priceData.pair);
                    const isSelected = selectedPair === priceData.pair;

                    return (
                        <Card
                            key={priceData.pair}
                            className={`cursor-pointer transition-all hover-lift ${isSelected ? 'ring-2 ring-primary' : ''
                                }`}
                            onClick={() => {
                                setSelectedPair(priceData.pair);
                                setTargetPrice(priceData.price);
                                setImmediatePrice(priceData.price);
                            }}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{formatSymbol(priceData.pair)}</h3>
                                            {target && (
                                                <Badge variant="outline" className="mt-1 gap-1">
                                                    {getDirectionIcon(target.direction)}
                                                    <span className="text-xs">{getRemainingTime(target.endTime)}</span>
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && <Badge variant="success">Đang chọn</Badge>}
                                </div>

                                <div className="text-2xl font-bold mb-2">{formatPrice(priceData.price)}</div>

                                {target && (
                                    <div className="text-sm text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <Target className="h-3 w-3" />
                                            Mục tiêu: {formatPrice(target.targetPrice)}
                                        </span>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResetPrice(priceData.pair);
                                    }}
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Khôi phục giá Binance
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Price Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gradual Price Change */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Thay đổi giá từ từ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Giá sẽ di chuyển dần đến mục tiêu trong khoảng thời gian chỉ định
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-2">Cặp giao dịch</label>
                                <Input value={formatSymbol(selectedPair)} disabled className="bg-muted" />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Giá hiện tại</label>
                                <Input
                                    value={formatPrice(prices.find((p) => p.pair === selectedPair)?.price || 0)}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-2">Giá mục tiêu ($)</label>
                                <Input
                                    type="number"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                    step={0.01}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Thời gian (giây)</label>
                                <Input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    min={5}
                                    max={3600}
                                />
                            </div>
                        </div>

                        {/* Quick duration buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {[30, 60, 120, 300, 600].map((sec) => (
                                <Button
                                    key={sec}
                                    variant={duration === sec ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDuration(sec)}
                                >
                                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                                </Button>
                            ))}
                        </div>

                        {/* Quick price change buttons */}
                        <div className="flex gap-2 flex-wrap">
                            {[-5, -2, -1, 1, 2, 5].map((pct) => {
                                const currentPrice = prices.find((p) => p.pair === selectedPair)?.price || 0;
                                const change = currentPrice * (pct / 100);
                                return (
                                    <Button
                                        key={pct}
                                        variant="outline"
                                        size="sm"
                                        className={pct > 0 ? 'text-success' : 'text-destructive'}
                                        onClick={() => setTargetPrice(currentPrice + change)}
                                    >
                                        {pct > 0 ? '+' : ''}
                                        {pct}%
                                    </Button>
                                );
                            })}
                        </div>

                        <Button className="w-full gap-2" onClick={handleSetTarget}>
                            <Clock className="h-4 w-4" />
                            Đặt giá mục tiêu
                        </Button>
                    </CardContent>
                </Card>

                {/* Immediate Price Change */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Thay đổi giá ngay lập tức
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Giá sẽ thay đổi ngay lập tức không có quá trình chuyển tiếp
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-2">Cặp giao dịch</label>
                                <Input value={formatSymbol(selectedPair)} disabled className="bg-muted" />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Giá hiện tại</label>
                                <Input
                                    value={formatPrice(prices.find((p) => p.pair === selectedPair)?.price || 0)}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-2">Giá mới ($)</label>
                            <Input
                                type="number"
                                value={immediatePrice}
                                onChange={(e) => setImmediatePrice(parseFloat(e.target.value))}
                                step={0.01}
                            />
                        </div>

                        {/* Quick price buttons */}
                        <div className="flex gap-2 flex-wrap pb-4">
                            {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((pct) => {
                                const currentPrice = prices.find((p) => p.pair === selectedPair)?.price || 0;
                                const change = currentPrice * (pct / 100);
                                return (
                                    <Button
                                        key={`imm-${pct}`}
                                        variant="outline"
                                        size="sm"
                                        className={pct > 0 ? 'text-success' : 'text-destructive'}
                                        onClick={() => setImmediatePrice(currentPrice + change)}
                                    >
                                        {pct > 0 ? '+' : ''}
                                        {pct}%
                                    </Button>
                                );
                            })}
                        </div>

                        <Button className="w-full gap-2 bg-red-600 hover:bg-red-700" onClick={handleSetImmediate}>
                            <Zap className="h-4 w-4" />
                            Đặt giá ngay
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Active Targets */}
            {activeTargets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mục tiêu đang hoạt động</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeTargets.map((target) => (
                                <div
                                    key={target.pair}
                                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-background">
                                            {getDirectionIcon(target.direction)}
                                        </div>
                                        <div>
                                            <div className="font-bold">{formatSymbol(target.pair)}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Mục tiêu: {formatPrice(target.targetPrice)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm text-muted-foreground">Còn lại</div>
                                            <div className="font-bold">{getRemainingTime(target.endTime)}</div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCancelTarget(target.pair)}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
