import { create } from 'zustand';
import { api } from '@/lib/api';

export interface LeaderboardTrader {
    rank: number;
    id: string;
    walletAddress: string | null;
    nickname: string;
    avatarUrl?: string;
    winRate: number;
    roi: number;
    pnl: number;
    totalTrades: number;
}

interface LeaderboardState {
    leaderboard: LeaderboardTrader[];
    isLoading: boolean;
    timeframe: 'day' | 'week' | 'month';
    fetchLeaderboard: () => Promise<void>;
    setTimeframe: (timeframe: 'day' | 'week' | 'month') => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
    leaderboard: [],
    isLoading: false,
    timeframe: 'week',

    fetchLeaderboard: async () => {
        set({ isLoading: true });
        try {
            const { timeframe } = get();
            const data = await api.get<LeaderboardTrader[]>(`/leaderboard?timeframe=${timeframe}`);
            set({ leaderboard: data });
        } catch (e) {
            console.error('Failed to fetch leaderboard', e);
            set({ leaderboard: [] });
        } finally {
            set({ isLoading: false });
        }
    },

    setTimeframe: (timeframe) => {
        set({ timeframe });
        get().fetchLeaderboard();
    },
}));
