import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

// ... (Rest of interfaces)
export interface AdminStats {
  totalUsers: number;
  totalTrades: number;
  exposure: number;
  recentTrades: unknown[];
  exposureByPair: { pair: string; amount: number }[];
  volumeHistory: { date: string; volume: number }[];
  winLoseRatio: { win: number; lose: number };
  poolBalance: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  metadata: any | null;
  createdAt: string;
  admin: {
    email: string;
  };
}

export interface PairConfig {
  id: string;
  symbol: string;
  payoutRate: number;
  isActive: boolean;
}

export interface Trader {
  id: string;
  address: string;
  email: string | null;
  nickname: string | null;
  totalVolume: number;
  totalTrades: number;
  winRate: number;
  status: 'normal' | 'suspicious';
  balance: number;
  role: string;
  createdAt: string;
  isActive: boolean;
  lastIp: string;
  lastLoginAt: string | null;
  isOnline: boolean;
  wallet?: {
    balance: number;
    lockedBalance: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Trade {
  id: string;
  userId: string;
  pairId: string;
  direction: 'UP' | 'DOWN';
  amount: number;
  payoutRate: number;
  entryPrice: number | null;
  openTime: string;
  expireTime: string;
  status: 'PENDING' | 'LOCKED' | 'SETTLED';
  user: { nickname: string | null };
  pair: { symbol: string };
  result?: {
    result: 'WIN' | 'LOSE';
    profit: number;
    settlePrice: number;
  };
}

export interface AdminState {
  isAuthenticated: boolean;
  userRole: 'admin' | 'operator' | 'viewer' | null;
  stats: AdminStats;
  pairConfigs: PairConfig[];
  traders: Trader[];
  traderMeta: PaginationMeta;
  trades: Trade[];
  logs: AdminLog[];
  configs: Record<string, any>;
  blockedIps: any[];
  isLoading: boolean;

  fetchDashboard: () => Promise<void>;
  fetchPairs: () => Promise<void>;
  fetchTraders: (page?: number, limit?: number) => Promise<void>;
  fetchTraderDetails: (id: string) => Promise<Trader>;
  fetchTrades: (status?: string) => Promise<void>;
  fetchLogs: () => Promise<void>;
  fetchConfigs: () => Promise<void>;
  fetchIps: () => Promise<void>;
  blockIp: (ipAddress: string, reason?: string) => Promise<void>;
  unblockIp: (ip: string) => Promise<void>;
  updateUserStatus: (id: string, data: { isActive: boolean; status: string }) => Promise<void>;
  saveConfig: (key: string, value: any) => Promise<void>;
  createPair: (symbol: string, payoutRate: number) => Promise<void>;
  updatePair: (id: string, data: { payoutRate?: number; isActive?: boolean }) => Promise<void>;
  adjustBalance: (userId: string, data: { amount: number; type: 'DEPOSIT' | 'WITHDRAW'; note?: string }) => Promise<void>;
  pauseTrading: () => Promise<void>;
  resumeTrading: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userRole: null,
      isLoading: false,

      stats: {
        totalUsers: 0,
        totalTrades: 0,
        exposure: 0,
        recentTrades: [],
        exposureByPair: [],
        volumeHistory: [],
        winLoseRatio: { win: 0, lose: 0 },
        poolBalance: 0,
      },

      pairConfigs: [],
      traders: [],
      traderMeta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      trades: [],
      logs: [],
      configs: {},
      blockedIps: [],

      fetchDashboard: async () => {
        try {
          const data = await api.get<AdminStats>('/admin/dashboard');
          set({
            stats: data,
          });
        } catch (e) {
          console.error('Failed to fetch dashboard', e);
        }
      },

      fetchTraders: async (page = 1, limit = 20) => {
        set({ isLoading: true });
        try {
          const res = await api.get<{ data: Trader[]; meta: PaginationMeta }>('/admin/traders', {
            page: page.toString(),
            limit: limit.toString()
          });
          set({ traders: res.data, traderMeta: res.meta });
        } catch (e) {
          console.error('Failed to fetch traders', e);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchTraderDetails: async (id: string) => {
        try {
          return await api.get<Trader>(`/admin/traders/${id}`);
        } catch (e) {
          console.error('Failed to fetch trader details', e);
          throw e;
        }
      },

      fetchTrades: async (status) => {
        set({ isLoading: true });
        try {
          const trades = await api.get<Trade[]>('/admin/trades',
            status && status !== 'all' ? { status: status.toUpperCase() } : undefined
          );
          set({ trades });
        } catch (e) {
          console.error('Failed to fetch trades', e);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchLogs: async () => {
        try {
          const logs = await api.get<AdminLog[]>('/admin/logs');
          set({ logs });
        } catch (e) {
          console.error('Failed to fetch logs', e);
        }
      },

      fetchConfigs: async () => {
        try {
          const configs = await api.get<Record<string, any>>('/admin/configs');
          set({ configs });
        } catch (e) {
          console.error('Failed to fetch configs', e);
        }
      },

      saveConfig: async (key, value) => {
        set({ isLoading: true });
        try {
          await api.post('/admin/configs', { key, value });
          await get().fetchConfigs();
        } finally {
          set({ isLoading: false });
        }
      },

      fetchIps: async () => {
        try {
          const blockedIps = await api.get<any[]>('/admin/ips');
          set({ blockedIps });
        } catch (e) {
          console.error('Failed to fetch IPs', e);
        }
      },

      blockIp: async (ipAddress, reason) => {
        try {
          await api.post('/admin/ips', { ipAddress, reason });
          await get().fetchIps();
        } catch (e) {
          console.error('Failed to block IP', e);
          throw e;
        }
      },

      unblockIp: async (ip) => {
        try {
          await api.delete(`/admin/ips/${encodeURIComponent(ip)}`);
          await get().fetchIps();
        } catch (e) {
          console.error('Failed to unblock IP', e);
          throw e;
        }
      },

      updateUserStatus: async (id, data) => {
        try {
          await api.patch(`/admin/users/${id}/status`, data);
          await get().fetchTraders();
        } catch (e) {
          console.error('Failed to update user status', e);
          throw e;
        }
      },

      adjustBalance: async (userId, data) => {
        try {
          await api.post(`/admin/traders/${userId}/balance`, data);
          await get().fetchTraders();
        } catch (e) {
          console.error('Failed to adjust balance', e);
          throw e;
        }
      },

      fetchPairs: async () => {
        try {
          const pairs = await api.get<PairConfig[]>('/admin/pairs');
          set({ pairConfigs: pairs });
        } catch (e) {
          console.error('Failed to fetch pairs', e);
        }
      },

      createPair: async (symbol, payoutRate) => {
        set({ isLoading: true });
        try {
          await api.post('/admin/pairs', { symbol, payoutRate });
          await get().fetchPairs();
        } finally {
          set({ isLoading: false });
        }
      },

      updatePair: async (id, data) => {
        set({ isLoading: true });
        try {
          await api.patch(`/admin/pairs/${id}`, data);
          await get().fetchPairs();
        } finally {
          set({ isLoading: false });
        }
      },

      pauseTrading: async () => {
        await api.post('/admin/system/pause', {});
        await get().fetchPairs();
      },

      resumeTrading: async () => {
        await api.post('/admin/system/resume', {});
        await get().fetchPairs();
      },

      login: async (email, password) => {
        try {
          const response = await api.post<{
            admin: { id: string; email: string; role: string };
          }>('/admin-auth/login', { email, password });

          set({
            isAuthenticated: true,
            userRole: response.admin.role as 'admin' | 'operator' | 'viewer',
          });
          return true;
        } catch (error) {
          console.error('Admin login failed:', error);
          return false;
        }
      },
      logout: async () => {
        try {
          await api.post('/admin-auth/logout', {});
        } catch (e) {
          console.error('Logout error', e);
        }
        set({ isAuthenticated: false, userRole: null });
      },
    }),
    {
      name: 'bscxau-admin-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
    }
  )
);

// Add method to verify session on app load
export async function verifyAdminSession() {
  const store = useAdminStore.getState();
  
  if (!store.isAuthenticated) {
    return false;
  }

  try {
    // Try to fetch admin info - if this succeeds, session is valid
    const adminInfo = await api.get<{
      id: string;
      email: string;
      role: string;
    }>('/admin-auth/me');
    
    // Session is valid, keep authenticated state
    console.log('[Admin Session] Session verified:', adminInfo.email);
    useAdminStore.setState({
      isAuthenticated: true,
      userRole: adminInfo.role as any
    });
    return true;
  } catch (error) {
    console.error('[Admin Session] Session verification failed:', error);
    // Session is invalid, clear auth state
    useAdminStore.setState({
      isAuthenticated: false,
      userRole: null
    });
    return false;
  }
}
