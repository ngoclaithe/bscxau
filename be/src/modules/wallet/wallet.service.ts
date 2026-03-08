import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async getWallet(userId: string) {
        return this.prisma.wallet.findUnique({
            where: { userId },
            include: { transactions: { take: 20, orderBy: { createdAt: 'desc' } } },
        });
    }

    async getDepositById(userId: string, depositId: string) {
        const order = await this.prisma.depositOrder.findUnique({
            where: { id: depositId },
            include: { bankAccount: true }
        });

        if (!order || order.userId !== userId) {
            throw new BadRequestException('Deposit order not found or unauthorized');
        }
        return order;
    }

    async getDetailedHistory(userId: string) {
        // 1. Get completed transactions
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } },
        });

        const transactions = wallet?.transactions.map(tx => ({
            ...tx,
            status: 'COMPLETED', // Completed tx are always successful
            category: 'TRANSACTION'
        })) || [];

        // 2. Get pending deposits
        const pendingDeposits = await this.prisma.depositOrder.findMany({
            where: { userId, status: 'PENDING' },
            include: { bankAccount: true },
            orderBy: { createdAt: 'desc' }
        });

        console.log('Pending Deposits Raw:', JSON.stringify(pendingDeposits, null, 2));

        const deposits = pendingDeposits.map(d => ({
            id: d.id,
            walletId: wallet?.id,
            type: 'DEPOSIT',
            amount: d.amount,
            status: 'PENDING',
            createdAt: d.createdAt,
            codePay: d.codePay,
            bankAccount: d.bankAccount,
            expiredAt: d.expiredAt,
            category: 'ORDER'
        }));

        console.log('Mapped Deposits:', JSON.stringify(deposits, null, 2));

        // 3. Get pending withdraws
        const pendingWithdraws = await this.prisma.withdrawOrder.findMany({
            where: { userId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });

        const withdraws = pendingWithdraws.map(w => ({
            id: w.id,
            walletId: wallet?.id,
            type: 'WITHDRAW',
            amount: w.amount,
            status: 'PENDING',
            createdAt: w.createdAt,
            category: 'ORDER'
        }));

        // 4. Merge and sort
        const history = [...deposits, ...withdraws, ...transactions];
        return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getBalance(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        return wallet ? { balance: wallet.balance, locked: wallet.lockedBalance } : null;
    }

    async lockBalance(userId: string, amount: number) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || Number(wallet.balance) < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        return this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    balance: { decrement: amount },
                    lockedBalance: { increment: amount },
                },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'LOCK',
                    amount,
                },
            }),
        ]);
    }

    async unlockBalance(userId: string, amount: number) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return;

        return this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    balance: { increment: amount },
                    lockedBalance: { decrement: amount },
                },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'UNLOCK',
                    amount,
                },
            }),
        ]);
    }

    async settleWin(userId: string, amount: number, profit: number) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return;

        return this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    balance: { increment: amount + profit },
                    lockedBalance: { decrement: amount },
                },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'SETTLE',
                    amount: profit,
                },
            }),
        ]);
    }

    async settleLose(userId: string, amount: number) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return;

        return this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    lockedBalance: { decrement: amount },
                },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'SETTLE',
                    amount: -amount,
                },
            }),
        ]);
    }
    async finalizeWithdraw(userId: string, amount: number) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return;

        return this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    lockedBalance: { decrement: amount },
                },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAW',
                    amount: -amount,
                },
            }),
        ]);
    }
}
