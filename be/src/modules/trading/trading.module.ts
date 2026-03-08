import { Module, forwardRef } from '@nestjs/common';
import { TradeCommandService } from './trade-command.service';
import { TradeSettlementService } from './trade-settlement.service';
import { TradeSchedulerService } from './trade-scheduler.service';
import { TradingController } from './trading.controller';
import { TradingPairsController } from './trading-pairs.controller';
import { TradingGateway } from './trading.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { UserModule } from '../user/user.module';
import { OracleModule } from '../oracle/oracle.module';
import { RedisModule } from '../redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        WalletModule,
        UserModule,
        OracleModule,
        RedisModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: (configService.get<string>('USER_JWT_EXPIRES_IN') || '30d') as any },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [TradingController, TradingPairsController],
    providers: [TradeCommandService, TradeSettlementService, TradeSchedulerService, TradingGateway],
    exports: [TradeCommandService, TradeSettlementService],
})
export class TradingModule { }

