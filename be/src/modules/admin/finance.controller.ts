import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminBankService } from './admin-bank.service';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'FINANCE_AUDITOR')
export class FinanceController {
    constructor(private bankService: AdminBankService) { }

    @Get('deposits')
    async getDeposits() {
        return this.bankService.getDeposits();
    }

    @Post('deposits/:id/approve')
    @Roles('ADMIN', 'FINANCE_AUDITOR')
    async approveDeposit(@Param('id') id: string) {
        return this.bankService.approveDeposit(id);
    }

    @Post('deposits/:id/reject')
    @Roles('ADMIN', 'FINANCE_AUDITOR')
    async rejectDeposit(@Param('id') id: string) {
        return this.bankService.rejectDeposit(id);
    }

    @Get('withdraws')
    async getWithdraws() {
        return this.bankService.getWithdraws();
    }

    @Post('withdraws/:id/approve')
    @Roles('ADMIN', 'FINANCE_AUDITOR')
    async approveWithdraw(@Param('id') id: string) {
        return this.bankService.approveWithdraw(id);
    }

    @Post('withdraws/:id/reject')
    @Roles('ADMIN', 'FINANCE_AUDITOR')
    async rejectWithdraw(@Param('id') id: string) {
        return this.bankService.rejectWithdraw(id);
    }
}
