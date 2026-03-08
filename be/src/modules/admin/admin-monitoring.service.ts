import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AdminMonitoringService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
    ) { }

    async getDashboard() {
        const [
            totalUsers,
            totalTrades,
            totalVolume,
            recentTrades,
            exposureByPair,
            statusCounts,
            poolWallet
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.tradeOrder.count(),
            this.prisma.tradeOrder.aggregate({ _sum: { amount: true } }),
            this.prisma.tradeOrder.findMany({
                take: 10,
                orderBy: { openTime: 'desc' },
                include: { user: { select: { nickname: true } }, pair: true, result: true }
            }),
            this.prisma.tradeOrder.groupBy({
                by: ['pairId'],
                where: { status: 'PENDING' },
                _sum: { amount: true }
            }),
            this.prisma.tradeOrder.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            this.prisma.wallet.aggregate({ _sum: { balance: true } })
        ]);

        // Get pair names for exposure
        const pairs = await this.prisma.tradingPair.findMany({
            where: { id: { in: exposureByPair.map((e: any) => e.pairId) } }
        });
        const pairMap = new Map(pairs.map(p => [p.id, p.symbol]));

        return {
            totalUsers,
            totalTrades,
            exposure: exposureByPair.reduce((sum: number, e: any) => sum + Number(e._sum.amount || 0), 0),
            recentTrades,
            exposureByPair: exposureByPair.map((e: any) => ({
                pair: pairMap.get(e.pairId) || 'Unknown',
                amount: Number(e._sum.amount || 0)
            })),
            volumeHistory: [],
            winLoseRatio: {
                win: 0,
                lose: 0
            },
            poolBalance: Number(poolWallet._sum.balance || 0)
        };
    }

    async getTrades(status?: string) {
        const where: any = {};
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        return this.prisma.tradeOrder.findMany({
            where,
            include: {
                user: { select: { nickname: true } },
                pair: true,
                result: true
            },
            orderBy: { openTime: 'desc' },
            take: 100,
        });
    }

    async getTradesWithFilters(filters: {
        status?: string;
        userQuery?: string;
        minAmount?: number;
        pairSymbol?: string;
        limit?: number;
    }) {
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.userQuery) {
            where.user = {
                OR: [
                    { nickname: { contains: filters.userQuery, mode: 'insensitive' } },
                    { email: { contains: filters.userQuery, mode: 'insensitive' } },
                    ...(filters.userQuery.length > 20 ? [{ id: filters.userQuery }] : [])
                ]
            };
        }

        if (filters.minAmount) {
            where.amount = { gte: filters.minAmount };
        }

        if (filters.pairSymbol) {
            where.pair = { symbol: filters.pairSymbol };
        }

        return this.prisma.tradeOrder.findMany({
            where,
            include: {
                user: { select: { id: true, nickname: true, email: true } },
                pair: true,
                result: true
            },
            orderBy: { openTime: 'desc' },
            take: filters.limit || 100,
        });
    }

    async getUserTrades(userId: string, limit: number = 50) {
        return this.prisma.tradeOrder.findMany({
            where: { userId },
            include: { pair: true, result: true },
            orderBy: { openTime: 'desc' },
            take: limit,
        });
    }

    async getLargeTrades(minAmount: number = 1000, limit: number = 50) {
        return this.prisma.tradeOrder.findMany({
            where: {
                amount: { gte: minAmount }
            },
            include: {
                user: { select: { id: true, nickname: true, email: true } },
                pair: true,
                result: true
            },
            orderBy: { openTime: 'desc' },
            take: limit,
        });
    }

    async getTraders(page: number = 1, limit: number = 20) {
        const skip = (Number(page) - 1) * Number(limit);

        const [users, total, onlineIds] = await Promise.all([
            (this.prisma.user as any).findMany({
                include: {
                    wallet: true,
                    stats: true,
                    sessions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: Number(limit),
            }),
            this.prisma.user.count(),
            this.redis.getClient().smembers('online_users')
        ]);

        const onlineSet = new Set(onlineIds);

        const volumes = await this.prisma.tradeOrder.groupBy({
            by: ['userId'],
            where: { userId: { in: users.map((u: any) => u.id) } },
            _sum: { amount: true }
        });

        const volumeMap = new Map(volumes.map((v: any) => [v.userId, Number(v._sum.amount || 0)]));

        const data = users.map((user: any) => {
            const lastSession = user.sessions[0];
            return {
                id: user.id,
                address: user.walletAddress || 'No Wallet',
                email: user.email,
                nickname: user.nickname,
                totalVolume: volumeMap.get(user.id) || 0,
                totalTrades: user.stats?.totalTrades || 0,
                winRate: Number(user.stats?.winRate || 0),
                status: Number(user.stats?.winRate || 0) > 80 && (user.stats?.totalTrades || 0) > 10 ? 'suspicious' : 'normal',
                balance: Number(user.wallet?.balance || 0),
                role: user.role,
                createdAt: user.createdAt,
                isActive: user.isActive,
                lastIp: lastSession?.ipAddress || 'N/A',
                lastLoginAt: lastSession?.createdAt || null,
                isOnline: onlineSet.has(user.id),
            };
        });

        return {
            data,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    }

    async getTraderDetails(id: string) {
        const user = await (this.prisma.user as any).findUnique({
            where: { id },
            include: {
                wallet: true,
                stats: true,
                sessions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!user) return null;

        const volume = await this.prisma.tradeOrder.aggregate({
            where: { userId: id },
            _sum: { amount: true }
        });

        const onlineIds = await this.redis.getClient().smembers('online_users');
        const isOnline = onlineIds.includes(id);

        const lastSession = user.sessions[0];

        return {
            id: user.id,
            address: user.walletAddress || 'No Wallet',
            email: user.email,
            nickname: user.nickname,
            totalVolume: Number(volume._sum.amount || 0),
            totalTrades: user.stats?.totalTrades || 0,
            winRate: Number(user.stats?.winRate || 0),
            status: Number(user.stats?.winRate || 0) > 80 && (user.stats?.totalTrades || 0) > 10 ? 'suspicious' : 'normal',
            balance: Number(user.wallet?.balance || 0),
            wallet: user.wallet ? {
                balance: Number(user.wallet.balance),
                lockedBalance: Number(user.wallet.lockedBalance)
            } : null,
            role: user.role,
            createdAt: user.createdAt,
            isActive: user.isActive,
            lastIp: lastSession?.ipAddress || 'N/A',
            lastLoginAt: lastSession?.createdAt || null,
            isOnline,
        };
    }

    async adjustBalance(userId: string, amount: number, type: 'DEPOSIT' | 'WITHDRAW', note?: string) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new Error('Wallet not found');

            const finalAmount = type === 'DEPOSIT' ? amount : -amount;

            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: { balance: { increment: finalAmount } }
            });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: Math.abs(amount),
                    type: type as any,
                }
            });

            // Log admin action
            // await tx.adminLog.create({ ... }); // If we had the admin ID here

            return updatedWallet;
        });
    }

    async getLogs() {
        return this.prisma.adminLog.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: { admin: { select: { email: true } } },
        });
    }
}
