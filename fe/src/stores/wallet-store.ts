import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from './auth-store';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  txHash?: string;
  createdAt: string;
  status?: string;
  codePay?: string;
}

interface Wallet {
  id: string;
  balance: number;
  lockedBalance: number;
  transactions: Transaction[];
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  lockedBalance: number;
  network: string;
  transactions: Transaction[];
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchWallet: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  balance: 0,
  lockedBalance: 0,
  network: 'BSC Mainnet',
  transactions: [],
  isLoading: false,

  connectWallet: async () => {
    set({ isLoading: true });
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // TODO: Wallet-based auth is disabled. Using email auth instead.
      // If wallet login is needed, add loginWithWallet method to auth-store
      // const message = 'Login to BO Copytrade';
      // const signature = (await window.ethereum.request({
      //   method: 'personal_sign',
      //   params: [message, address],
      // })) as string;
      // await useAuthStore.getState().loginWithWallet(address, signature);

      console.log('Wallet connected:', address);

      set({
        isConnected: true,
        address,
      });

      await get().fetchWallet();
    } catch (e) {
      console.error('Failed to connect wallet', e);
    } finally {
      set({ isLoading: false });
    }
  },

  disconnectWallet: () => {
    useAuthStore.getState().logout();
    set({
      isConnected: false,
      address: null,
      balance: 0,
      lockedBalance: 0,
      transactions: [],
    });
  },

  fetchWallet: async () => {
    try {
      // API call now uses cookies, no token param needed
      const wallet = await api.get<Wallet>('/wallet');
      set({
        balance: Number(wallet.balance),
        lockedBalance: Number(wallet.lockedBalance),
        // transactions: wallet.transactions, // Nếu endpoint /wallet trả về txs thì update
      });
    } catch (e) {
      console.error('Failed to fetch wallet', e);
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const [deposits, withdraws] = await Promise.all([
        api.get<any[]>('/wallet/deposits'),
        api.get<any[]>('/wallet/withdraws').catch(() => []) // Handle error or empty
      ]);

      const mappedDeposits: Transaction[] = deposits.map(item => ({
        id: item.id,
        type: 'DEPOSIT',
        amount: Number(item.amount),
        status: item.status,
        createdAt: item.createdAt,
        codePay: item.codePay,
      }));

      const mappedWithdraws: Transaction[] = withdraws.map(item => ({
        id: item.id,
        type: 'WITHDRAW',
        amount: Number(item.amount),
        status: item.status,
        createdAt: item.createdAt,
      }));

      const all = [...mappedDeposits, ...mappedWithdraws].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      set({ transactions: all });
    } catch (e) {
      console.error('Failed to fetch history', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));

