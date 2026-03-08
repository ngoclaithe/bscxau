import { create } from 'zustand';
import { api } from '@/lib/api';
import { ChatMessage, ChatRequest } from '@/lib/chat-socket';

export interface Conversation {
    user: {
        id: string;
        nickname?: string;
        email?: string;
        avatarUrl?: string;
    };
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export interface ChatState {
    // User state
    userMessages: ChatMessage[];
    userUnreadCount: number;
    userRequestStatus: 'idle' | 'WAITING' | 'ACTIVE' | 'CLOSED';
    userRequestId: string | null;

    // Admin state
    conversations: Conversation[];
    adminMessages: ChatMessage[];
    adminUnreadUsers: number;
    chatRequests: ChatRequest[];

    isLoading: boolean;

    // User actions
    fetchUserMessages: () => Promise<void>;
    fetchUserUnreadCount: () => Promise<void>;
    deleteUserMessages: () => Promise<void>;
    setUserMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
    setUserUnreadCount: (count: number) => void;
    requestSupport: () => Promise<void>;
    fetchMyRequest: () => Promise<void>;
    setUserRequestStatus: (status: 'idle' | 'WAITING' | 'ACTIVE' | 'CLOSED') => void;
    setUserRequestId: (id: string | null) => void;

    // Admin actions
    fetchConversations: () => Promise<void>;
    fetchAdminMessages: (userId: string) => Promise<void>;
    fetchAdminUnreadUsers: () => Promise<void>;
    deleteConversation: (userId: string) => Promise<void>;
    setConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
    setAdminMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
    setAdminUnreadUsers: (count: number) => void;
    setChatRequests: (requests: ChatRequest[]) => void;
    fetchChatRequests: () => Promise<void>;

    clearState: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    userMessages: [],
    userUnreadCount: 0,
    userRequestStatus: 'idle',
    userRequestId: null,

    conversations: [],
    adminMessages: [],
    adminUnreadUsers: 0,
    chatRequests: [],

    isLoading: false,

    // User actions
    fetchUserMessages: async () => {
        set({ isLoading: true });
        try {
            const data = await api.get<ChatMessage[]>('/chat/my-messages');
            set({ userMessages: data });
        } catch (e) {
            console.error('Failed to fetch user messages', e);
        } finally {
            set({ isLoading: false });
        }
    },
    fetchUserUnreadCount: async () => {
        try {
            const data = await api.get<{ count: number }>('/chat/unread');
            set({ userUnreadCount: data.count });
        } catch (e) {
            console.error('Failed to fetch user unread count', e);
        }
    },
    deleteUserMessages: async () => {
        set({ isLoading: true });
        try {
            await api.delete('/chat/my-messages');
            set({ userMessages: [] });
        } catch (e) {
            console.error('Failed to delete user messages', e);
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },
    setUserMessages: (updater) => {
        set((state) => ({ userMessages: updater(state.userMessages) }));
    },
    setUserUnreadCount: (count) => {
        set({ userUnreadCount: count });
    },

    requestSupport: async () => {
        set({ isLoading: true });
        try {
            const data = await api.post<ChatRequest>('/chat/request-support', {});
            set({
                userRequestStatus: data.status as 'WAITING' | 'ACTIVE',
                userRequestId: data.id,
            });
        } catch (e) {
            console.error('Failed to request support', e);
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchMyRequest: async () => {
        try {
            const data = await api.get<ChatRequest & { status: string | null }>('/chat/my-request');
            if (data.status && data.status !== 'CLOSED') {
                set({
                    userRequestStatus: data.status as 'WAITING' | 'ACTIVE',
                    userRequestId: data.id,
                });
            } else {
                set({ userRequestStatus: 'idle', userRequestId: null });
            }
        } catch (e) {
            console.error('Failed to fetch my request', e);
        }
    },

    setUserRequestStatus: (status) => {
        set({ userRequestStatus: status });
    },
    setUserRequestId: (id) => {
        set({ userRequestId: id });
    },

    // Admin actions
    fetchConversations: async () => {
        set({ isLoading: true });
        try {
            const data = await api.get<Conversation[]>('/chat/conversations');
            set({ conversations: data });
        } catch (e) {
            console.error('Failed to fetch conversations', e);
        } finally {
            set({ isLoading: false });
        }
    },
    fetchAdminMessages: async (userId: string) => {
        set({ isLoading: true });
        try {
            const data = await api.get<ChatMessage[]>(`/chat/messages/${userId}`);
            set({ adminMessages: data });
        } catch (e) {
            console.error('Failed to fetch admin messages', e);
        } finally {
            set({ isLoading: false });
        }
    },
    fetchAdminUnreadUsers: async () => {
        try {
            const data = await api.get<{ unreadUsers: number }>('/chat/unread-users');
            set({ adminUnreadUsers: data.unreadUsers });
        } catch (e) {
            console.error('Failed to fetch admin unread count', e);
        }
    },
    deleteConversation: async (userId: string) => {
        set({ isLoading: true });
        try {
            await api.delete(`/chat/conversations/${userId}`);
            set((state) => ({
                conversations: state.conversations.filter(c => c.user.id !== userId),
                adminMessages: []
            }));
        } catch (e) {
            console.error('Failed to delete conversation', e);
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },
    setConversations: (updater) => {
        set((state) => ({ conversations: updater(state.conversations) }));
    },
    setAdminMessages: (updater) => {
        set((state) => ({ adminMessages: updater(state.adminMessages) }));
    },
    setAdminUnreadUsers: (count) => {
        set({ adminUnreadUsers: count });
    },
    setChatRequests: (requests) => {
        set({ chatRequests: requests });
    },
    fetchChatRequests: async () => {
        try {
            const data = await api.get<ChatRequest[]>('/chat/requests');
            set({ chatRequests: data });
        } catch (e) {
            console.error('Failed to fetch chat requests', e);
        }
    },

    clearState: () => {
        set({
            userMessages: [],
            userUnreadCount: 0,
            userRequestStatus: 'idle',
            userRequestId: null,
            conversations: [],
            adminMessages: [],
            adminUnreadUsers: 0,
            chatRequests: [],
            isLoading: false
        });
    }
}));
