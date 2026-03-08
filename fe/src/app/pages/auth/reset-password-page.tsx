import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

interface ResetPasswordPageProps {
    token: string;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token }) => {
    const { resetPassword } = useAuthStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Mật khẩu không khớp');
            return;
        }
        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(token, password);
            setIsSuccess(true);
        } catch (error: any) {
            // error already handled in store
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md border-border/50">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Thành công!</CardTitle>
                        <CardDescription className="text-base">
                            Mật khẩu của bạn đã được đặt lại thành công.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <Button className="w-full" onClick={() => window.location.href = '/'}>
                            Về trang đăng nhập
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border-border/50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
                    <CardDescription>
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Đặt lại mật khẩu'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
