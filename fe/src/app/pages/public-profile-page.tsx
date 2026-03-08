import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Award, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPercent, getAvatarUrl, formatDate } from '@/lib/utils';

interface PublicProfile {
    id: string;
    nickname: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: string;
    stats: {
        totalTrades: number;
        winRate: number;
    };
}

export const PublicProfilePage: React.FC<{ nickname: string | null }> = ({ nickname }) => {
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!nickname) {
                setError('Không tìm thấy tên người dùng.');
                setLoading(false);
                return;
            }

            try {
                // Fetch by nickname
                const data = await api.get<PublicProfile>(`/users/n/${encodeURIComponent(nickname)}`);
                setProfile(data);
            } catch (err) {
                setError('Không tìm thấy người dùng hoặc hồ sơ ở chế độ riêng tư.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [nickname]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Card className="max-w-md mx-auto p-8 border-dashed">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-bold mb-2">{error}</h2>
                    <p className="text-muted-foreground">Có thể liên kết này đã hết hạn hoặc người dùng đã đổi tên.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            {/* Header Profile */}
            <Card className="mb-8 border-none bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-32 bg-primary/10 blur-3xl -mt-16 pointer-events-none" />
                <CardContent className="pt-12 pb-10 text-center relative z-10">
                    <div className="flex flex-col items-center">
                        <Avatar className="h-32 w-32 border-4 border-white/10 shadow-2xl mb-6">
                            <AvatarImage src={getAvatarUrl(profile.avatarUrl)} alt={profile.nickname} className="object-cover" />
                            <AvatarFallback className="text-3xl bg-slate-800 text-white">
                                {profile.nickname?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-white">{profile.nickname}</h1>
                            <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline" className="px-3 py-1">Trader</Badge>
                                <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/5">
                                    Verified
                                </Badge>
                                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5">
                                    Tham gia: {formatDate(profile.createdAt)}
                                </Badge>
                            </div>
                        </div>

                        {profile.bio && (
                            <p className="mt-6 text-slate-300 max-w-lg mx-auto leading-relaxed italic">
                                "{profile.bio}"
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Trading Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Hiệu suất thắng</CardTitle>
                        <Award className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-500">
                            {formatPercent(profile.stats.winRate)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Dựa trên {profile.stats.totalTrades} giao dịch</p>
                        <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-1000"
                                style={{ width: `${profile.stats.winRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Hoạt động</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{profile.stats.totalTrades}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tổng số lệnh đã thực hiện</p>
                        <div className="mt-4 flex gap-2">
                            <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20">Active Trader</Badge>
                            <Badge variant="outline" className="text-[10px] bg-slate-800 border-white/10">Public Records</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
