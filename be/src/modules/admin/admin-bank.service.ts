import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminBankService {
    constructor(private prisma: PrismaService) { }

    async getBanks() {
        return this.prisma.bankAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createBank(data: {
        accountName: string;
        bankName: string;
        bankCode: string;
        accountNumber: string;
    }) {
        return this.prisma.bankAccount.create({
            data: {
                ...data,
                isActive: true,
            },
        });
    }

    async updateBank(id: string, data: Partial<{
        accountName: string;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        isActive: boolean;
    }>) {
        return this.prisma.bankAccount.update({
            where: { id },
            data,
        });
    }

    async deleteBank(id: string) {
        // Soft delete or hard delete? Let's do hard delete for now if no deposits
        return this.prisma.bankAccount.delete({
            where: { id },
        });
    }

    async getDeposits(take = 50) {
        return this.prisma.depositOrder.findMany({
            include: {
                user: { select: { email: true, nickname: true, walletAddress: true } },
                bankAccount: true
            },
            orderBy: { createdAt: 'desc' },
            take
        });
    }

    async approveDeposit(id: string) {
        return this.prisma.$transaction(async (tx) => {
            const deposit = await tx.depositOrder.findUnique({ where: { id } });
            if (!deposit) {
                throw new Error('Deposit not found');
            }
            if (deposit.status !== 'PENDING') {
                throw new Error(`Deposit status is ${deposit.status}, cannot approve`);
            }

            // 1. Update Deposit status
            const updatedDeposit = await tx.depositOrder.update({
                where: { id },
                data: { status: 'COMPLETED' },
            });

            // 2. Add balance to user wallet
            const wallet = await tx.wallet.findUnique({ where: { userId: deposit.userId } });
            if (!wallet) {
                throw new Error('User wallet not found');
            }

            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: Number(deposit.amount) },
                },
            });

            // 3. Create Wallet Transaction Log
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    amount: Number(deposit.amount),
                },
            });

            return updatedDeposit;
        });
    }

    async rejectDeposit(id: string) {
        const deposit = await this.prisma.depositOrder.findUnique({ where: { id } });
        if (!deposit) {
            throw new Error('Deposit not found');
        }
        if (deposit.status !== 'PENDING') {
            throw new Error(`Deposit status is ${deposit.status}, cannot reject`);
        }

        return this.prisma.depositOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }

    async getWithdraws() {
        return this.prisma.withdrawOrder.findMany({
            include: {
                user: { select: { email: true, nickname: true, walletAddress: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async approveWithdraw(id: string) {
        return this.prisma.$transaction(async (tx) => {
            const withdraw = await tx.withdrawOrder.findUnique({ where: { id } });
            if (!withdraw) throw new Error('Withdraw order not found');
            if (withdraw.status !== 'PENDING') throw new Error('Withdraw status not PENDING');

            // 1. Update Order status
            const updatedOrder = await tx.withdrawOrder.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date()
                }
            });

            // 2. Finalize Wallet (remove locked balance)
            const wallet = await tx.wallet.findUnique({ where: { userId: withdraw.userId } });
            if (!wallet) throw new Error('Wallet not found');

            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    lockedBalance: { decrement: withdraw.amount }
                }
            });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAW', // Make sure this matches enum
                    amount: -Number(withdraw.amount)
                }
            });

            return updatedOrder;
        });
    }

    async rejectWithdraw(id: string) {
        return this.prisma.$transaction(async (tx) => {
            const withdraw = await tx.withdrawOrder.findUnique({ where: { id } });
            if (!withdraw) throw new Error('Withdraw order not found');
            if (withdraw.status !== 'PENDING') throw new Error('Withdraw status not PENDING');

            // 1. Update Order status
            const updatedOrder = await tx.withdrawOrder.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    processedAt: new Date()
                }
            });

            // 2. Refund Wallet (unlock balance)
            const wallet = await tx.wallet.findUnique({ where: { userId: withdraw.userId } });
            if (!wallet) throw new Error('Wallet not found');

            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: withdraw.amount },
                    lockedBalance: { decrement: withdraw.amount }
                }
            });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'UNLOCK',
                    amount: Number(withdraw.amount)
                }
            });

            return updatedOrder;
        });
    }
}
