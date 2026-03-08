import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupportService } from './support.service';
import { SupportUserController, SupportAdminController } from './support.controller';
import { SupportGateway } from './support.gateway';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [SupportUserController, SupportAdminController],
    providers: [SupportService, SupportGateway],
    exports: [SupportService],
})
export class SupportModule { }
