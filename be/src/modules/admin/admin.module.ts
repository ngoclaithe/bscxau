import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { FinanceController } from './finance.controller';
import { AdminConfigService } from './admin-config.service';
import { AdminMonitoringService } from './admin-monitoring.service';
import { AdminAuthService } from './admin-auth.service';
import { OracleModule } from '../oracle/oracle.module';

import { AdminBankService } from './admin-bank.service';
import { SystemConfigService } from './system-config.service';

import { WalletModule } from '../wallet/wallet.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [
        WalletModule,
        OracleModule,
        RedisModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: (configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '3d') as any },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AdminController, AdminAuthController, FinanceController],
    providers: [
        AdminConfigService,
        AdminMonitoringService,
        AdminAuthService,
        AdminBankService,
        SystemConfigService
    ],
})
export class AdminModule { }
