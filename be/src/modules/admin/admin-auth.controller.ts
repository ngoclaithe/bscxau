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
            console.log('[AdminAuth] Login success for:', body.email, 'Token generated');

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
                console.log('[AdminAuth] Production mode detected - using SameSite: none with Secure');
            } else {
                cookieOptions.secure = false;
                cookieOptions.sameSite = 'lax';
                console.log('[AdminAuth] Development mode - using SameSite: lax');
            }
            
            console.log('[AdminAuth] Setting admin_access_token cookie with options:', cookieOptions);
            res.cookie('admin_access_token', result.access_token, cookieOptions);

            return {
                admin: result.admin,
                accessToken: result.access_token // Include in body as fallback
            };
        } catch (error) {
            console.error('[AdminAuth] Login error:', error);
            throw error;
        }
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
        res.cookie('admin_access_token', '', cookieOptions);
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
