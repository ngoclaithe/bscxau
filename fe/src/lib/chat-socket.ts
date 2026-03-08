import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (API_URL.startsWith('http') ? API_URL.replace(/\/api\/v1\/?$/, '') : window.location.origin);

export interface ChatMessage {
    id: string;
    userId: string;
    sender: 'USER' | 'ADMIN';
    content: string;
    isRead: boolean;
    createdAt: string;
    user?: {
        id: string;
        nickname?: string;
        email?: string;
        avatarUrl?: string;
    };
}

export interface ChatRequest {
    id: string;
    userId: string;
    status: 'WAITING' | 'ACTIVE' | 'CLOSED';
    createdAt: string;
    closedAt?: string;
    user?: {
        id: string;
        nickname?: string;
        email?: string;
        avatarUrl?: string;
    };
}

type ChatMessageListener = (msg: ChatMessage) => void;
type UnreadListener = (count: number) => void;
type AdminNewMsgListener = (msg: ChatMessage) => void;
type AdminStatsListener = (stats: { unreadUsers: number }) => void;
type ConnectionListener = (connected: boolean) => void;
type ChatRequestsListener = (requests: ChatRequest[]) => void;
type RequestStatusListener = (data: { requestId: string; status: string }) => void;
type AdminConnectedListener = (data: { requestId: string; status: string }) => void;
type SessionClosedListener = (data: { requestId: string; status: string }) => void;
type AdminChatAcceptedListener = (data: { requestId: string; userId: string; user: any }) => void;
type AdminChatClosedListener = (data: { requestId: string; userId: string }) => void;

class ChatSocketService {
    private socket: Socket | null = null;
    private messageListeners: ChatMessageListener[] = [];
    private unreadListeners: UnreadListener[] = [];
    private adminNewMsgListeners: AdminNewMsgListener[] = [];
    private adminStatsListeners: AdminStatsListener[] = [];
    private connectionListeners: ConnectionListener[] = [];
    private chatRequestsListeners: ChatRequestsListener[] = [];
    private requestStatusListeners: RequestStatusListener[] = [];
    private adminConnectedListeners: AdminConnectedListener[] = [];
    private sessionClosedListeners: SessionClosedListener[] = [];
    private adminChatAcceptedListeners: AdminChatAcceptedListener[] = [];
    private adminChatClosedListeners: AdminChatClosedListener[] = [];

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(`${SOCKET_URL}/chat`, {
            transports: ['websocket', 'polling'],
            withCredentials: true,   // Send httpOnly cookie with JWT token
        });

        this.socket.on('connect', () => {
            console.log('[ChatSocket] Connected:', this.socket?.id);
            this.connectionListeners.forEach((l) => l(true));
        });

        this.socket.on('disconnect', () => {
            console.log('[ChatSocket] Disconnected');
            this.connectionListeners.forEach((l) => l(false));
        });

        this.socket.on('connect_error', (err) => {
            console.warn('[ChatSocket] Connection error:', err.message);
            this.connectionListeners.forEach((l) => l(false));
        });

        this.socket.on('chat:message', (msg: ChatMessage) => {
            this.messageListeners.forEach((l) => l(msg));
        });

        this.socket.on('chat:unread', ({ count }: { count: number }) => {
            this.unreadListeners.forEach((l) => l(count));
        });

        this.socket.on('admin:new_message', (msg: ChatMessage) => {
            this.adminNewMsgListeners.forEach((l) => l(msg));
        });

        this.socket.on('admin:stats', (stats: { unreadUsers: number }) => {
            this.adminStatsListeners.forEach((l) => l(stats));
        });

        // New events for request-accept-close flow
        this.socket.on('admin:chat_requests', (requests: ChatRequest[]) => {
            this.chatRequestsListeners.forEach((l) => l(requests));
        });

        this.socket.on('chat:request_status', (data: { requestId: string; status: string }) => {
            this.requestStatusListeners.forEach((l) => l(data));
        });

        this.socket.on('chat:admin_connected', (data: { requestId: string; status: string }) => {
            this.adminConnectedListeners.forEach((l) => l(data));
        });

        this.socket.on('chat:session_closed', (data: { requestId: string; status: string }) => {
            this.sessionClosedListeners.forEach((l) => l(data));
        });

