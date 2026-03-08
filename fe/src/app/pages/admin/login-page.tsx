import React from 'react';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useAdminStore } from '@/stores/admin-store';
import { toast } from 'sonner';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAdminStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess();
      } else {
        toast.error('Sai email hoặc mật khẩu');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/images/background_admin_login.webp')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <Card className="w-full max-w-md relative bg-background/80 backdrop-blur-xl border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">BSC XAU</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Hệ thống quản trị và giám sát giao dịch
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email quản trị</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bscxau.io"
                required
                className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mật khẩu</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xác thực...
                </div>
              ) : 'Bắt đầu làm việc'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Secure Administrator Access Only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
