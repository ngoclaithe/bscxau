import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminConfigService } from './admin-config.service';
import { AdminMonitoringService } from './admin-monitoring.service';
import { PriceManipulationService } from '../oracle/price-manipulation.service';
import { AdminBankService } from './admin-bank.service';
import { SystemConfigService } from './system-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR')
export class AdminController {
    constructor(
        private configService: AdminConfigService,
        private monitoringService: AdminMonitoringService,
        private priceManipulation: PriceManipulationService,
        private bankService: AdminBankService,
        private systemConfig: SystemConfigService,
        private prisma: PrismaService,
    ) { }

    @Get('configs')
    async getConfigs() {
        return this.systemConfig.getAllConfigs();
    }

    @Post('configs')
    @Roles('ADMIN')
    async setConfig(@Body() body: { key: string; value: any }) {
        return this.systemConfig.setConfig(body.key, body.value);
    }

    @Get('ips')
    async getBlockedIps() {
        return this.prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } });
    }

    @Post('ips')
    @Roles('ADMIN')
    async blockIp(@Body() body: { ipAddress: string; reason?: string }, @Request() req: any) {
        return this.prisma.blockedIp.create({
            data: {
                ipAddress: body.ipAddress,
                reason: body.reason,
                blockedBy: req.user?.userId || 'admin',
            }
        });
    }

    @Delete('ips/:ip')
    async unblockIp(@Param('ip') ip: string) {
        return this.prisma.blockedIp.delete({ where: { ipAddress: ip } });
    }

    @Get('banks')
    async getBanks() {
        return this.bankService.getBanks();
    }

    @Post('banks')
    async createBank(@Body() body: any) {
        return this.bankService.createBank(body);
    }

    @Put('banks/:id')
    async updateBank(@Param('id') id: string, @Body() body: any) {
        return this.bankService.updateBank(id, body);
    }

    @Delete('banks/:id')
    async deleteBank(@Param('id') id: string) {
        return this.bankService.deleteBank(id);
    }

    @Get('deposits')
    async getDeposits() {
        return this.bankService.getDeposits();
    }

    @Post('deposits/:id/approve')
    async approveDeposit(@Param('id') id: string) {
        return this.bankService.approveDeposit(id);
    }

    @Post('deposits/:id/reject')
    async rejectDeposit(@Param('id') id: string) {
        return this.bankService.rejectDeposit(id);
    }

    @Get('withdraws')
    async getWithdraws() {
        return this.bankService.getWithdraws();
    }

    @Post('withdraws/:id/approve')
    async approveWithdraw(@Param('id') id: string) {
        return this.bankService.approveWithdraw(id);
    }

    @Post('withdraws/:id/reject')
    async rejectWithdraw(@Param('id') id: string) {
        return this.bankService.rejectWithdraw(id);
    }


    @Get('dashboard')
    async getDashboard() {
        return this.monitoringService.getDashboard();
    }

    @Get('traders')
    async getTraders(
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        return this.monitoringService.getTraders(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20
        );
    }

    @Get('traders/:id')
    async getTrader(@Param('id') id: string) {
        return this.monitoringService.getTraderDetails(id);
    }

    @Post('traders/:id/balance')
    @Roles('ADMIN')
    async adjustBalance(
        @Param('id') id: string,
        @Body() body: { amount: number; type: 'DEPOSIT' | 'WITHDRAW'; note?: string }
    ) {
        return this.monitoringService.adjustBalance(id, body.amount, body.type, body.note);
    }

    @Get('trades')
    async getTrades(@Query('status') status?: string) {
        return this.monitoringService.getTrades(status);
    }

    @Get('trades/filtered')
    async getTradesFiltered(
        @Query('status') status?: string,
        @Query('userQuery') userQuery?: string,
        @Query('minAmount') minAmount?: string,
        @Query('pairSymbol') pairSymbol?: string,
        @Query('limit') limit?: string,
    ) {
        return this.monitoringService.getTradesWithFilters({
            status,
            userQuery,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            pairSymbol,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    @Get('trades/user/:userId')
    async getUserTrades(
        @Param('userId') userId: string,
        @Query('limit') limit?: string,
    ) {
        return this.monitoringService.getUserTrades(userId, limit ? parseInt(limit) : 50);
    }

    @Get('trades/large')
    async getLargeTrades(
        @Query('minAmount') minAmount?: string,
        @Query('limit') limit?: string,
    ) {
        return this.monitoringService.getLargeTrades(
            minAmount ? parseFloat(minAmount) : 1000,
            limit ? parseInt(limit) : 50
        );
    }

    @Get('logs')
    async getLogs() {
        return this.monitoringService.getLogs();
    }

    @Get('pairs')
    async getPairs() {
        return this.configService.getTradingPairs();
    }

    @Post('pairs')
    @Roles('ADMIN')
    async createPair(@Body() body: { symbol: string; payoutRate: number }) {
        return this.configService.createPair(body.symbol, body.payoutRate);
    }

    @Patch('pairs/:id')
    @Roles('ADMIN')
    async updatePair(@Param('id') id: string, @Body() body: { payoutRate?: number; isActive?: boolean }) {
        return this.configService.updatePair(id, body);
    }

    @Post('system/pause')
    async pause() {
        return this.configService.pauseTrading();
    }

    @Post('system/resume')
    async resume() {
        return this.configService.resumeTrading();
    }

    @Patch('users/:id/status')
    async updateUserStatus(
        @Param('id') id: string,
        @Body() body: { isActive: boolean; status: string }
    ) {
        // @ts-ignore
        return this.prisma.user.update({
            where: { id },
            data: {
                // @ts-ignore
                isActive: body.isActive,
                // @ts-ignore
                status: body.status,
            }
        });
    }

    // ============ Price Manipulation Endpoints ============

    /**
     * Get all current prices
     */
    @Get('prices')
    @Roles('ADMIN')
    async getAllPrices() {
        return {
            prices: this.priceManipulation.getAllBasePrices(),
            activeTargets: this.priceManipulation.getActivePriceTargets(),
        };
    }

    /**
     * Get current price for a specific pair
     */
    @Get('prices/:pair')
    async getPrice(@Param('pair') pair: string) {
        const decodedPair = decodeURIComponent(pair);
        return {
            pair: decodedPair,
            price: this.priceManipulation.getCurrentPrice(decodedPair),
        };
    }

    /**
     * Set a price target for a symbol
     * Price will gradually move towards target over the specified duration
     */
    @Post('prices/target')
    @Roles('ADMIN')
    async setPriceTarget(
        @Body() body: { pair: string; targetPrice: number; durationSeconds: number }
    ) {
        const target = await this.priceManipulation.setPriceTarget(
            body.pair,
            body.targetPrice,
            body.durationSeconds,
        );
        return {
            success: true,
            target,
        };
    }

    /**
     * Set immediate price for a symbol (no gradual transition)
     */
    @Post('prices/set')
    @Roles('ADMIN')
    async setImmediatePrice(@Body() body: { pair: string; price: number }) {
        this.priceManipulation.setBasePrice(body.pair, body.price);
        return {
            success: true,
            pair: body.pair,
            price: body.price,
        };
    }

    /**
     * Cancel an active price target
     */
    @Delete('prices/target/:pair')
    @Roles('ADMIN')
    async cancelPriceTarget(@Param('pair') pair: string) {
        const decodedPair = decodeURIComponent(pair);
        const cancelled = this.priceManipulation.cancelPriceTarget(decodedPair);
        return {
            success: cancelled,
            pair: decodedPair,
        };
    }

    /**
     * Reset price to Binance oracle price
     */
    @Post('prices/reset/:pair')
    @Roles('ADMIN')
    async resetPriceToOracle(@Param('pair') pair: string) {
        const decodedPair = decodeURIComponent(pair);
        const oraclePrice = await this.priceManipulation.resetToOraclePrice(decodedPair);
        return {
            success: true,
            pair: decodedPair,
            price: oraclePrice,
        };
    }

    /**
     * Get active price targets
     */
    @Get('prices/targets/active')
    async getActiveTargets() {
        return this.priceManipulation.getActivePriceTargets();
    }


}
