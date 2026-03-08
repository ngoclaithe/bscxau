import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { WalletAuthService } from './wallet-auth.service';
import { EmailAuthService } from './email-auth.service';
import { JwtStrategy } from './jwt.strategy';

import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        MailModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: (configService.get<string>('USER_JWT_EXPIRES_IN') || '30d') as any },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [WalletAuthService, EmailAuthService, JwtStrategy],
    exports: [WalletAuthService, EmailAuthService],
})
export class AuthModule { }

