import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class UserStatsService {
    constructor(private prisma: PrismaService) { }

    async updateStats(userId: string, isWin: boolean, pnl: number) {
        const stats = await this.prisma.userStats.findUnique({ where: { userId } });
        if (!stats) return;

        const totalTrades = stats.totalTrades + 1;
        const winTrades = isWin ? stats.winTrades + 1 : stats.winTrades;
        const loseTrades = isWin ? stats.loseTrades : stats.loseTrades + 1;
        const totalPnl = Number(stats.totalPnl) + pnl;
        const winRate = (winTrades / totalTrades) * 100;

        return this.prisma.userStats.update({
            where: { userId },
            data: { totalTrades, winTrades, loseTrades, totalPnl, winRate },
        });
    }
}
