import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateAdmin(email: string, password: string) {
        // 1. Try to find in User table first (New RBAC system)
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (user && ['ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR'].includes(user.role)) {
            const isPasswordValid = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;

            if (isPasswordValid) {
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role, // Return actual role (ADMIN, TRADE_AUDITOR, etc.)
                    passwordHash: user.passwordHash,
                    isLegacy: false
                };
            }
        }

        // 2. Fallback to AdminUser table (Legacy system)
        const admin = await this.prisma.adminUser.findUnique({
            where: { email },
        });

        if (admin) {
            const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
            if (isPasswordValid) {
                return {
                    id: admin.id,
                    email: admin.email,
                    role: 'ADMIN', // Normalize legacy 'admin' to 'ADMIN'
                    passwordHash: admin.passwordHash,
                    isLegacy: true
                };
            }
        }

        return null;
    }

    async login(email: string, password: string) {
        const admin = await this.validateAdmin(email, password);

        if (!admin) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        const payload = {
            sub: admin.id,
            email: admin.email,
            role: admin.role,
            isAdmin: true, // Flag necessary for current guards
        };

        return {
            access_token: this.jwtService.sign(payload),
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
        };
    }

    async getAdminById(id: string) {
        // 1. Try User table first
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (user && ['ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR'].includes(user.role)) {
            return user;
        }

        // 2. Fallback to AdminUser
        return this.prisma.adminUser.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async createAdmin(email: string, password: string, role: string = 'admin') {
        const hashedPassword = await bcrypt.hash(password, 10);

        return this.prisma.adminUser.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role,
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
    }
}
