import { Controller, Post, Get, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WithdrawController {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService
    ) { }

    @Post('withdraw')
    async createWithdraw(@Request() req: any, @Body() body: { amount: number; bankName: string; bankCode: string; accountNumber: string; accountName: string }) {
        const userId = req.user.userId;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive) {
            throw new BadRequestException('Tài khoản bạn đã bị khóa.');
        }

        const { amount, bankName, bankCode, accountNumber, accountName } = body;

        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }

        // Lock balance (this will throw if insufficient balance)
        await this.walletService.lockBalance(userId, amount);

        // Create Withdraw Order
        const withdraw = await this.prisma.withdrawOrder.create({
            data: {
                userId,
                amount,
                bankName,
                bankCode,
                accountNumber,
                accountName,
                status: 'PENDING',
            }
        });

        return withdraw;
    }

    @Get('withdraws')
    async getMyWithdraws(@Request() req: any) {
        return this.prisma.withdrawOrder.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
