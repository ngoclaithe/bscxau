import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminConfigService {
    constructor(private prisma: PrismaService) { }

    async getTradingPairs() {
        return this.prisma.tradingPair.findMany();
    }

    async createPair(symbol: string, payoutRate: number) {
        return this.prisma.tradingPair.create({
            data: { symbol, payoutRate },
        });
    }

    async updatePair(id: string, data: { payoutRate?: number; isActive?: boolean }) {
        return this.prisma.tradingPair.update({
            where: { id },
            data,
        });
    }

    async pauseTrading() {
        return this.prisma.tradingPair.updateMany({
            data: { isActive: false },
        });
    }

    async resumeTrading() {
        return this.prisma.tradingPair.updateMany({
            data: { isActive: true },
        });
    }
}
