import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TradeSettlementService } from './trade-settlement.service';
import { PriceManipulationService } from '../oracle/price-manipulation.service';

@Injectable()
export class TradeSchedulerService {
    constructor(
        private prisma: PrismaService,
        private settlementService: TradeSettlementService,
        private priceManipulationService: PriceManipulationService,
    ) { }

    @Cron('*/5 * * * * *')
    async settleExpiredTrades() {
        const expiredTrades = await this.prisma.tradeOrder.findMany({
            where: {
                status: 'LOCKED',
                expireTime: { lte: new Date() },
            },
            include: { pair: true },
        });

        for (const trade of expiredTrades) {
            const price = this.priceManipulationService.getCurrentPrice(trade.pair.symbol);
            await this.settlementService.settleTrade(trade.id, price);
        }
    }
}
