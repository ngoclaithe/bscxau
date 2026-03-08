import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

export interface SupportMessage {
    id: string;
    sessionId: string;
    senderId: string;
    senderType: 'user' | 'admin';
    message: string | null;
    imageUrl?: string | null;
    createdAt: string;
}

export interface SupportSession {
    id: string;
    userId: string;
    status: 'pending' | 'active' | 'rejected' | 'closed';
    createdAt: string;
    user?: {
        id: string;
        nickname?: string;
        email?: string;
        avatarUrl?: string;
    };
}

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (API_URL.startsWith('http') ? API_URL.replace(/\/api\/v1\/?$/, '') : window.location.origin);

type MessageListener = (msg: SupportMessage) => void;
type SessionClosedListener = () => void;
type HistoryListener = (messages: SupportMessage[]) => void;
type ConnectionListener = (connected: boolean) => void;
type ErrorListener = (err: { message: string }) => void;
type AdminAlertListener = (msg: SupportMessage) => void;
type AdminPendingSessionListener = (data: { session: SupportSession }) => void;

class SupportSocketService {
    private socket: Socket | null = null;
    private messageListeners: MessageListener[] = [];
    private sessionClosedListeners: SessionClosedListener[] = [];
    private historyListeners: HistoryListener[] = [];
    private connectionListeners: ConnectionListener[] = [];
    private errorListeners: ErrorListener[] = [];
    private adminAlertListeners: AdminAlertListener[] = [];
    private adminPendingSessionListeners: AdminPendingSessionListener[] = [];

    connect(): Promise<void> {
        return new Promise((resolve) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }

            this.socket = io(`${SOCKET_URL}/support`, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
            });

            this.socket.on('connect', () => {
                console.log('[SupportSocket] Connected:', this.socket?.id);
                this.connectionListeners.forEach((l) => l(true));
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('[SupportSocket] Disconnected');
                this.connectionListeners.forEach((l) => l(false));
            });

            this.socket.on('connect_error', (err) => {
                console.warn('[SupportSocket] Error:', err.message);
                this.connectionListeners.forEach((l) => l(false));
            });

            this.socket.on('new_message', (msg: SupportMessage) => {
                this.messageListeners.forEach((l) => l(msg));
            });

            this.socket.on('session_closed', () => {
                this.sessionClosedListeners.forEach((l) => l());
            });

            this.socket.on('session_history', (data: { messages: SupportMessage[] }) => {
                this.historyListeners.forEach((l) => l(data.messages));
            });

            this.socket.on('error', (err: { message: string }) => {
                console.error('[SupportSocket] Server error:', err.message);
                this.errorListeners.forEach((l) => l(err));
            });

            this.socket.on('admin_message_alert', (msg: SupportMessage) => {
                this.adminAlertListeners.forEach((l) => l(msg));
            });

            this.socket.on('admin:pending_session_new', (data: { session: SupportSession }) => {
                this.adminPendingSessionListeners.forEach((l) => l(data));
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this._clearListeners();
    }

    /** Join a session room after connecting. */
    joinSession(sessionId: string) {
        this.socket?.emit('join_session', { session_id: sessionId });
    }

    sendMessage(sessionId: string, message?: string | null, imageUrl?: string | null) {
        this.socket?.emit('send_message', { session_id: sessionId, message, image_url: imageUrl });
    }

    /** Admin closes the session. Emits session_closed to room. */
    closeSession(sessionId: string) {
        this.socket?.emit('close_session', { session_id: sessionId });
    }

    onMessage(listener: MessageListener) {
        this.messageListeners.push(listener);
        return () => { this.messageListeners = this.messageListeners.filter((l) => l !== listener); };
    }

    onSessionClosed(listener: SessionClosedListener) {
        this.sessionClosedListeners.push(listener);
        return () => { this.sessionClosedListeners = this.sessionClosedListeners.filter((l) => l !== listener); };
    }

    onHistory(listener: HistoryListener) {
        this.historyListeners.push(listener);
        return () => { this.historyListeners = this.historyListeners.filter((l) => l !== listener); };
    }

    onAdminMessageAlert(listener: AdminAlertListener) {
        this.adminAlertListeners.push(listener);
        return () => { this.adminAlertListeners = this.adminAlertListeners.filter((l) => l !== listener); };
    }

    onAdminPendingSession(listener: AdminPendingSessionListener) {
        this.adminPendingSessionListeners.push(listener);
        return () => { this.adminPendingSessionListeners = this.adminPendingSessionListeners.filter((l) => l !== listener); };
    }

    onConnectionChange(listener: ConnectionListener) {
        this.connectionListeners.push(listener);
        return () => { this.connectionListeners = this.connectionListeners.filter((l) => l !== listener); };
    }

    onError(listener: ErrorListener) {
        this.errorListeners.push(listener);
        return () => { this.errorListeners = this.errorListeners.filter((l) => l !== listener); };
    }

    isConnected() {
        return this.socket?.connected ?? false;
    }

    private _clearListeners() {
        this.messageListeners = [];
        this.sessionClosedListeners = [];
        this.historyListeners = [];
        this.connectionListeners = [];
        this.errorListeners = [];
        this.adminAlertListeners = [];
        this.adminPendingSessionListeners = [];
    }
}

export const supportSocket = new SupportSocketService();
