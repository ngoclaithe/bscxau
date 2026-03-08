import React from 'react';
import { Clock } from 'lucide-react';
import { Trade } from '@/stores/trading-store';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';

interface OrderListProps {
  orders: Trade[];
  title: string;
  type: 'open' | 'closed';
}

export const OrderList: React.FC<OrderListProps> = ({ orders, title, type }) => {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (type === 'open') {
      const interval = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [type]);

  const calculateTimeLeft = (expireTime?: string) => {
    if (!expireTime) return 0;
    const now = Date.now();
    const expire = new Date(expireTime);
    if (isNaN(expire.getTime())) return 0;
    return Math.max(0, expire.getTime() - now);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Chưa có lệnh nào</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const timeLeft = type === 'open' ? calculateTimeLeft(order.expireTime) : 0;

              return (
                <div
                  key={order.id}
                  className="border border-border rounded-xl p-4 space-y-2 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.pair?.symbol || 'Unknown'}</span>
                      <Badge variant={order.direction === 'UP' ? 'success' : 'danger'}>
                        {order.direction === 'UP' ? 'TĂNG' : 'GIẢM'}
                      </Badge>
                      {type === 'closed' && order.result && (
                        <Badge variant={order.result.result === 'WIN' ? 'success' : 'danger'}>
                          {order.result.result === 'WIN' ? 'THẮNG' : 'THUA'}
                        </Badge>
                      )}
                    </div>
                    {type === 'open' && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(Math.floor(timeLeft / 1000))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {formatDate(order.openTime || order.createdAt || '')}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Số tiền:</span>{' '}
                      <span className="font-medium">{formatCurrency(order.amount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Giá vào:</span>{' '}
                      <span className="font-medium">{formatCurrency(order.entryPrice)}</span>
                    </div>
                    {type === 'closed' && order.result && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Giá ra:</span>{' '}
                          <span className="font-medium">
                            ${formatCurrency(order.result.settlePrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lợi nhuận:</span>{' '}
                          <span
                            className={`font-medium ${order.result.result === 'WIN' ? 'text-success' : 'text-danger'
                              }`}
                          >
                            {order.result.result === 'WIN' ? '+' : '-'}
                            {formatCurrency(
                              order.result.result === 'WIN'
                                ? order.result.profit
                                : order.amount
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ID Removed */}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
