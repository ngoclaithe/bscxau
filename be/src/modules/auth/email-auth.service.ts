import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmailAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException('Không tìm thấy email');

        const token = crypto.randomBytes(32).toString('hex');

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            }
        });

        await this.mailService.sendPasswordReset(email, token);
        return { message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: { gt: new Date() }
            }
        });

        if (!user) throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpires: null,
            }
        });

        return { message: 'Đặt lại mật khẩu thành công' };
    }

    async register(email: string, password: string, nickname?: string, ip?: string, device?: string) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Email đã được sử dụng');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                nickname: nickname || email.split('@')[0],
                role: 'USER',
                wallet: {
                    create: {
                        balance: 1000, // Give demo balance
                        lockedBalance: 0,
                    },
                },
            },
            include: {
                wallet: true,
            },
        });

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        let expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        try {
            const decoded = this.jwtService.decode(accessToken) as any;
            if (decoded && decoded.exp) {
                expiresAt = new Date(decoded.exp * 1000);
            }
        } catch (e) { }

        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                accessToken,
                ipAddress: ip || null,
                device: device || null,
                expiresAt,
            }
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                role: user.role,
                balance: user.wallet?.balance || 0,
            },
        };
    }

    async login(email: string, password: string, ip?: string, device?: string) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                wallet: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Check password
        if (!user.passwordHash) {
            throw new UnauthorizedException('Tài khoản không sử dụng mật khẩu');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Generate JWT
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        let expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        try {
            const decoded = this.jwtService.decode(accessToken) as any;
            if (decoded && decoded.exp) {
                expiresAt = new Date(decoded.exp * 1000);
            }
        } catch (e) { }

        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                accessToken,
                ipAddress: ip || null,
                device: device || null,
                expiresAt,
            }
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                role: user.role,
                balance: user.wallet?.balance || 0,
            },
        };
    }
}
