import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SupportService } from './support.service';

interface AuthSocket extends Socket {
    userId?: string;
    userRole?: string;
    isAdmin?: boolean;
    sessionId?: string;
}

@WebSocketGateway({
    cors: {
        origin: (process.env.FRONTEND_URL || 'http://localhost:5173')
            .split(',')
            .map((u) => u.trim()),
        credentials: true,
    },
    namespace: '/support',
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private supportService: SupportService,
    ) { }

    async handleConnection(client: AuthSocket) {
        try {
            const token = this._extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.userId = payload.sub || payload.userId;
            client.userRole = payload.role;
            client.isAdmin =
                ['ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR'].includes(payload.role || '') ||
                payload.isAdmin === true;

            if (client.isAdmin) {
                client.join('admin_updates_room');
            }

            console.log(
                `[Support WS] Connected: ${client.id} | userId=${client.userId} | isAdmin=${client.isAdmin}`,
            );
        } catch (err) {
            console.warn('[Support WS] Auth failed, disconnecting:', err?.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        console.log(`[Support WS] Disconnected: ${client.id} (userId=${client.userId})`);
    }

    /**
     * Client joins the session room.
     * Event: join_session   payload: { session_id }
     * Both user and admin call this to enter the chat room.
     */
    @SubscribeMessage('join_session')
    async handleJoinSession(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { session_id: string },
    ) {
        if (!data?.session_id) return;

        const session = await this.supportService.getSessionById(data.session_id);
        if (!session) {
            client.emit('error', { message: 'Session not found' });
            return;
        }

        // Only allow if session is active
        if (session.status !== 'active') {
            client.emit('error', { message: 'Session is not active' });
            return;
        }

        // Verify user belongs to this session (admins may join any)
        if (!client.isAdmin && session.userId !== client.userId) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }

        const room = `support_session_${session.id}`;
        client.join(room);
        client.sessionId = session.id;
        console.log(`[Support WS] ${client.userId} joined room ${room}`);

        // Send message history
        const messages = await this.supportService.getMessages(session.id);
        client.emit('session_history', { session_id: session.id, messages });
    }

    /**
     * Send a message to the session room.
     * Event: send_message   payload: { session_id, message, image_url }
     */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { session_id: string; message?: string; image_url?: string },
    ) {
        if (!data?.session_id || (!data?.message?.trim() && !data?.image_url)) return;

        const session = await this.supportService.getSessionById(data.session_id);
        if (!session || session.status !== 'active') {
            client.emit('error', { message: 'Session is not active' });
            return;
        }

        // Verify membership
        if (!client.isAdmin && session.userId !== client.userId) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }

        const senderType: 'user' | 'admin' = client.isAdmin ? 'admin' : 'user';
        const msg = await this.supportService.saveMessage(
            data.session_id,
            client.userId!,
            senderType,
            data.message?.trim() || null,
            data.image_url || null
        );

        const room = `support_session_${session.id}`;
        this.server.to(room).emit('new_message', msg);

        if (senderType === 'user') {
            this.server.to('admin_updates_room').emit('admin_message_alert', msg);
        }
    }

    /**
     * Admin closes the session.
     * Event: close_session  payload: { session_id }
     * After closing, emits session_closed to the room.
     */
    @SubscribeMessage('close_session')
    async handleCloseSession(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { session_id: string },
    ) {
        if (!client.isAdmin || !data?.session_id) return;

        try {
            const session = await this.supportService.closeSession(data.session_id);
            const room = `support_session_${session.id}`;
            // Notify everyone in the room
            this.server.to(room).emit('session_closed', { session_id: session.id });
        } catch (err) {
            client.emit('error', { message: err?.message || 'Failed to close session' });
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private _extractToken(client: AuthSocket): string | undefined {
        // 1. Cookie
        const cookie = client.handshake.headers?.cookie || '';
        const match = cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);

        // 2. Handshake auth
        if (client.handshake.auth?.token) return client.handshake.auth.token;

        // 3. Bearer header
        const auth = client.handshake.headers?.authorization || '';
        if (auth.startsWith('Bearer ')) return auth.slice(7);

        return undefined;
    }
}
