import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../infrastructure/database/prisma.service';

// Only Admin should access POST/PUT/DELETE
@Controller('admin/banks')
@UseGuards(AuthGuard('jwt'))
export class AdminBankController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getBanks() {
        return this.prisma.bankAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    @Post()
    async createBank(@Request() req: any, @Body() body: any) {
        // Check admin role here if needed
        return this.prisma.bankAccount.create({
            data: {
                accountName: body.accountName,
                bankName: body.bankName,
                bankCode: body.bankCode,
                accountNumber: body.accountNumber,
                isActive: true,
            },
        });
    }

    @Put(':id')
    async updateBank(@Param('id') id: string, @Body() body: any) {
        return this.prisma.bankAccount.update({
            where: { id },
            data: body,
        });
    }

    @Delete(':id')
    async deleteBank(@Param('id') id: string) {
        return this.prisma.bankAccount.delete({
            where: { id },
        });
    }
}
