import React from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useWalletStore } from '@/stores/wallet-store';

export const WalletConnectPrompt: React.FC = () => {
  const { isConnected, connectWallet } = useWalletStore();

  if (isConnected) return null;

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-warning/10">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Kết nối ví để giao dịch</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bạn cần kết nối ví để có thể đặt lệnh và theo dõi giao dịch của mình
            </p>
            <Button onClick={connectWallet} className="gap-2">
              <Wallet className="h-4 w-4" />
              Kết nối ví ngay
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
