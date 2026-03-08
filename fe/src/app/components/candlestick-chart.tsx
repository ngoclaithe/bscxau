import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries, UTCTimestamp } from 'lightweight-charts';
import { formatNumber } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface ActiveOrder {
    id: string;
    entryPrice: number;
    direction: 'UP' | 'DOWN';
    timeframe: number;
    placedAt: number;
}

interface CandlestickChartProps {
    symbol?: string; // Optional for backward compatibility but recommended
    data: CandleData[];
    currentPrice: number;
    activeOrders?: ActiveOrder[];
    onPriceChange?: (price: number) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
    symbol,
    data,
    currentPrice,
    activeOrders = [],
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candleSeriesRef = useRef<any>(null);
    const isInitializedRef = useRef(false);
    const lastDataLengthRef = useRef(0);
    const lastSymbolRef = useRef<string | undefined>(symbol);
    const [priceChange, setPriceChange] = useState<number>(0);
    const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

    // Calculate price change
    useEffect(() => {
        if (data.length >= 2) {
            const prevClose = data[data.length - 2]?.close || currentPrice;
            const change = currentPrice - prevClose;
            const changePercent = (change / prevClose) * 100;
            setPriceChange(change);
            setPriceChangePercent(changePercent);
        }
    }, [currentPrice, data]);

    // Initialize chart - only once
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Cleanup existing chart if any (though usually handled by unmount)
        if (chartRef.current) {
            chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time: number) => {
                    const date = new Date(time * 1000);
                    return new Intl.DateTimeFormat('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).format(date);
                },
            },
            localization: {
                locale: 'vi-VN',
                dateFormat: 'dd/MM/yyyy',
                timeFormatter: (time: number) => {
                    const date = new Date(time * 1000);
                    return new Intl.DateTimeFormat('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour: '2-digit',
                        minute: '2-digit',
                    }).format(date);
                },
            },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        isInitializedRef.current = false; // Reset init flag

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            isInitializedRef.current = false;
        };
    }, []); // Empty dependency array means this runs on mount/unmount

    // Update chart data - without resetting zoom
    useEffect(() => {
        if (!candleSeriesRef.current) return;

        // If data is empty, clear series
        if (data.length === 0) {
            candleSeriesRef.current.setData([]);
            lastDataLengthRef.current = 0;
            isInitializedRef.current = false; // Allow re-init next time data comes
            return;
        }

        const formatTime = (timestamp: number): UTCTimestamp => {
            return Math.floor(timestamp / 1000) as UTCTimestamp;
        };

        // Detect symbol change or full data reset
        const isSymbolChanged = symbol && lastSymbolRef.current !== symbol;
        if (isSymbolChanged) {
            lastSymbolRef.current = symbol;
            isInitializedRef.current = false; // Force re-init data
        }

        // First time initialization OR Reset required
        if (!isInitializedRef.current) {
            const chartData = data
                .sort((a, b) => a.time - b.time)
                .map((d) => ({
                    time: formatTime(d.time),
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }));

            candleSeriesRef.current.setData(chartData);

            // Fit content only if explicitly resetting view or first load
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent();
            }

            isInitializedRef.current = true;
            lastDataLengthRef.current = data.length;
            return;
        }

        // Real-time update logic
        const lastCandle = data[data.length - 1];
        if (!lastCandle) return;

        const newCandleTime = formatTime(lastCandle.time);

        // Check specifically if we have MORE data than before (new candle)
        // OR if the same candle is updating (last candle update)
        if (data.length > lastDataLengthRef.current) {
            candleSeriesRef.current.update({
                time: newCandleTime,
                open: Number(lastCandle.open),
                high: Number(lastCandle.high),
                low: Number(lastCandle.low),
                close: Number(lastCandle.close),
            });
            lastDataLengthRef.current = data.length;
        } else {
            // Update current candle
            candleSeriesRef.current.update({
                time: newCandleTime,
                open: Number(lastCandle.open),
                high: Number(lastCandle.high),
                low: Number(lastCandle.low),
                close: Number(lastCandle.close),
            });
        }
    }, [data, symbol]); // Include symbol in dependency

    const priceLinesRef = useRef<any[]>([]);

    // Update price lines for active orders
    useEffect(() => {
        if (!candleSeriesRef.current) return;

        // Clear previous price lines
        priceLinesRef.current.forEach(line => {
            try {
                candleSeriesRef.current.removePriceLine(line);
            } catch (e) { }
        });
        priceLinesRef.current = [];

        activeOrders.forEach((order) => {
            try {
                const line = candleSeriesRef.current?.createPriceLine({
                    price: order.entryPrice,
                    color: order.direction === 'UP' ? '#22c55e' : '#ef4444',
                    lineWidth: 2,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: order.direction === 'UP' ? '↑ Entry' : '↓ Entry',
                });
                if (line) priceLinesRef.current.push(line);
            } catch (e) { }
        });
    }, [activeOrders]);

    // Zoom controls... (keep existing)
    const handleZoomIn = useCallback(() => {
        if (chartRef.current) {
            const timeScale = chartRef.current.timeScale();
            const currentRange = timeScale.getVisibleLogicalRange();
            if (currentRange) {
                const newRange = {
                    from: currentRange.from + (currentRange.to - currentRange.from) * 0.2,
                    to: currentRange.to - (currentRange.to - currentRange.from) * 0.2,
                };
                timeScale.setVisibleLogicalRange(newRange);
            }
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (chartRef.current) {
            const timeScale = chartRef.current.timeScale();
            const currentRange = timeScale.getVisibleLogicalRange();
            if (currentRange) {
                const newRange = {
                    from: currentRange.from - (currentRange.to - currentRange.from) * 0.25,
                    to: currentRange.to + (currentRange.to - currentRange.from) * 0.25,
                };
                timeScale.setVisibleLogicalRange(newRange);
            }
        }
    }, []);

    const handleReset = useCallback(() => {
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
        }
    }, []);

    const isPriceUp = priceChange >= 0;

    return (
        <div className="h-full flex flex-col">
            {/* Header with price info */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold">{formatNumber(currentPrice)}</span>
                        <span className={`text-lg font-semibold ${isPriceUp ? 'text-success' : 'text-destructive'}`}>
                            {isPriceUp ? '+' : ''}{formatNumber(priceChange)} ({isPriceUp ? '+' : ''}{formatNumber(priceChangePercent)}%)
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">Giá hiện tại</div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        title="Reset View"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Active Orders Legend */}
            {activeOrders.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {activeOrders.map((order) => {
                        const isWinning = order.direction === 'UP'
                            ? currentPrice > order.entryPrice
                            : currentPrice < order.entryPrice;

                        return (
                            <div
                                key={order.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${order.direction === 'UP'
                                    ? 'bg-success/20 text-success border border-success/30'
                                    : 'bg-destructive/20 text-destructive border border-destructive/30'
                                    }`}
                            >
                                <span>{order.direction === 'UP' ? '↑' : '↓'}</span>
                                <span>Entry: {formatNumber(order.entryPrice)}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chart Container */}
            <div
                ref={chartContainerRef}
                className="flex-1 min-h-0 rounded-lg overflow-hidden"
            />
        </div>
    );
};


