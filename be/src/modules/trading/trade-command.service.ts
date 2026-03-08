import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TradeCreatedEvent } from '../../events/trade.events';
import { WalletService } from '../wallet/wallet.service';
import { PriceManipulationService } from '../oracle/price-manipulation.service';

@Injectable()
export class TradeCommandService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
        private walletService: WalletService,
        private priceManipulationService: PriceManipulationService,
    ) { }

    async createOrder(
        userId: string,
        pairId: string,
        direction: 'UP' | 'DOWN',
        amount: number,
        timeframeSec: number,
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive) {
            throw new BadRequestException('Tài khoản bạn đã bị khóa.');
        }

        const pair = await this.prisma.tradingPair.findUnique({ where: { id: pairId } });
        if (!pair || !pair.isActive) {
            throw new Error('Invalid pair or pair not found: ' + pairId);
        }

        const entryPrice = this.priceManipulationService.getCurrentPrice(pair.symbol);
        if (!entryPrice) {
            throw new Error('Price not available for: ' + pair.symbol);
        }

        await this.walletService.lockBalance(userId, amount);

        const expireTime = new Date(Date.now() + timeframeSec * 1000);

        const trade = await this.prisma.tradeOrder.create({
            data: {
                userId,
                pairId: pair.id,
                direction,
                amount,
                payoutRate: pair.payoutRate,
                expireTime,
                entryPrice,
                status: 'LOCKED',
            },
        });

        this.eventEmitter.emit(
            'trade.created',
            new TradeCreatedEvent(trade.id, userId, pair.id, direction, amount, timeframeSec),
        );

        return trade;
    }

    async getMyTrades(userId: string, status?: string, skip: number = 0, take: number = 20) {
        const where = {
            userId,
            ...(status ? { status: status as any } : {}),
        };

        const [trades, total] = await Promise.all([
            this.prisma.tradeOrder.findMany({
                where,
                include: { pair: true, result: true },
                orderBy: { openTime: 'desc' },
                skip: Number(skip),
                take: Number(take),
            }),
            this.prisma.tradeOrder.count({ where }),
        ]);

        return { trades, total };
    }

    async getTradeById(tradeId: string) {
        return this.prisma.tradeOrder.findUnique({
            where: { id: tradeId },
            include: { pair: true, result: true },
        });
    }
}
