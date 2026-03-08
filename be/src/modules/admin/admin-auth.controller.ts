import { Controller, Post, Get, Body, UseGuards, Request, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';

class AdminLoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(1)
    password: string;
}

@Controller('admin-auth')
export class AdminAuthController {
    constructor(private adminAuthService: AdminAuthService) { }

    @Post('login')
    async login(@Body() body: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
        console.log('[AdminAuth] Login attempt:', { email: body.email, passwordLength: body.password?.length });
        try {
            const result = await this.adminAuthService.login(body.email, body.password);
            console.log('[AdminAuth] Login success for:', body.email);

            res.cookie('access_token', result.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
            });

            return { admin: result.admin };
        } catch (error) {
            console.error('[AdminAuth] Login error:', error);
            throw error;
        }
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.cookie('access_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0),
        });
        return { message: 'Logged out' };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getMe(@Request() req: { user: { sub: string; isAdmin: boolean } }) {
        if (!req.user.isAdmin) {
            return { error: 'Not an admin' };
        }
        return this.adminAuthService.getAdminById(req.user.sub);
    }
}
