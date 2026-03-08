import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SupportService {
    constructor(private prisma: PrismaService) { }

    // ── User ──────────────────────────────────────────────────────────────────

    /**
     * Create a new support session (status = pending).
     * If an active or pending session already exists, return it.
     */
    async createSession(userId: string) {
        // Enforce 5 minute cooldown on rejected sessions
        const lastRejected = await this.prisma.supportSession.findFirst({
            where: {
                userId,
                status: 'rejected',
            },
            orderBy: { createdAt: 'desc' },
        });

        if (lastRejected) {
            const timeToCheck = lastRejected.closedAt || lastRejected.createdAt;
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (timeToCheck >= fiveMinsAgo) {
                throw new BadRequestException('Vui lòng đợi 5 phút trước khi gửi yêu cầu hỗ trợ mới.');
            }
        }
        const existing = await this.prisma.supportSession.findFirst({
            where: {
                userId,
                status: { in: ['pending', 'active'] },
            },
        });
        if (existing) return existing;

        return this.prisma.supportSession.create({
            data: { userId },
        });
    }

    /**
     * Get the latest session for a user (any state).
     */
    async getUserLatestSession(userId: string) {
        const session = await this.prisma.supportSession.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
            },
        });

        if (session && session.status === 'rejected') {
            const timeToCheck = session.closedAt || session.createdAt;
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (timeToCheck < fiveMinsAgo) {
                return null;
            }
        }

        return session;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * Get all sessions visible to admin (pending + active + recent closed/rejected).
     */
    async getAllSessions() {
        return this.prisma.supportSession.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    /**
     * Get pending sessions only.
     */
    async getPendingSessions() {
        return this.prisma.supportSession.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    /**
     * Approve: pending → active. Returns updated session with userId.
     */
    async approveSession(sessionId: string, adminId: string) {
        const session = await this.prisma.supportSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== 'pending')
            throw new BadRequestException(`Cannot approve a session with status: ${session.status}`);

        return this.prisma.supportSession.update({
            where: { id: sessionId },
            data: {
                status: 'active',
                adminId,
                approvedAt: new Date(),
            },
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
            },
        });
    }

    /**
     * Reject: pending → rejected.
     */
    async rejectSession(sessionId: string, adminId: string) {
        const session = await this.prisma.supportSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== 'pending')
            throw new BadRequestException(`Cannot reject a session with status: ${session.status}`);

        return this.prisma.supportSession.update({
            where: { id: sessionId },
            data: { status: 'rejected', adminId, closedAt: new Date() },
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
            },
        });
    }

    /**
     * Close: active → closed.
     */
    async closeSession(sessionId: string) {
        const session = await this.prisma.supportSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== 'active')
            throw new BadRequestException(`Cannot close a session with status: ${session.status}`);

        return this.prisma.supportSession.update({
            where: { id: sessionId },
            data: { status: 'closed', closedAt: new Date() },
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
            },
        });
    }

    /**
     * Delete an entire support session and its messages.
     */
    async deleteSession(sessionId: string) {
        const session = await this.prisma.supportSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) throw new NotFoundException('Session not found');

        // Find all messages with images to delete files
        const messagesWithImages = await this.prisma.supportMessage.findMany({
            where: {
                sessionId,
                imageUrl: { not: null },
            },
            select: { imageUrl: true },
        });

        // Delete files from storage
        for (const msg of messagesWithImages) {
            if (msg.imageUrl && msg.imageUrl.includes('/uploads/')) {
                try {
                    const filename = msg.imageUrl.split('/').pop();
                    if (filename) {
                        const filePath = path.join(process.cwd(), 'uploads', filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }
                } catch (err) {
                    console.error(`Failed to delete image: ${msg.imageUrl}`, err);
                }
            }
        }

        // Delete all messages first
        await this.prisma.supportMessage.deleteMany({
            where: { sessionId },
        });

        // Delete session
        return this.prisma.supportSession.delete({
            where: { id: sessionId },
            include: { user: { select: { id: true, nickname: true, email: true, avatarUrl: true } } }
        });
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    async saveMessage(sessionId: string, senderId: string, senderType: 'user' | 'admin', message?: string | null, imageUrl?: string | null) {
        return this.prisma.supportMessage.create({
            data: {
                sessionId,
                senderId,
                senderType,
                message: message || '',
                imageUrl
            },
        });
    }

    async getMessages(sessionId: string) {
        return this.prisma.supportMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getSessionById(sessionId: string) {
        return this.prisma.supportSession.findUnique({
            where: { id: sessionId },
            include: {
                user: { select: { id: true, nickname: true, email: true, avatarUrl: true } },
            },
        });
    }
}
