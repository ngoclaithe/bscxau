import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('trading-pairs')
export class TradingPairsController {
    private readonly logger = new Logger(TradingPairsController.name);

    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    @Get()
    async getPairs() {
        const cacheKey = 'trading_pairs_list';
        const cached = await this.redisService.getJson<any[]>(cacheKey);

        if (cached) {
            return cached;
        }

        const pairs = await this.prisma.tradingPair.findMany({
            where: { isActive: true },
            orderBy: { symbol: 'asc' },
        });

        await this.redisService.setJson(cacheKey, pairs, 60);

        return pairs;
    }

    @Get('candles')
    async getCandles(@Query('symbol') symbol: string, @Query('limit') limit: string) {
        const limitNum = limit ? parseInt(limit) : 100;
        const targetSymbol = symbol || 'BTC/USD';

        this.logger.log(`[TradingPairsController] getCandles request: symbol=${symbol}, target=${targetSymbol}, limit=${limitNum}`);

        const candles = await this.prisma.priceCandle.findMany({
            where: { symbol: targetSymbol },
            orderBy: { time: 'desc' },
            take: limitNum,
        });

        if (candles.length > 0) {
            this.logger.log(`[TradingPairsController] Found ${candles.length} candles for ${targetSymbol}. First close: ${candles[0].close}`);
        } else {
            this.logger.log(`[TradingPairsController] No candles found for ${targetSymbol}`);
        }

        return candles.reverse().map(c => ({
            time: c.time.getTime(),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
        }));
    }
}
