import { Body, Controller, Post, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SePayWebhookDto } from './dto/sepay-webhook.dto';
import { SePayAuthGuard } from './guards/sepay-auth.guard';

@Controller('payment')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(private readonly paymentService: PaymentService) { }

    @Post('sepay-webhook')
    @UseGuards(SePayAuthGuard)
    @HttpCode(HttpStatus.OK)
    async handleSePayWebhook(@Body() data: SePayWebhookDto) {
        this.logger.log('Payment Webhook Received');
        return this.paymentService.processWebhook(data);
    }
}
