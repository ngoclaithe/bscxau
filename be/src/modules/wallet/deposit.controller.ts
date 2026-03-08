import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class DepositController {
    constructor(private prisma: PrismaService) { }

    @Get('banks')
    async getActiveBanks() {
        return this.prisma.bankAccount.findMany({
            where: { isActive: true },
        });
    }

    @Post('deposit')
    async createDeposit(@Request() req: any, @Body() body: { amount: number; bankAccountId?: string; bankId?: string }) {
        const userId = req.user.userId;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive) {
            throw new BadRequestException('Tài khoản bạn đã bị khóa.');
        }

        const bankAccountId = body.bankAccountId || body.bankId;

        if (!bankAccountId) {
            throw new BadRequestException('Bank account ID is required');
        }

        let codePay = '';
        let retries = 5;
        while (retries > 0) {
            codePay = this.generateCodePay();
            const exists = await this.prisma.depositOrder.findUnique({ where: { codePay } });
            if (!exists) break;
            retries--;
        }

        if (retries === 0) {
            throw new InternalServerErrorException('System busy, please try again');
        }

        const expiredAt = new Date();
        expiredAt.setMinutes(expiredAt.getMinutes() + 15);

        const deposit = await this.prisma.depositOrder.create({
            data: {
                userId,
                bankAccountId,
                amount: body.amount,
                codePay,
                expiredAt,
                status: 'PENDING',
            },
            include: {
                bankAccount: true,
            },
        });

        return deposit;
    }

    @Get('deposits')
    async getMyDeposits(@Request() req: any) {
        return this.prisma.depositOrder.findMany({
            where: { userId: req.user.userId },
            include: { bankAccount: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    private generateCodePay(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
