import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const request = req as any;
        const xForwardedFor = request.headers['x-forwarded-for'];
        const forwardedIp = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;

        const ip = forwardedIp || request.ip || request.socket?.remoteAddress || request.connection?.remoteAddress;

        if (typeof ip === 'string') {
            return ip.split(',')[0].trim().replace(/^::ffff:/, '');
        }

        return 'unknown';
    }

    protected async throwThrottlingException(): Promise<void> {
        throw new ThrottlerException('Truy cập quá nhanh, vui lòng thử lại sau.');
    }
}
