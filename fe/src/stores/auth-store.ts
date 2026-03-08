import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
    id: string;
    email: string;
    nickname?: string;
    role: string;
    balance?: number;
    avatarUrl?: string;
    bio?: string;
    isPublic?: boolean;
    liveStats?: {
        totalTrades: number;
        winRate: number;
    };
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, nickname: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    changePassword: (oldPass: string, newPass: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            // console.log('AuthStore initialized with API URL:', api.baseUrl);
            return {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isHydrated: false,

                loginWithEmail: async (email: string, password: string) => {
                    set({ isLoading: true });
                    try {
                        const res = await api.post<{ user: User }>('/auth/login', {
                            email,
                            password,
                        });
                        set({
                            user: res.user,
                            isAuthenticated: true
                        });
                    } finally {
                        set({ isLoading: false });
                    }
                },

                register: async (email: string, password: string, nickname: string) => {
                    set({ isLoading: true });
                    try {
                        const res = await api.post<{ user: User }>('/auth/register', {
                            email,
                            password,
                            nickname,
                        });
                        set({
                            user: res.user,
                            isAuthenticated: true
                        });
                    } finally {
                        set({ isLoading: false });
                    }
                },

                logout: async () => {
                    try {
                        await api.post('/auth/logout', {});
                    } catch (e) {
                        console.error('Logout failed', e);
                    }
                    set({ user: null, isAuthenticated: false });
                },

                fetchUser: async () => {
                    set({ isLoading: true });
                    try {
                        const user = await api.get<User>('/users/me');
                        set({ user, isAuthenticated: true });
                    } catch {
                        set({ user: null, isAuthenticated: false });
                    } finally {
                        set({ isLoading: false });
                    }
                },

                updateProfile: async (data: Partial<User>) => {
                    set({ isLoading: true });
                    try {
                        const res = await api.patch<User>('/users/me', data);
                        set({ user: res });
                        toast.success('Hồ sơ đã được cập nhật');
                    } catch (e) {
                        console.error('Update profile failed', e);
                        toast.error('Cập nhật thất bại');
                    } finally {
                        set({ isLoading: false });
                    }
                },

                uploadAvatar: async (file: File) => {
                    set({ isLoading: true });
                    try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const res = await fetch(`${api.baseUrl}/users/avatar`, {
                            method: 'POST',
                            body: formData,
                            credentials: 'include',
                        });

                        if (!res.ok) throw new Error('Upload failed');
                        const data = await res.json();

                        const currentUser = get().user;
                        if (currentUser) {
                            set({ user: { ...currentUser, avatarUrl: data.avatarUrl } });
                        }
                        toast.success('Upload ảnh thành công');
                    } catch (e) {
                        console.error('Upload avatar failed', e);
                        toast.error('Upload ảnh thất bại');
                    } finally {
                        set({ isLoading: false });
                    }
                },

                changePassword: async (oldPass: string, newPass: string) => {
                    set({ isLoading: true });
                    try {
                        await api.post('/users/change-password', { oldPass, newPass });
                        toast.success('Đổi mật khẩu thành công');
                    } catch (e: any) {
                        const msg = e.response?.data?.message || 'Đổi mật khẩu thất bại';
                        toast.error(msg);
                        throw e;
                    } finally {
                        set({ isLoading: false });
                    }
                },

                forgotPassword: async (email: string) => {
                    set({ isLoading: true });
                    try {
                        await api.post('/auth/forgot-password', { email });
                        toast.success('Email đặt lại mật khẩu đã được gửi');
                    } catch (e: any) {
                        const msg = e.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
                        toast.error(msg);
                        throw e;
                    } finally {
                        set({ isLoading: false });
                    }
                },

                resetPassword: async (token: string, password: string) => {
                    set({ isLoading: true });
                    try {
                        await api.post('/auth/reset-password', { token, password });
                        toast.success('Đặt lại mật khẩu thành công');
                    } catch (e: any) {
                        const msg = e.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn';
                        toast.error(msg);
                        throw e;
                    } finally {
                        set({ isLoading: false });
                    }
                },

                setHydrated: (hydrated: boolean) => {
                    set({ isHydrated: hydrated });
                },
            };
        },
        {
            name: 'bscxau-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHydrated(true);
                    if (state.isAuthenticated) {
                        state.fetchUser();
                    }
                }
            },
        }
    )
);
