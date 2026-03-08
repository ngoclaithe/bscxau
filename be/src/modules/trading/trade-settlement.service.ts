import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TradeSettledEvent } from '../../events/trade.events';
import { WalletService } from '../wallet/wallet.service';
import { UserStatsService } from '../user/user-stats.service';

@Injectable()
export class TradeSettlementService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
        private walletService: WalletService,
        private userStatsService: UserStatsService,
    ) { }

    async settleTrade(tradeId: string, settlePrice: number) {
        const trade = await this.prisma.tradeOrder.findUnique({
            where: { id: tradeId },
            include: { pair: true },
        });

        if (!trade || trade.status !== 'LOCKED') return;

        const entryPrice = Number(trade.entryPrice || 0);
        const isWin =
            (trade.direction === 'UP' && settlePrice > entryPrice) ||
            (trade.direction === 'DOWN' && settlePrice < entryPrice);

        const amount = Number(trade.amount);
        const profit = isWin ? amount * Number(trade.payoutRate) : -amount;

        await this.prisma.$transaction([
            this.prisma.tradeOrder.update({
                where: { id: tradeId },
                data: { status: 'SETTLED' },
            }),
            this.prisma.tradeOrderResult.create({
                data: {
                    tradeId,
                    settlePrice,
                    result: isWin ? 'WIN' : 'LOSE',
                    profit,
                },
            }),
        ]);

        if (isWin) {
            await this.walletService.settleWin(trade.userId, amount, profit);
        } else {
            await this.walletService.settleLose(trade.userId, amount);
        }

        await this.userStatsService.updateStats(trade.userId, isWin, profit);

        this.eventEmitter.emit(
            'trade.settled',
            new TradeSettledEvent(tradeId, trade.userId, isWin ? 'WIN' : 'LOSE', profit),
        );
    }
}
