import React from 'react';
import { Wallet, LineChart, Copy, Trophy } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export const QuickStartGuide: React.FC = () => {
  const steps = [
    {
      icon: Wallet,
      title: 'Kết nối ví',
      description: 'Kết nối ví MetaMask hoặc WalletConnect của bạn',
      color: 'text-blue-500',
    },
    {
      icon: LineChart,
      title: 'Chọn & Giao dịch',
      description: 'Chọn cặp, timeframe và đặt lệnh UP/DOWN',
      color: 'text-purple-500',
    },
    {
      icon: Copy,
      title: 'Copy Trader',
      description: 'Tùy chọn: Sao chép giao dịch từ trader hàng đầu',
      color: 'text-green-500',
    },
    {
      icon: Trophy,
      title: 'Nhận thanh toán',
      description: 'Nhận 85% lợi nhuận nếu dự đoán đúng',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="absolute top-2 right-2 text-5xl font-bold text-muted/10">
                {index + 1}
              </div>
              <div className={`mb-4 ${step.color}`}>
                <Icon className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
