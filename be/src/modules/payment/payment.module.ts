import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SePayAuthGuard } from './guards/sepay-auth.guard';

@Module({
    controllers: [PaymentController],
    providers: [PaymentService, SePayAuthGuard],
    exports: [PaymentService]
})
export class PaymentModule { }
