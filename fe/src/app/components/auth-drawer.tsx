import React from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

interface AuthDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthDrawer: React.FC<AuthDrawerProps> = ({ isOpen, onClose }) => {
    const [mode, setMode] = React.useState<'login' | 'register' | 'forgot-password'>('login');
    const [showPassword, setShowPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    // Form states
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [nickname, setNickname] = React.useState('');

    const { loginWithEmail, register, forgotPassword } = useAuthStore();

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNickname('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
                onClose();
                resetForm();
            } else if (mode === 'register') {
                if (password !== confirmPassword) {
                    toast.error('Mật khẩu không khớp');
                    setIsLoading(false);
                    return;
                }
                if (password.length < 6) {
                    toast.error('Mật khẩu phải có ít nhất 6 ký tự');
                    setIsLoading(false);
                    return;
                }
                await register(email, password, nickname);
                toast.success('Đăng ký thành công!');
                onClose();
                resetForm();
            } else if (mode === 'forgot-password') {
                await forgotPassword(email);
                // Toast already handled in store
                // Optionally switch back to login or close
            }
        } catch (error) {
            // Error handling is mostly done in store, specifically toast errors
            // Specific fallback for unknown errors can be added here if needed
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        resetForm();
    };

    const switchToForgot = () => {
        setMode('forgot-password');
        resetForm();
    };

    const backToLogin = () => {
        setMode('login');
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-background to-background/95 border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Decorative Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-yellow-600/10 rounded-full blur-[60px]" />
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${mode === 'login' ? 'from-amber-400 to-yellow-600' : mode === 'register' ? 'from-amber-500 to-orange-600' : 'from-yellow-400 to-amber-600'} shadow-lg`}>
                            {mode === 'login' ? (
                                <LogIn className="h-6 w-6 text-white" />
                            ) : mode === 'register' ? (
                                <UserPlus className="h-6 w-6 text-white" />
                            ) : (
                                <Mail className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : 'Quên mật khẩu'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {mode === 'login' ? 'Chào mừng bạn quay lại!' : mode === 'register' ? 'Bắt đầu hành trình giao dịch' : 'Khôi phục quyền truy cập'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-accent/80 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative p-6 overflow-y-auto h-[calc(100%-88px)]">
                    {/* Welcome Message */}
                    <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/20">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <p className="text-sm">
                                {mode === 'login'
                                    ? 'Đăng nhập để tiếp tục giao dịch Gold & Oil và theo dõi danh mục của bạn.'
                                    : mode === 'register'
                                        ? 'Tham gia BSCXAU - Nền tảng giao dịch Gold & Oil chuyên nghiệp.'
                                        : 'Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nickname (register only) */}
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tên hiển thị</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="VD: CryptoTrader"
                                        className="pl-12 h-12 rounded-xl border-border/50 focus:border-primary bg-background/50"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-12 h-12 rounded-xl border-border/50 focus:border-primary bg-background/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        {mode !== 'forgot-password' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mật khẩu</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-12 pr-12 h-12 rounded-xl border-border/50 focus:border-primary bg-background/50"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}
                        {mode === 'login' && (
                            <div className="text-right mt-2">
                                <button type="button" onClick={switchToForgot} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                    Quên mật khẩu?
                                </button>
                            </div>
                        )}

                        {/* Confirm Password (register only) */}
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-12 h-12 rounded-xl border-border/50 focus:border-primary bg-background/50"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className={`w-full h-14 gap-3 text-lg font-semibold rounded-xl shadow-lg transition-all text-black ${mode === 'login'
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-600 hover:shadow-amber-500/30'
                                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/30'
                                }`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {mode === 'login' ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                                </>
                            ) : (
                                <>
                                    {mode === 'login' ? <LogIn className="h-5 w-5" /> : mode === 'register' ? <UserPlus className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                                    {mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : 'Gửi hướng dẫn'}
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Switch mode */}
                    <div className="mt-8 text-center">
                        {mode === 'forgot-password' ? (
                            <button
                                type="button"
                                onClick={backToLogin}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                Quay lại đăng nhập
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50">
                                <span className="text-sm text-muted-foreground">
                                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                                </span>
                                <button
                                    type="button"
                                    onClick={switchMode}
                                    className={`text-sm font-semibold ${mode === 'login' ? 'text-primary' : 'text-emerald-500'} hover:underline`}
                                >
                                    {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-border/50">
                        <p className="text-xs text-center text-muted-foreground">
                            Bằng việc tiếp tục, bạn đồng ý với{' '}
                            <span className="text-primary cursor-pointer hover:underline">Điều khoản dịch vụ</span>
                            {' '}và{' '}
                            <span className="text-primary cursor-pointer hover:underline">Chính sách bảo mật</span>
                            {' '}của chúng tôi.
                        </p>
                    </div>
                </div >
            </div >
        </>
    );
};
