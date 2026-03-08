import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    async sendPasswordReset(email: string, token: string) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const url = `${frontendUrl}/reset-password/${token}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Reset your password',
            text: `Click here to reset your password: ${url}. This link expires in 15 minutes.`,
            html: `
        <p>You requested a password reset.</p>
        <p>Click here to reset your password: <a href="${url}">${url}</a></p>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        });
    }
}
