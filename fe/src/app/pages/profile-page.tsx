import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { useWalletStore } from '@/stores/wallet-store';
import { Camera, Copy, Edit2, Shield, Wallet, Award, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, getAvatarUrl } from '@/lib/utils';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, uploadAvatar, fetchUser, changePassword } = useAuthStore();
  const { balance, fetchWallet } = useWalletStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setIsPublic(user.isPublic || false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({ nickname, bio, isPublic });
    await fetchUser(); // Refresh to get latest stats if needed
    setIsEditOpen(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự');
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setIsPasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      // Error handled in store
    }
  };

  const copyPublicLink = () => {
    const linkNickname = user?.nickname || user?.id; // Fallback to ID if no nickname
    const url = `${window.location.origin}/u/${encodeURIComponent(linkNickname || '')}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết hồ sơ');
  };

  if (!user) return <div className="p-8 text-center text-muted-foreground">Đang tải hồ sơ...</div>;

  const stats = user.liveStats || { totalTrades: 0, winRate: 0 };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Profile */}
      <Card className="mb-8 border-none bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <CardContent className="pt-8 pb-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-24 w-24 border-4 border-white/10 shadow-xl group-hover:border-primary/50 transition-colors">
                <AvatarImage src={getAvatarUrl(user.avatarUrl)} alt={user.nickname} className="object-cover" />
                <AvatarFallback className="text-2xl bg-slate-700">{user.email[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-2xl font-bold">{user.nickname || user.email.split('@')[0]}</h1>
                <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-none">
                  {user.role}
                </Badge>
                {user.isPublic && (
                  <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
                    Public Profile
                  </Badge>
                )}
              </div>
              <p className="text-slate-300 max-w-lg mx-auto md:mx-0">
                {user.bio || 'Chưa có giới thiệu.'}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)} className="gap-2 text-white border-white/20 hover:bg-white/10">
                  <Edit2 className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
                <Button size="sm" variant="outline" className="gap-2 border-white/20 hover:bg-white/10 text-white" onClick={copyPublicLink}>
                  <Copy className="h-4 w-4" />
                  Link Hồ sơ
                </Button>
              </div>
            </div>

            <div className="hidden md:block text-right space-y-1 text-sm text-slate-400">
              <div>Email: <span className="text-slate-200">{user.email}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Bảo mật
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Số dư ví
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {balance !== undefined ? formatCurrency(balance) : '---'}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tổng giao dịch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTrades}</div>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Tỷ lệ thắng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {stats.winRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Thông tin bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email đăng nhập</label>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">{user.email}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mật khẩu</label>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border flex justify-between items-center">
                      <span>••••••••••••</span>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsPasswordOpen(true)}>Thay đổi</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
            <DialogDescription>Cập nhật thông tin hiển thị của bạn.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Biệt danh (Nickname)</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nhập biệt danh hiển thị"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giới thiệu (Bio)</label>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Mô tả ngắn về bạn"
              />
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer block">Hồ sơ công khai</label>
                <p className="text-xs text-muted-foreground">Cho phép người khác xem thống kê giao dịch của bạn qua liên kết.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveProfile}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>Nhập mật khẩu hiện tại và mật khẩu mới của bạn.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mật khẩu hiện tại</label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mật khẩu mới</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Hủy</Button>
            <Button onClick={handleChangePassword}>Cập nhật mật khẩu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
