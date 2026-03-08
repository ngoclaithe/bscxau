import {
    Controller,
    Post,
    Get,
    Param,
    UseGuards,
    Request,
    Sse,
    MessageEvent,
    HttpCode,
    NotFoundException,
    ForbiddenException,
    Delete,
    UseInterceptors,
    UploadedFile,
    BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// ─── SSE registry (in-memory per process) ────────────────────────────────────
// Map<userId, Subject<MessageEvent>>
const sseClients = new Map<string, Subject<MessageEvent>>();

export function notifyUser(userId: string, eventName: string, payload: object) {
    const subject = sseClients.get(userId);
    if (subject) {
        subject.next({ type: eventName, data: JSON.stringify(payload) } as MessageEvent);
    }
}

// ─── User endpoints ───────────────────────────────────────────────────────────

@Controller('support')
@UseGuards(AuthGuard('jwt'))
export class SupportUserController {
    constructor(
        private supportService: SupportService,
        private supportGateway: SupportGateway,
    ) { }

    /**
     * POST /support/request
     * User requests support. Returns session_id.
     * Notifies all connected admins of the new pending session via WebSocket.
     */
    @Post('request')
    @HttpCode(201)
    async requestSupport(@Request() req: any) {
        const userId = req.user.userId;
        const session = await this.supportService.createSession(userId);
        // Notify all admins of the new pending session in real-time
        this.supportGateway.notifyAdminsOfNewSession(session);
        return { session_id: session.id, status: session.status };
    }

    /**
     * GET /support/my-session
     * Returns user's latest session & status (for re-hydration on page load).
     */
    @Get('my-session')
    async getMySession(@Request() req: any) {
        const userId = req.user.userId;
        const session = await this.supportService.getUserLatestSession(userId);
        if (!session) return { status: null, session_id: null };
        return { session_id: session.id, status: session.status };
    }

    /**
     * POST /support/upload
     * Upload an image for support chat
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req: any, file: any, cb: any) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadImage(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('File not found');
        return { imageUrl: `/users/uploads/${file.filename}` };
    }

    /**
     * GET /support/session/:id/messages
     * User fetches messages for an active session.
     */
    @Get('session/:id/messages')
    async getMessages(@Param('id') id: string, @Request() req: any) {
        const session = await this.supportService.getSessionById(id);
        if (!session) throw new NotFoundException('Session not found');
        if (session.userId !== req.user.userId) throw new ForbiddenException();
        return this.supportService.getMessages(id);
    }

    /**
     * GET /support/sse
     * Open an SSE stream for the authenticated user.
     * Server will push: support_session_approved | support_session_rejected
     * The frontend should open this right after creating a pending session.
     */
    @Sse('sse')
    userSse(@Request() req: any): Observable<MessageEvent> {
        const userId = req.user.userId;

        // Close any previous subject for this user
        if (sseClients.has(userId)) {
            sseClients.get(userId)!.complete();
        }

        const subject = new Subject<MessageEvent>();
        sseClients.set(userId, subject);

        // Clean up when the client disconnects
        req.res?.on('close', () => {
            subject.complete();
            sseClients.delete(userId);
        });

        return subject.asObservable().pipe(map((e) => e));
    }
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

@Controller('support/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR')
export class SupportAdminController {
    constructor(private supportService: SupportService) { }

    /**
     * GET /support/admin/sessions
     * Returns all sessions (paginated to 100).
     */
    @Get('sessions')
    async getAllSessions() {
        return this.supportService.getAllSessions();
    }

    /**
     * GET /support/admin/sessions/pending
     * Pending sessions only.
     */
    @Get('sessions/pending')
    async getPending() {
        return this.supportService.getPendingSessions();
    }

    /**
     * GET /support/admin/session/:id/messages
     * Admin fetches message history of any session.
     */
    @Get('session/:id/messages')
    async getMessages(@Param('id') id: string) {
        return this.supportService.getMessages(id);
    }

    /**
     * POST /support/admin/sessions/:id/approve
     * pending → active  +  SSE notify user.
     */
    @Post('sessions/:id/approve')
    @HttpCode(200)
    async approve(@Param('id') id: string, @Request() req: any) {
        const adminId = req.user.userId || req.user.sub;
        const session = await this.supportService.approveSession(id, adminId);
        // Notify the waiting user via SSE
        notifyUser(session.userId, 'support_session_approved', { session_id: session.id });
        return session;
    }

    /**
     * POST /support/admin/sessions/:id/reject
     * pending → rejected  +  SSE notify user.
     */
    @Post('sessions/:id/reject')
    @HttpCode(200)
    async reject(@Param('id') id: string, @Request() req: any) {
        const adminId = req.user.userId || req.user.sub;
        const session = await this.supportService.rejectSession(id, adminId);
        // Notify the waiting user via SSE
        notifyUser(session.userId, 'support_session_rejected', { session_id: session.id });
        return session;
    }

    /**
     * POST /support/admin/sessions/:id/close
     * active → closed  (WebSocket event emitted from gateway).
     */
    @Post('sessions/:id/close')
    @HttpCode(200)
    async close(@Param('id') id: string) {
        return this.supportService.closeSession(id);
    }

    /**
     * DELETE /support/admin/sessions/:id
     * Delete an old session entirely
     */
    @Delete('sessions/:id')
    @HttpCode(200)
    async delete(@Param('id') id: string) {
        return this.supportService.deleteSession(id);
    }
}
