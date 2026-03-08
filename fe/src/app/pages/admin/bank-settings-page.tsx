import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useAdminWalletStore } from '@/stores/admin-wallet-store';
import { Trash2, Plus } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { VIETNAM_BANKS } from '@/lib/banks';

export const BankSettingsPage: React.FC = () => {
    const { banks, fetchBanks, createBank, deleteBank } = useAdminWalletStore();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
    });

    React.useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createBank(formData);
        setIsDialogOpen(false);
        setFormData({ bankName: '', bankCode: '', accountNumber: '', accountName: '' });
    };

    const handleBankSelect = (code: string) => {
        const bank = VIETNAM_BANKS.find((b) => b.code === code);
        if (bank) {
            setFormData((prev) => ({
                ...prev,
                bankCode: bank.code,
                bankName: bank.shortName,
            }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Cài đặt Ngân hàng</span>
                    </h1>
                    <p className="text-muted-foreground">Quản lý các tài khoản ngân hàng nhận tiền.</p>
                </div>
                <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Dialog.Trigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Thêm tài khoản
                        </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-card p-6 rounded-lg w-full max-w-md z-50 border border-border">
                            <Dialog.Title className="text-xl font-bold mb-4">Thêm tài khoản ngân hàng</Dialog.Title>
                            <Dialog.Description className="mb-4 text-sm text-muted-foreground">
                                Nhập thông tin tài khoản ngân hàng để nhận tiền nạp từ người dùng.
                            </Dialog.Description>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Chọn Ngân hàng</label>
                                    <Select onValueChange={handleBankSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn ngân hàng" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {VIETNAM_BANKS.map((bank) => (
                                                <SelectItem key={bank.code} value={bank.code}>
                                                    {bank.code} - {bank.shortName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Tên Ngân hàng</label>
                                        <Input
                                            value={formData.bankName}
                                            readOnly
                                            className="bg-muted"
                                            placeholder="Tự động điền"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Mã (Short)</label>
                                        <Input
                                            value={formData.bankCode}
                                            readOnly
                                            className="bg-muted"
                                            placeholder="AVC"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Số tài khoản</label>
                                    <Input
                                        value={formData.accountNumber}
                                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                        placeholder="1234567890"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Tên chủ tài khoản</label>
                                    <Input
                                        value={formData.accountName}
                                        onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                        placeholder="NGUYEN VAN A"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                                    <Button type="submit">Lưu</Button>
                                </div>
                            </form>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            </div>

            <div className="grid gap-6">
                {banks.map((bank) => (
                    <Card key={bank.id}>
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                    {bank.bankCode}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{bank.bankName} ({bank.bankCode})</h3>
                                    <p className="text-sm text-muted-foreground">{bank.accountNumber} - {bank.accountName}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => deleteBank(bank.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {banks.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">Chưa có tài khoản ngân hàng nào</div>
                )}
            </div>
        </div>
    );
};
