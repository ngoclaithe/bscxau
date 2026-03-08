import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupportStore, SupportSession } from '@/stores/support-store';
import { supportSocket, SupportMessage } from '@/lib/support-socket';
import { toast } from 'sonner';
import { MessageSquare, Check, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Chờ duyệt', color: 'text-amber-400 bg-amber-400/10' },
    active: { label: 'Đang chat', color: 'text-green-400 bg-green-400/10' },
    rejected: { label: 'Từ chối', color: 'text-red-400 bg-red-400/10' },
    closed: { label: 'Đã đóng', color: 'text-gray-400 bg-gray-400/10' },
};

function StatusBadge({ status }: { status: string | null }) {
    const cfg = status ? STATUS_CONFIG[status] : null;
    const finalCfg = cfg ?? { label: status || 'Unknown', color: 'text-white/40 bg-white/5' };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${finalCfg.color}`}>
            {finalCfg.label}
        </span>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userName(s: SupportSession | null) {
    if (!s?.user) return 'Unknown';
    return s.user.nickname || s.user.email || s.user.id.slice(0, 8);
}

function fmt(d: string) {
    return new Date(d).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
}

// ─── Main component ───────────────────────────────────────────────────────────

export const AdminChatPage: React.FC = () => {
    const {
        allSessions,
        selectedSessionId,
        adminMessages,
        adminLoading,
        fetchAllSessions,
        selectSession: storeSelectSession,
        fetchAdminMessages,
        addAdminMessage,
        approveSession,
        rejectSession,
        closeSession,
        deleteSession,
        uploadImage,
        unreadCounts
    } = useSupportStore();

    const [input, setInput] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'all'>('pending');
    const [isUploading, setIsUploading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const sessionListenersRef = useRef<{ msg?: Function, hist?: Function, closed?: Function }>({});

    // ── Initial load & Global Socket ──────────────────────────────────────────
    useEffect(() => {
        fetchAllSessions();
        const interval = setInterval(fetchAllSessions, 15000); // poll every 15s

        let isMounted = true;
        supportSocket.connect().then(() => {
            if (isMounted) setWsConnected(true);
        });

        const unsubAlert = supportSocket.onAdminMessageAlert((msg) => {
            if (msg.sessionId !== useSupportStore.getState().selectedSessionId) {
                useSupportStore.getState().incrementUnread(msg.sessionId);
            }
            useSupportStore.getState().updateSessionLastMessage(msg.sessionId, msg);
        });

        return () => {
            clearInterval(interval);
            isMounted = false;
            unsubAlert();
            supportSocket.disconnect();
        };
    }, []);

    // ── Select a session to chat ──────────────────────────────────────────────
    async function selectSession(session: SupportSession) {
        storeSelectSession(session.id);
        fetchAdminMessages(session.id);

        if (sessionListenersRef.current.msg) sessionListenersRef.current.msg();
        if (sessionListenersRef.current.hist) sessionListenersRef.current.hist();
        if (sessionListenersRef.current.closed) sessionListenersRef.current.closed();

        sessionListenersRef.current = {};

        if (session.status === 'active') {
            supportSocket.joinSession(session.id);

            sessionListenersRef.current.hist = supportSocket.onHistory((msgs) => {
                useSupportStore.setState({ adminMessages: msgs });
                setTimeout(scrollToBottom, 100);
            });

            sessionListenersRef.current.msg = supportSocket.onMessage((msg: SupportMessage) => {
                addAdminMessage(msg);
                useSupportStore.getState().updateSessionLastMessage(session.id, msg);
                setTimeout(scrollToBottom, 50);
            });

            supportSocket.onConnectionChange((c) => setWsConnected(c));

            sessionListenersRef.current.closed = supportSocket.onSessionClosed(() => {
                fetchAllSessions();
            });
        }
    }

    // ── Admin approve ─────────────────────────────────────────────────────────
    async function handleApprove(session: SupportSession) {
        try {
            await approveSession(session.id);
            await fetchAllSessions();
            const updated = useSupportStore.getState().allSessions.find(s => s.id === session.id);
            if (updated) {
                setActiveTab('active');
                selectSession(updated);
            }
        } catch (e: any) {
            toast.error(e?.message || 'Lỗi khi phê duyệt');
        }
    }

    // ── Admin reject ──────────────────────────────────────────────────────────
    async function handleReject(session: SupportSession) {
        try {
            await rejectSession(session.id);
        } catch (e: any) {
            toast.error(e?.message || 'Lỗi khi từ chối');
        }
    }

    // ── Admin close session ───────────────────────────────────────────────────
    async function handleClose() {
        if (!selectedSessionId) return;
        try {
            // Close via WebSocket so the user's UI gets session_closed event
            supportSocket.closeSession(selectedSessionId);
            // Also persist via HTTP
            await closeSession(selectedSessionId);
            storeSelectSession('');
            supportSocket.disconnect();
            setWsConnected(false);
            await fetchAllSessions(); // Refresh list to reflect closed status
        } catch (e: any) {
            toast.error(e?.message || 'Lỗi khi đóng phiên');
        }
    }

    // ── Admin delete session ──────────────────────────────────────────────────
    async function handleDelete(session: SupportSession) {
        if (!confirm('Bạn có chắc chắn muốn xóa phiên chat này không?')) return;
        try {
            await deleteSession(session.id);
        } catch (e: any) {
            toast.error(e?.message || 'Lỗi khi xóa');
        }
    }

    // ── Send message ──────────────────────────────────────────────────────────
    function handleSend() {
        if (!input.trim() || !selectedSessionId) return;
        supportSocket.sendMessage(selectedSessionId, input.trim());
        setInput('');
    }

    // ── Send image ────────────────────────────────────────────────────────────
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !selectedSessionId) return;

        try {
            setIsUploading(true);
            const imageUrl = await uploadImage(file);

            supportSocket.sendMessage(selectedSessionId, null, imageUrl);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e: any) {
            toast.error('Lỗi khi tải ảnh lên');
        } finally {
            setIsUploading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // ── Filtered sessions ─────────────────────────────────────────────────────
    const filtered = allSessions.filter((s) => {
        if (activeTab === 'pending') return s.status === 'pending';
        if (activeTab === 'active') return s.status === 'active';
        return true;
    });

    const selectedSession = allSessions.find((s) => s.id === selectedSessionId) ?? null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-64px)] bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">

            {/* ── Left panel: session list ────────────────────────────────── */}
            <div className="w-80 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white mb-3">Hỗ trợ Chat</h2>
                    {/* Tabs */}
                    <div className="flex rounded-xl bg-white/5 p-1 gap-1">
                        {(['pending', 'active', 'all'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab
                                    ? 'bg-amber-400 text-black'
                                    : 'text-white/50 hover:text-white'
                                    }`}
                            >
                                {{ pending: 'Chờ duyệt', active: 'Đang chat', all: 'Tất cả' }[tab]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto">
                    {adminLoading && filtered.length === 0 && (
                        <div className="py-8 text-center text-white/40 text-sm">Đang tải...</div>
                    )}
                    {!adminLoading && filtered.length === 0 && (
                        <div className="py-8 text-center text-white/40 text-sm">Không có phiên nào</div>
                    )}
                    {filtered.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            isSelected={session.id === selectedSessionId}
                            onSelect={() => selectSession(session)}
                            onApprove={() => handleApprove(session)}
                            onReject={() => handleReject(session)}
                            unreadCount={unreadCounts[session.id] || 0}
                        />
                    ))}
                </div>
            </div>

            {/* ── Right panel: chat ───────────────────────────────────────── */}
            <div className="flex-1 flex flex-col">
                {!selectedSessionId || !selectedSession ? (
                    <div className="flex-1 flex items-center justify-center text-white/30 flex-col gap-3">
                        <MessageSquare className="w-12 h-12 text-white/30" />
                        <p className="text-sm">Chọn một phiên đang active để bắt đầu chat</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                            <div>
                                <p className="font-semibold text-white">{userName(selectedSession)}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <StatusBadge status={selectedSession.status} />
                                    <span className="text-xs text-white/30">
                                        {fmt(selectedSession.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${wsConnected && selectedSession.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                    ● {wsConnected && selectedSession.status === 'active' ? 'Kết nối' : 'Mất kết nối'}
                                </span>
                                {selectedSession.status === 'active' && (
                                    <button
                                        onClick={handleClose}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                    >
                                        Kết thúc phiên
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(selectedSession)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {adminMessages.length === 0 && (
                                <div className="text-center text-white/30 text-sm py-8">
                                    Chưa có tin nhắn nào
                                </div>
                            )}
                            {adminMessages.map((msg) => {
                                const isAdmin = msg.senderType === 'admin';
                                const senderName = isAdmin ? 'Bạn' : userName(selectedSession) || 'Khách';
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[11px] font-medium text-white/40 mb-1 px-1`}>
                                            {senderName}
                                        </span>
                                        <div
                                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isAdmin
                                                ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-black'
                                                : 'bg-white/10 text-white'
                                                }`}
                                        >
                                            {msg.message && <div className="break-words whitespace-pre-wrap">{msg.message}</div>}
                                            {msg.imageUrl && (
                                                <div className="mt-2">
                                                    <img src={getAvatarUrl(msg.imageUrl)} alt="attachment" className="max-w-[200px] rounded-lg" />
                                                </div>
                                            )}
                                            <div className={`text-[10px] mt-1 ${isAdmin ? 'text-black/60 text-right' : 'text-white/40'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        {selectedSession.status === 'active' && (
                            <div className="px-4 py-3 border-t border-white/10 bg-white/5 flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!wsConnected || isUploading}
                                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập tin nhắn... (Enter để gửi)"
                                    rows={1}
                                    className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    onInput={(e) => {
                                        const t = e.currentTarget;
                                        t.style.height = 'auto';
                                        t.style.height = t.scrollHeight + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || !wsConnected}
                                    className="px-5 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-400 to-yellow-500 text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
                                >
                                    Gửi
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Session card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
    session: SupportSession;
    isSelected: boolean;
    onSelect: () => void;
    onApprove: () => void;
    onReject: () => void;
    unreadCount: number;
}

function SessionCard({ session, isSelected, onSelect, onApprove, onReject, unreadCount }: SessionCardProps) {
    const name = session.user?.nickname || session.user?.email || session.userId.slice(0, 8);
    const lastMsg = session.messages?.[0];

    return (
        <div
            onClick={session.status !== 'pending' ? onSelect : undefined}
            className={`px-4 py-3 border-b border-white/5 transition-colors ${session.status !== 'pending' ? 'cursor-pointer hover:bg-white/5' : ''
                } ${isSelected ? 'bg-amber-400/10 border-l-2 border-l-amber-400' : ''}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{fmt(session.createdAt)}</p>
                </div>
                <StatusBadge status={session.status} />
            </div>

            {/* Actions for pending sessions */}
            {session.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onApprove(); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                        <Check className="w-3.5 h-3.5" /> Phê duyệt
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onReject(); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                </div>
            )}

            {/* Click cue for active & closed */}
            {session.status !== 'pending' && (
                <div className="mt-2 text-xs flex items-center justify-between">
                    {lastMsg ? (
                        <div className="text-white/50 truncate max-w-[70%]">
                            {lastMsg.senderType === 'user' ? 'User: ' : 'Bạn: '}
                            {lastMsg.message}
                        </div>
                    ) : (
                        <div className="text-amber-400/60">{!isSelected ? 'Nhấn để mở chat →' : ''}</div>
                    )}

                    {unreadCount > 0 && !isSelected && (
                        <span className="font-bold text-black bg-red-500 rounded-full px-2 py-0.5 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                            {unreadCount}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
