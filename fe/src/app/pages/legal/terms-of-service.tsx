import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';

export const TermsOfServicePage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Điều khoản Dịch vụ</h1>
            <Card className="mb-8">
                <CardContent className="p-6 prose prose-invert max-w-none">
                    <h3>1. Giới thiệu</h3>
                    <p>Chào mừng bạn đến với BSCXAU. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản này.</p>

                    <h3>2. Dịch vụ Giao dịch</h3>
                    <p>BSCXAU cung cấp nền tảng giao dịch Vàng &amp; Dầu thô (Gold &amp; Oil). Chúng tôi không giữ tiền của người dùng và không can thiệp vào kết quả.</p>

                    <h3>3. Tài khoản Người dùng</h3>
                    <p>Bạn cam kết cung cấp thông tin chính xác khi đăng ký. Bạn chịu trách nhiệm hoàn toàn về các hoạt động diễn ra trên tài khoản của mình.</p>

                    <h3>4. Rủi ro</h3>
                    <p>Giao dịch tài chính luôn tiềm ẩn rủi ro mất vốn. Bạn chỉ nên giao dịch với số tiền bạn có thể chấp nhận mất.</p>

                    <h3>5. Thay đổi Điều khoản</h3>
                    <p>Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào mà không cần báo trước. Vui lòng kiểm tra thường xuyên.</p>
                </CardContent>
            </Card>
        </div>
    );
};
