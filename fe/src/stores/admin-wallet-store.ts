import { create } from 'zustand';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface AdminBankAccount {
    id: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    isActive: boolean;
}

export interface DepositOrder {
    id: string;
    amount: number;
    codePay: string;
    status: string;
    createdAt: string;
    user: { email: string; nickname?: string; walletAddress?: string };
    bankAccount: AdminBankAccount;
}

export interface WithdrawOrder {
    id: string;
    amount: number;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    status: string;
    createdAt: string;
    user: { email: string; nickname?: string; walletAddress?: string };
}

interface AdminWalletState {
    banks: AdminBankAccount[];
    deposits: DepositOrder[];
    withdraws: WithdrawOrder[];
    isLoading: boolean;
    fetchBanks: () => Promise<void>;
    fetchDeposits: () => Promise<void>;
    fetchWithdraws: () => Promise<void>;
    createBank: (data: Omit<AdminBankAccount, 'id' | 'isActive'>) => Promise<void>;
    updateBank: (id: string, data: Partial<AdminBankAccount>) => Promise<void>;
    deleteBank: (id: string) => Promise<void>;
    approveDeposit: (id: string) => Promise<void>;
    rejectDeposit: (id: string) => Promise<void>;
    approveWithdraw: (id: string) => Promise<void>;
    rejectWithdraw: (id: string) => Promise<void>;
}

export const useAdminWalletStore = create<AdminWalletState>((set, get) => ({
    banks: [],
    deposits: [],
    withdraws: [],
    isLoading: false,

    fetchBanks: async () => {
        set({ isLoading: true });
        try {
            const banks = await api.get<AdminBankAccount[]>('/admin/banks');
            set({ banks });
        } catch (error) {
            console.error('Fetch banks failed:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchDeposits: async () => {
        set({ isLoading: true });
        try {
            const deposits = await api.get<DepositOrder[]>('/admin/deposits');
            set({ deposits });
        } catch (error) {
            console.error('Fetch deposits failed:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchWithdraws: async () => {
        set({ isLoading: true });
        try {
            const withdraws = await api.get<WithdrawOrder[]>('/admin/withdraws');
            set({ withdraws });
        } catch (error) {
            console.error('Fetch withdraws failed:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createBank: async (data) => {
        try {
            await api.post('/admin/banks', data);
            await get().fetchBanks();
        } catch (e) {
            console.error('Failed to create bank', e);
            throw e;
        }
    },

    updateBank: async (id, data) => {
        try {
            await api.put(`/admin/banks/${id}`, data);
            await get().fetchBanks();
        } catch (e) {
            console.error('Failed to update bank', e);
            throw e;
        }
    },

    deleteBank: async (id) => {
        try {
            await api.delete(`/admin/banks/${id}`);
            await get().fetchBanks();
        } catch (e) {
            console.error('Failed to delete bank', e);
            throw e;
        }
    },

    approveDeposit: async (id) => {
        set({ isLoading: true });
        try {
            await api.post(`/admin/deposits/${id}/approve`, {});
            await get().fetchDeposits();
            toast.success('Đã duyệt lệnh nạp');
        } catch (e) {
            console.error('Approve failed', e);
            toast.error('Duyệt thất bại');
        } finally {
            set({ isLoading: false });
        }
    },

    rejectDeposit: async (id) => {
        set({ isLoading: true });
        try {
            await api.post(`/admin/deposits/${id}/reject`, {});
            await get().fetchDeposits();
            toast.success('Đã từ chối lệnh nạp');
        } catch (e) {
            console.error('Reject failed', e);
            toast.error('Từ chối thất bại');
        } finally {
            set({ isLoading: false });
        }
    },

    approveWithdraw: async (id) => {
        set({ isLoading: true });
        try {
            await api.post(`/admin/withdraws/${id}/approve`, {});
            await get().fetchWithdraws();
            toast.success('Đã duyệt lệnh rút');
        } catch (e) {
            console.error('Approve failed', e);
            toast.error('Duyệt thất bại');
        } finally {
            set({ isLoading: false });
        }
    },

    rejectWithdraw: async (id) => {
        set({ isLoading: true });
        try {
            await api.post(`/admin/withdraws/${id}/reject`, {});
            await get().fetchWithdraws();
            toast.success('Đã từ chối lệnh rút');
        } catch (e) {
            console.error('Reject failed', e);
            toast.error('Từ chối thất bại');
        } finally {
            set({ isLoading: false });
        }
    },
}));
