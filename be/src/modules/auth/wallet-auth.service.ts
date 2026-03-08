import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IAuthService } from '../../common/interfaces';

@Injectable()
export class WalletAuthService implements IAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async loginWithWallet(walletAddress: string, signature: string) {
        let user = await this.prisma.user.findUnique({
            where: { walletAddress },
            include: { wallet: true },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    walletAddress,
                    wallet: { create: { balance: 0, lockedBalance: 0 } },
                    stats: { create: {} },
                },
                include: { wallet: true },
            });
        }

        const payload = { sub: user.id, wallet: user.walletAddress, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                role: user.role || 'USER',
                balance: user.wallet?.balance || 0,
                avatarUrl: user.avatarUrl,
            }
        };
    }
}
