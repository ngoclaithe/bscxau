import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';

export const SecurityPolicyPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Chính sách Bảo mật</h1>
            <Card className="mb-8 border-green-500/20">
                <CardContent className="p-6 prose prose-invert max-w-none">
                    <h3>1. Bảo mật Thông tin</h3>
                    <p>BSCXAU cam kết bảo mật thông tin cá nhân của bạn theo tiêu chuẩn cao nhất. Chúng tôi không chia sẻ thông tin với bên thứ ba.</p>

                    <h3>2. 2FA (Xác thực 2 bước)</h3>
                    <p>Chúng tôi khuyến khích bạn bật xác thực 2 bước (2FA) Google Authenticator để bảo vệ tài khoản khỏi truy cập trái phép. Đây là tính năng bắt buộc cho một số thao tác quan trọng.</p>

                    <h3>3. Chống lửa và Mã hóa</h3>
                    <p>Hệ thống sử dụng SSL/TLS để mã hóa dữ liệu truyền tải. Mật khẩu của bạn được mã hóa an toàn bằng thuật toán Bcrypt hoặc Argon2.</p>

                    <h3>4. Giám sát Hệ thống</h3>
                    <p>Đội ngũ bảo mật của chúng tôi liên tục giám sát hệ thống để phát hiện và ngăn chặn các mối đe dọa tiềm ẩn.</p>

                    <h3>5. Báo cáo Lỗ hổng</h3>
                    <p>Nếu bạn phát hiện bất kỳ lỗ hổng bảo mật nào, vui lòng liên hệ với chúng tôi qua email support@bscxau.io.</p>
                </CardContent>
            </Card>
        </div>
    );
};
