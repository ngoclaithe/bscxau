import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WithdrawDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const WithdrawDialog: React.FC<WithdrawDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = React.useState('');
    const [bankName, setBankName] = React.useState('');
    const [accountNumber, setAccountNumber] = React.useState('');
    const [accountName, setAccountName] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!amount || Number(amount) < 50000) {
            toast.error('Số tiền rút tối thiểu 50,000');
            return;
        }
        if (!bankName || !accountNumber || !accountName) {
            toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
            return;
        }

        setLoading(true);
        try {
            await api.post('/wallet/withdraw', {
                amount: Number(amount),
                bankName,
                bankCode: bankName, // Use bankName as bankCode
                accountNumber,
                accountName
            });

            toast.success('Lệnh rút tiền đã được tạo');
            onClose();
            if (onSuccess) onSuccess();
        } catch (e: any) {
            console.error('Withdraw error', e);
            toast.error(e.message || 'Tạo lệnh rút thất bại. Kiểm tra số dư.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                    <DialogTitle>Rút tiền về tài khoản</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin ngân hàng và số tiền cần rút.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số tiền muốn rút</label>
                        <Input
                            type="number"
                            placeholder="Nhập số tiền (Min 50,000)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Số dư phải khả dụng. Phí rút 0đ.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên Ngân hàng</label>
                        <Input
                            placeholder="VD: Vietcombank"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số tài khoản</label>
                        <Input
                            placeholder="Số tài khoản ngân hàng"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên chủ tài khoản</label>
                        <Input
                            placeholder="Viết hoa không dấu"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Gửi yêu cầu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
