import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';

export const RiskDisclosurePage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-red-500">Cảnh Báo Rủi Ro</h1>
            <Card className="mb-8 border-red-500/20">
                <CardContent className="p-6 prose prose-invert max-w-none">
                    <h3>1. Rủi ro mất vốn</h3>
                    <p>Giao dịch Quyền chọn Nhị phân (Binary Options) và Crypto là các hình thức đầu tư có rủi ro cao. Bạn có thể mất toàn bộ số vốn đầu tư.</p>

                    <h3>2. Biến động thị trường</h3>
                    <p>Thị trường tài chính luôn biến động mạnh và khó lường. Giá cả tài sản có thể thay đổi nhanh chóng trong thời gian ngắn, ảnh hưởng đến kết quả giao dịch của bạn.</p>

                    <h3>3. Không khuyến nghị đầu tư</h3>
                    <p>Các thông tin, phân tích, và tín hiệu trên BSCXAU chỉ mang tính chất tham khảo và giáo dục. Chúng tôi không đưa ra lời khuyên đầu tư tài chính.</p>

                    <h3>4. Trách nhiệm người dùng</h3>
                    <p>Bạn hoàn toàn chịu trách nhiệm về các quyết định giao dịch của mình. BSCXAU không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc sử dụng nền tảng.</p>

                    <h3>5. Khuyến cáo</h3>
                    <p>Nếu bạn không hiểu rõ về các rủi ro liên quan, vui lòng tìm kiếm lời khuyên từ chuyên gia tài chính độc lập trước khi tham gia giao dịch.</p>
                </CardContent>
            </Card>
        </div>
    );
};
