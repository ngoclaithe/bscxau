import React from 'react';
import { Shield, Lock, Unlock, Ban, Search, RefreshCw, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { useAdminStore } from '@/stores/admin-store';
import { toast } from 'sonner';

export const SecuritySettingsPage: React.FC = () => {
    const {
        blockedIps, fetchIps, blockIp, unblockIp,
        traders, fetchTraders, updateUserStatus,
        isLoading
    } = useAdminStore();

    const [newIp, setNewIp] = React.useState('');
    const [ipReason, setIpReason] = React.useState('');
    const [userSearch, setUserSearch] = React.useState('');

    React.useEffect(() => {
        fetchIps();
        fetchTraders();
    }, [fetchIps, fetchTraders]);

    const handleBlockIp = async () => {
        if (!newIp) return;
        try {
            await blockIp(newIp, ipReason);
            setNewIp('');
            setIpReason('');
            toast.success('Đã chặn IP thành công');
        } catch (e) {
            toast.error('Lỗi khi chặn IP');
        }
    };

    const handleUnblockIp = async (ip: string) => {
        try {
            await unblockIp(ip);
            toast.success('Đã gỡ chặn IP');
        } catch (e) {
            toast.error('Lỗi khi gỡ chặn IP');
        }
    };

    const handleToggleUser = async (user: any) => {
        const isCurrentlyActive = user.isActive !== false;
        try {
            await updateUserStatus(user.id, {
                isActive: !isCurrentlyActive,
                status: !isCurrentlyActive ? 'active' : 'blocked'
            });
            toast.success(`${!isCurrentlyActive ? 'Mở khóa' : 'Khóa'} người dùng thành công`);
        } catch (e) {
            toast.error('Lỗi khi cập nhật trạng thái người dùng');
        }
    };

    const filteredUsers = (traders || []).filter(u =>
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.address || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Bảo mật & Kiểm soát</span>
                    </h1>
                    <p className="text-muted-foreground">Quản lý chặn IP, giới hạn và khóa tài khoản người dùng.</p>
                </div>
                <Button variant="outline" onClick={() => { fetchIps(); fetchTraders(); }} disabled={isLoading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* IP Blocking Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-destructive" />
                            Quản lý Chặn IP
                        </CardTitle>
                        <CardDescription>Danh sách các IP bị cấm truy cập hệ thống</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="Địa chỉ IP (ví dụ: 1.2.3.4)"
                                    value={newIp}
                                    onChange={(e) => setNewIp(e.target.value)}
                                />
                                <Input
                                    placeholder="Lý do chặn"
                                    value={ipReason}
                                    onChange={(e) => setIpReason(e.target.value)}
                                />
                            </div>
                            <Button className="h-auto" onClick={handleBlockIp}>
                                <Plus className="h-4 w-4 mr-2" /> Chặn IP
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Lý do</TableHead>
                                        <TableHead className="w-[80px]">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {blockedIps.map((ip) => (
                                        <TableRow key={ip.ipAddress}>
                                            <TableCell className="font-mono text-sm">{ip.ipAddress}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{ip.reason || '-'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleUnblockIp(ip.ipAddress)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {blockedIps.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                Không có IP nào bị chặn
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Status Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-warning" />
                            Khóa / Mở khóa Tài khoản
                        </CardTitle>
                        <CardDescription>Quản lý quyền truy cập của từng người dùng</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo Email hoặc Wallet..."
                                className="pl-9"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nguời dùng</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.slice(0, 5).map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="text-sm font-medium">{user.nickname || 'Guest'}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {user.email || user.address}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive !== false ? 'success' : 'danger'}>
                                                    {user.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => handleToggleUser(user)}
                                                >
                                                    {user.isActive !== false ? (
                                                        <><Ban className="h-3 w-3" /> Khóa</>
                                                    ) : (
                                                        <><Unlock className="h-3 w-3" /> Mở khóa</>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            Chỉ hiển thị 5 kết quả gần nhất. Sử dụng tìm kiếm để lọc người dùng.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Rate Limiting Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-info" />
                        Cấu hình Rate Limiting
                    </CardTitle>
                    <CardDescription>Giới hạn tần suất yêu cầu để bảo vệ hệ thống khỏi DDoS và Brute Force</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Requests / Minute</label>
                            <Input type="number" defaultValue={60} />
                            <p className="text-xs text-muted-foreground">Số yêu cầu tối đa mỗi phút trên một IP.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Auth Failures Limit</label>
                            <Input type="number" defaultValue={5} />
                            <p className="text-xs text-muted-foreground">Số lần đăng nhập sai tối đa trước khi khóa IP.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ban Duration (Phút)</label>
                            <Input type="number" defaultValue={30} />
                            <p className="text-xs text-muted-foreground">Thời gian tự động chặn IP khi vượt quá giới hạn.</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button className="w-full md:w-auto">Cập nhật cấu hình Rate Limit</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
