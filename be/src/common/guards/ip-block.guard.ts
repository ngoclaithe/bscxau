import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class IpBlockGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const ip = request.headers['x-forwarded-for'] || request.ip || request.connection.remoteAddress;

        const cleanIp = typeof ip === 'string' ? ip.split(',')[0].trim().replace(/^::ffff:/, '') : '';

        if (!cleanIp) return true;

        const blocked = await this.prisma.blockedIp.findUnique({
            where: { ipAddress: cleanIp },
        });

        if (blocked) {
            throw new ForbiddenException('Access denied due to security policy.');
        }

        return true;
    }
}
