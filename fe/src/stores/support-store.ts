import { create } from 'zustand';
import { api } from '@/lib/api';
import { SupportMessage } from '@/lib/support-socket';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus = 'pending' | 'active' | 'rejected' | 'closed' | null;

export interface SupportSession {
    id: string;
    userId: string;
    adminId?: string;
    status: SessionStatus;
    createdAt: string;
    approvedAt?: string;
    closedAt?: string;
    user?: {
        id: string;
        nickname?: string;
        email?: string;
        avatarUrl?: string;
    };
    _count?: { messages: number };
    messages?: SupportMessage[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface SupportState {
    // User state
    sessionId: string | null;
    sessionStatus: SessionStatus;
    messages: SupportMessage[];
    isLoading: boolean;

    // Admin state
    allSessions: SupportSession[];
    pendingSessions: SupportSession[];
    selectedSessionId: string | null;
    adminMessages: SupportMessage[];
    adminLoading: boolean;
    unreadCounts: Record<string, number>;

    // Actions – User
    fetchMySession: () => Promise<void>;
    requestSupport: () => Promise<string | null>; // returns session_id
    fetchMessages: (sessionId: string) => Promise<void>;
    addMessage: (msg: SupportMessage) => void;
    setMessages: (msgs: SupportMessage[]) => void;
    setSessionStatus: (status: SessionStatus) => void;
    setSessionId: (id: string | null) => void;

    // Actions – Admin
    fetchAllSessions: () => Promise<void>;
    fetchPendingSessions: () => Promise<void>;
    selectSession: (sessionId: string) => void;
    fetchAdminMessages: (sessionId: string) => Promise<void>;
    addAdminMessage: (msg: SupportMessage) => void;
    approveSession: (sessionId: string) => Promise<void>;
    rejectSession: (sessionId: string) => Promise<void>;
    closeSession: (sessionId: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
    incrementUnread: (sessionId: string) => void;
    clearUnread: (sessionId: string) => void;
    addPendingSession: (session: SupportSession) => void;
    updateSessionLastMessage: (sessionId: string, msg: SupportMessage) => void;
    uploadImage: (file: File) => Promise<string | null>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSupportStore = create<SupportState>((set, get) => ({
    // Initial user state
    sessionId: null,
    sessionStatus: null,
    messages: [],
    isLoading: false,

    // Initial admin state
    allSessions: [],
    pendingSessions: [],
    selectedSessionId: null,
    adminMessages: [],
    adminLoading: false,
    unreadCounts: {},

    // ── User actions ─────────────────────────────────────────────────────────

    fetchMySession: async () => {
        try {
            const res = await api.get<{ session_id: string | null; status: SessionStatus }>('/support/my-session');
            set({ sessionId: res.session_id, sessionStatus: res.status });
        } catch (e) {
            console.error('[SupportStore] fetchMySession error', e);
        }
    },

    requestSupport: async () => {
        set({ isLoading: true });
        try {
            const res = await api.post<{ session_id: string; status: SessionStatus }>('/support/request', {});
            set({ sessionId: res.session_id, sessionStatus: res.status });
            return res.session_id;
        } catch (e) {
            console.error('[SupportStore] requestSupport error', e);
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchMessages: async (sessionId: string) => {
        try {
            const msgs = await api.get<SupportMessage[]>(`/support/session/${sessionId}/messages`);
            set({ messages: msgs });
        } catch (e) {
            console.error('[SupportStore] fetchMessages error', e);
        }
    },

    addMessage: (msg) => {
        set((s) => {
            if (s.messages.some((m) => m.id === msg.id)) return s;
            return { messages: [...s.messages, msg] };
        });
    },

    setMessages: (msgs) => set({ messages: msgs }),

    setSessionStatus: (status) => set({ sessionStatus: status }),

    setSessionId: (id) => set({ sessionId: id }),

    // ── Admin actions ─────────────────────────────────────────────────────────

    fetchAllSessions: async () => {
        set({ adminLoading: true });
        try {
            const sessions = await api.get<SupportSession[]>('/support/admin/sessions');
            set({ allSessions: sessions });
        } catch (e) {
            console.error('[SupportStore] fetchAllSessions error', e);
        } finally {
            set({ adminLoading: false });
        }
    },

    fetchPendingSessions: async () => {
        try {
            const sessions = await api.get<SupportSession[]>('/support/admin/sessions/pending');
            set({ pendingSessions: sessions });
        } catch (e) {
            console.error('[SupportStore] fetchPendingSessions error', e);
        }
    },

    selectSession: (sessionId) => {
        set((state) => ({
            selectedSessionId: sessionId,
            adminMessages: [],
            unreadCounts: { ...state.unreadCounts, [sessionId]: 0 }
        }));
    },

    fetchAdminMessages: async (sessionId) => {
        try {
            const msgs = await api.get<SupportMessage[]>(`/support/admin/session/${sessionId}/messages`);
            set({ adminMessages: msgs });
        } catch (e) {
            console.error('[SupportStore] fetchAdminMessages error', e);
        }
    },

    addAdminMessage: (msg) => {
        set((s) => {
            if (s.adminMessages.some((m) => m.id === msg.id)) return s;
            return { adminMessages: [...s.adminMessages, msg] };
        });
    },

    approveSession: async (sessionId) => {
        await api.post(`/support/admin/sessions/${sessionId}/approve`, {});
        await get().fetchAllSessions();
        await get().fetchPendingSessions();
    },

    rejectSession: async (sessionId) => {
        await api.post(`/support/admin/sessions/${sessionId}/reject`, {});
        await get().fetchAllSessions();
        await get().fetchPendingSessions();
    },

    closeSession: async (sessionId) => {
        await api.post(`/support/admin/sessions/${sessionId}/close`, {});
    },

    deleteSession: async (sessionId) => {
        await api.delete(`/support/admin/sessions/${sessionId}`);
        set((s) => ({
            allSessions: s.allSessions.filter(x => x.id !== sessionId),
            pendingSessions: s.pendingSessions.filter(x => x.id !== sessionId),
            selectedSessionId: s.selectedSessionId === sessionId ? null : s.selectedSessionId,
            adminMessages: s.selectedSessionId === sessionId ? [] : s.adminMessages
        }));
    },

    incrementUnread: (sessionId) => {
        set((state) => ({
            unreadCounts: {
                ...state.unreadCounts,
                [sessionId]: (state.unreadCounts[sessionId] || 0) + 1
            }
        }));
    },

    clearUnread: (sessionId) => {
        set((state) => ({
            unreadCounts: { ...state.unreadCounts, [sessionId]: 0 }
        }));
    },

    addPendingSession: (session) => {
        set((state) => {
            if (state.pendingSessions.some((s) => s.id === session.id)) return state;
            return {
                pendingSessions: [session, ...state.pendingSessions],
                allSessions: [session, ...state.allSessions],
            };
        });
    },

    updateSessionLastMessage: (sessionId, msg) => {
        set((state) => {
            const updatedSessions = state.allSessions.map(s => {
                if (s.id === sessionId) {
                    return { ...s, messages: [msg] };
                }
                return s;
            });
            // Bring updated session to top
            const session = updatedSessions.find(s => s.id === sessionId);
            const others = updatedSessions.filter(s => s.id !== sessionId);
            const finalSessions = session ? [session, ...others] : updatedSessions;

            return { allSessions: finalSessions };
        });
    },

    uploadImage: async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${api.baseUrl}/support/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            return data.imageUrl;
        } catch (e: any) {
            console.error('[SupportStore] uploadImage error', e);
            throw e;
        }
    }
}));
