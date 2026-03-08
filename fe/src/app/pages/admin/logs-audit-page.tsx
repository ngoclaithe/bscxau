import React from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { useAdminStore } from '@/stores/admin-store';

export const LogsAuditPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const { logs, fetchLogs, isLoading } = useAdminStore();

    React.useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Logs & Audit</span>
                    </h1>
                    <p className="text-muted-foreground">Nhật ký hoạt động và audit trail.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={isLoading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>System Logs</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    className="pl-9 w-[200px] md:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Details (Metadata)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.action}</Badge>
                                    </TableCell>
                                    <TableCell>{log.admin.email}</TableCell>
                                    <TableCell className="text-sm font-mono text-xs max-w-[400px] truncate">
                                        {typeof log.metadata === 'object'
                                            ? JSON.stringify(log.metadata)
                                            : String(log.metadata || '-')}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredLogs.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Không tìm thấy nhật ký nào
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
