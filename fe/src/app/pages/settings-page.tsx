import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import * as Switch from '@radix-ui/react-switch';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = React.useState({
    tradeResults: true,
    copyTrade: true,
    riskWarnings: true,
    priceAlerts: false,
  });

  const [slippage, setSlippage] = React.useState('0.5');
  const [defaultAmount, setDefaultAmount] = React.useState('10');

  const handleSave = () => {
    toast.success('Đã lưu cài đặt!');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cài đặt</h1>
        <p className="text-muted-foreground">
          Tùy chỉnh trải nghiệm của bạn
        </p>
      </div>

      {/* Trading Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Cài đặt giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-2 font-semibold">
              Slippage tolerance (%)
            </label>
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              step="0.1"
              min="0"
              max="5"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Độ trượt giá chấp nhận được (0-5%)
            </p>
          </div>

          <div>
            <label className="block text-sm mb-2 font-semibold">
              Số tiền mặc định (VND)
            </label>
            <Input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              min="1"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Số tiền sẽ được điền sẵn khi đặt lệnh
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Quick trade mode</div>
                <div className="text-sm text-muted-foreground">
                  Bỏ qua xác nhận khi đặt lệnh
                </div>
              </div>
              <Switch.Root
                defaultChecked={false}
                className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
              </Switch.Root>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Kết quả giao dịch</div>
              <div className="text-sm text-muted-foreground">
                Nhận thông báo khi lệnh được thanh toán
              </div>
            </div>
            <Switch.Root
              checked={notifications.tradeResults}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, tradeResults: checked }))
              }
              className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
            </Switch.Root>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Copy trade</div>
              <div className="text-sm text-muted-foreground">
                Thông báo khi có lệnh được copy
              </div>
            </div>
            <Switch.Root
              checked={notifications.copyTrade}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, copyTrade: checked }))
              }
              className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
            </Switch.Root>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Cảnh báo rủi ro</div>
              <div className="text-sm text-muted-foreground">
                Cảnh báo khi có hoạt động bất thường
              </div>
            </div>
            <Switch.Root
              checked={notifications.riskWarnings}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, riskWarnings: checked }))
              }
              className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
            </Switch.Root>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Cảnh báo giá</div>
              <div className="text-sm text-muted-foreground">
                Thông báo khi giá đạt mức đặt trước
              </div>
            </div>
            <Switch.Root
              checked={notifications.priceAlerts}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, priceAlerts: checked }))
              }
              className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
            </Switch.Root>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Giao diện
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-2 font-semibold">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-lg border-2 border-primary bg-background">
                <div className="h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded mb-2" />
                <div className="font-semibold">Dark Mode</div>
                <div className="text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> Active</div>
              </button>
              <button className="p-4 rounded-lg border border-border bg-background opacity-50 cursor-not-allowed">
                <div className="h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2" />
                <div className="font-semibold">Light Mode</div>
                <div className="text-xs text-muted-foreground">Coming soon</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 font-semibold">Ngôn ngữ</label>
            <select className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-xs">
              <option value="vi">Tiếng Việt</option>
              <option value="en" disabled>
                English (Coming soon)
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="font-semibold">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Tăng cường bảo mật cho tài khoản
              </div>
            </div>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-semibold">Session timeout</div>
              <div className="text-sm text-muted-foreground">
                Tự động ngắt kết nối sau 30 phút không hoạt động
              </div>
            </div>
            <Switch.Root
              defaultChecked={true}
              className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
            </Switch.Root>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Lưu tất cả cài đặt
        </Button>
      </div>
    </div>
  );
};
