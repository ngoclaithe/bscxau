import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SePayAuthGuard implements CanActivate {
    private readonly logger = new Logger(SePayAuthGuard.name);

    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        const configuredApiKey = this.configService.get<string>('SEPAY_WEBHOOK_API_KEY');

        // Nếu chưa cấu hình API Key, block request để đảm bảo an toàn
        if (!configuredApiKey) {
            this.logger.error('SEPAY_WEBHOOK_API_KEY is not configured in .env');
            throw new UnauthorizedException('Server configuration error: Missing API Key');
        }

        // Format expected: "Apikey <YOUR_KEY>"
        const expectedHeader = `Apikey ${configuredApiKey}`;

        if (!authHeader || authHeader !== expectedHeader) {
            this.logger.warn(`Invalid SePay Webhook attempt. Header: ${authHeader}`);
            throw new UnauthorizedException('Invalid SePay API Key');
        }

        return true;
    }
}