        this.socket.on('admin:chat_accepted', (data: { requestId: string; userId: string; user: any }) => {
            this.adminChatAcceptedListeners.forEach((l) => l(data));
        });

        this.socket.on('admin:chat_closed', (data: { requestId: string; userId: string }) => {
            this.adminChatClosedListeners.forEach((l) => l(data));
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.messageListeners = [];
        this.unreadListeners = [];
        this.adminNewMsgListeners = [];
        this.adminStatsListeners = [];
        this.connectionListeners = [];
        this.chatRequestsListeners = [];
        this.requestStatusListeners = [];
        this.adminConnectedListeners = [];
        this.sessionClosedListeners = [];
        this.adminChatAcceptedListeners = [];
        this.adminChatClosedListeners = [];
    }

    // User requests chat support
    requestSupport() {
        this.socket?.emit('user:request_support');
    }

    // User sends a message to admin
    sendUserMessage(content: string) {
        this.socket?.emit('user:send_message', { content });
    }

    // Admin sends a message to a user
    sendAdminMessage(userId: string, content: string) {
        this.socket?.emit('admin:send_message', { userId, content });
    }

    // Admin accepts a chat request
    acceptChat(requestId: string) {
        this.socket?.emit('admin:accept_chat', { requestId });
    }

    // Admin closes a chat session
    closeChat(requestId: string) {
        this.socket?.emit('admin:close_chat', { requestId });
    }

    // Admin marks messages from userId as read
    adminMarkRead(userId: string) {
        this.socket?.emit('admin:mark_read', { userId });
    }

    // User marks admin messages as read
    userMarkRead() {
        this.socket?.emit('user:mark_read');
    }

    onMessage(listener: ChatMessageListener) {
        this.messageListeners.push(listener);
        return () => {
            this.messageListeners = this.messageListeners.filter((l) => l !== listener);
        };
    }

    onUnread(listener: UnreadListener) {
        this.unreadListeners.push(listener);
        return () => {
            this.unreadListeners = this.unreadListeners.filter((l) => l !== listener);
        };
    }

    onAdminNewMessage(listener: AdminNewMsgListener) {
        this.adminNewMsgListeners.push(listener);
        return () => {
            this.adminNewMsgListeners = this.adminNewMsgListeners.filter((l) => l !== listener);
        };
    }

    onAdminStats(listener: AdminStatsListener) {
        this.adminStatsListeners.push(listener);
        return () => {
            this.adminStatsListeners = this.adminStatsListeners.filter((l) => l !== listener);
        };
    }

    onConnectionChange(listener: ConnectionListener) {
        this.connectionListeners.push(listener);
        return () => {
            this.connectionListeners = this.connectionListeners.filter((l) => l !== listener);
        };
    }

    // New listeners for request flow
    onChatRequests(listener: ChatRequestsListener) {
        this.chatRequestsListeners.push(listener);
        return () => {
            this.chatRequestsListeners = this.chatRequestsListeners.filter((l) => l !== listener);
        };
    }

    onRequestStatus(listener: RequestStatusListener) {
        this.requestStatusListeners.push(listener);
        return () => {
            this.requestStatusListeners = this.requestStatusListeners.filter((l) => l !== listener);
        };
    }

    onAdminConnected(listener: AdminConnectedListener) {
        this.adminConnectedListeners.push(listener);
        return () => {
            this.adminConnectedListeners = this.adminConnectedListeners.filter((l) => l !== listener);
        };
    }

    onSessionClosed(listener: SessionClosedListener) {
        this.sessionClosedListeners.push(listener);
        return () => {
            this.sessionClosedListeners = this.sessionClosedListeners.filter((l) => l !== listener);
        };
    }

    onAdminChatAccepted(listener: AdminChatAcceptedListener) {
        this.adminChatAcceptedListeners.push(listener);
        return () => {
            this.adminChatAcceptedListeners = this.adminChatAcceptedListeners.filter((l) => l !== listener);
        };
    }

    onAdminChatClosed(listener: AdminChatClosedListener) {
        this.adminChatClosedListeners.push(listener);
        return () => {
            this.adminChatClosedListeners = this.adminChatClosedListeners.filter((l) => l !== listener);
        };
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const chatSocket = new ChatSocketService();
