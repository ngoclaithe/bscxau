import React from 'react';
import { FileQuestion, Wallet, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  type: 'no-wallet' | 'no-data' | 'no-trades';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, title, description, action }) => {
  const getIcon = () => {
    switch (type) {
      case 'no-wallet':
        return <Wallet className="h-12 w-12 text-muted-foreground" />;
      case 'no-trades':
        return <TrendingUp className="h-12 w-12 text-muted-foreground" />;
      default:
        return <FileQuestion className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'no-wallet':
        return {
          title: 'Chưa kết nối ví',
          description: 'Vui lòng kết nối ví để bắt đầu giao dịch',
        };
      case 'no-trades':
        return {
          title: 'Chưa có giao dịch nào',
          description: 'Bắt đầu đặt lệnh đầu tiên của bạn',
        };
      default:
        return {
          title: 'Không có dữ liệu',
          description: 'Chưa có thông tin để hiển thị',
        };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    description: description || getDefaultContent().description,
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">{getIcon()}</div>
      <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{content.description}</p>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  );
};
