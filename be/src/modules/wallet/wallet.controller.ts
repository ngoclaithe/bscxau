import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
    constructor(private walletService: WalletService) { }

    @Get()
    async getWallet(@Request() req: { user: { userId: string } }) {
        return this.walletService.getWallet(req.user.userId);
    }

    @Get('deposit/:id')
    async getDepositById(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
        return this.walletService.getDepositById(req.user.userId, id);
    }

    @Get('transactions')
    async getTransactions(@Request() req: { user: { userId: string } }) {
        return this.walletService.getDetailedHistory(req.user.userId);
    }
}
