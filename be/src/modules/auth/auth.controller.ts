import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { WalletAuthService } from './wallet-auth.service';
import { EmailAuthService } from './email-auth.service';

class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}

class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsOptional()
    nickname?: string;
}

@Controller('auth')
export class AuthController {
    constructor(
        private walletAuthService: WalletAuthService,
        private emailAuthService: EmailAuthService,
    ) { }

    @Post('login')
    async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
        const device = req.headers['user-agent'] || 'Unknown Device';
        const result = await this.emailAuthService.login(body.email, body.password, ip, device);
        this.setCookie(res, result.accessToken);
        return { user: result.user };
    }

    @Post('register')
    async register(@Body() body: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
        const device = req.headers['user-agent'] || 'Unknown Device';
        const result = await this.emailAuthService.register(body.email, body.password, body.nickname, ip, device);
        this.setCookie(res, result.accessToken);
        return { user: result.user };
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.emailAuthService.forgotPassword(body.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.emailAuthService.resetPassword(body.token, body.password);
    }

    @Post('wallet/login')
    async walletLogin(@Body() body: { walletAddress: string; signature: string }, @Res({ passthrough: true }) res: Response) {
        const result = await this.walletAuthService.loginWithWallet(body.walletAddress, body.signature);
        this.setCookie(res, result.accessToken);
        // WalletAuthService might return only accessToken currently, let's check
        return result;
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        // Detect if production: check NODE_ENV or if FRONTEND_URL is HTTPS
        const isProduction = process.env.NODE_ENV === 'production' || 
                             process.env.FRONTEND_URL?.includes('https');
        
        const cookieOptions: any = {
            httpOnly: true,
            path: '/',
            expires: new Date(0),
        };
        if (isProduction) {
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
        } else {
            cookieOptions.secure = false;
            cookieOptions.sameSite = 'lax';
        }
        res.cookie('access_token', '', cookieOptions);
        return { message: 'Logged out' };
    }

    private setCookie(res: Response, token: string) {
        // Detect if production: check NODE_ENV or if FRONTEND_URL is HTTPS
        const isProduction = process.env.NODE_ENV === 'production' || 
                             process.env.FRONTEND_URL?.includes('https');
        
        const cookieOptions: any = {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
            path: '/',
        };

        if (isProduction) {
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            console.log('[Auth] Production mode detected - using SameSite: none with Secure');
        } else {
            cookieOptions.secure = false;
            cookieOptions.sameSite = 'lax';
            console.log('[Auth] Development mode - using SameSite: lax');
        }
        
        console.log('[Auth] Setting access_token cookie with options:', cookieOptions);
        res.cookie('access_token', token, cookieOptions);
    }
}

