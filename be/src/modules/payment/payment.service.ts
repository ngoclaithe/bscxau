import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SePayWebhookDto } from './dto/sepay-webhook.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    async processWebhook(data: SePayWebhookDto) {
        this.logger.log(`Received Webhook: ${JSON.stringify(data)}`);

        // 1. Chỉ xử lý giao dịch nhận tiền (transferType = 'in')
        if (data.transferType !== 'in') {
            return { message: 'Ignored: Not an incoming transfer' };
        }

        // 2. Tìm Deposit Order dựa trên nội dung chuyển khoản
        /*
          Nội dung chuyển khoản thường chứa CodePay.
          CodePay là unique string (6 chars) được generate khi tạo lệnh nạp.
          Ví dụ: content = "SEPAY ABC123" -> CodePay = "ABC123"
        */

        // Lấy tất cả các lệnh PENDING để so sánh (hoặc tìm theo pattern nếu có quy tắc)
        // Cách tốt nhất: Tìm pending order mà codePay nằm trong content
        // Tuy nhiên Prisma không hỗ trợ "reverse contains" dễ dàng.
        // Ta có thể regex content để lấy code, hoặc query pending orders và check in-memory.
        // Giả sử codePay là 6 ký tự viết hoa.
        const searchContent = ((data.content || '') + ' ' + (data.description || '')).toUpperCase();

        // Lấy tất cả các lệnh PENDING để so sánh optimization
        const pendingOrders = await this.prisma.depositOrder.findMany({
            where: { status: 'PENDING' },
            include: { user: true }
        });

        // Tìm order khớp
        const matchedOrder = pendingOrders.find(order =>
            searchContent.includes(order.codePay.toUpperCase())
        );

        if (!matchedOrder) {
            this.logger.warn(`No pending order found for content: ${data.content}. Search scope: ${searchContent}`);
            this.logger.debug(`Available Pending Codes: ${pendingOrders.map(o => o.codePay).join(', ')}`);
            return { message: 'Ignored: No matching pending order' };
        }

        // 3. Kiểm tra số tiền
        // User rule: khớp số tiền (lớn hơn không quá 50,000 VND)
        const orderAmountVND = Number(matchedOrder.amount);
        const expectedAmountVND = orderAmountVND;
        const transferAmountVND = data.transferAmount;

        if (transferAmountVND < expectedAmountVND) {
            this.logger.warn(`Amount mismatch for order ${matchedOrder.codePay}. Expected >= ${expectedAmountVND} VND, got ${transferAmountVND} VND`);
            return { message: 'Ignored: Amount too small' };
        }

        if (transferAmountVND > expectedAmountVND + 50000) {
            this.logger.warn(`Amount mismatch for order ${matchedOrder.codePay}. Expected <= ${expectedAmountVND + 50000} VND, got ${transferAmountVND} VND`);
            return { message: 'Ignored: Amount exceeds allowed difference' };
        }

        // 4. Update đơn hàng và cộng tiền
        // Sử dụng transaction để đảm bảo tính toàn vẹn
        await this.prisma.$transaction(async (tx) => {
            // Update Deposit Order
            await tx.depositOrder.update({
                where: { id: matchedOrder.id },
                data: {
                    status: 'COMPLETED', // Status enum khớp với schema
                    amount: orderAmountVND, // Giữ nguyên số VND đã confirm
                }
            });

            // Update Wallet: Cộng số VND vào ví
            const wallet = await tx.wallet.findFirst({
                where: { userId: matchedOrder.userId }
            });

            if (wallet) {
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: { increment: orderAmountVND } // Cộng VND
                    }
                });

                // Create Transaction Record
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'DEPOSIT',
                        amount: orderAmountVND, // Record VND
                        txHash: `SEPAY-${data.id}`,
                    }
                });
            }
        });

        this.logger.log(`Successfully processed deposit for order: ${matchedOrder.codePay}, User: ${matchedOrder.user.email}, Added: ${orderAmountVND} VND`);

        // TODO: Emit socket event to notify frontend
        // this.eventEmitter.emit('deposit.success', { userId: matchedOrder.userId, amount: transferAmount });

        return { success: true, message: 'Deposit approved' };
    }
}
