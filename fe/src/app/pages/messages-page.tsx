import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSupportStore, SessionStatus } from '@/stores/support-store';
import { openSupportSse } from '@/lib/support-sse';
import { supportSocket, SupportMessage } from '@/lib/support-socket';
import { toast } from 'sonner';
import { MessageSquare, XCircle, Lock, Circle, HelpCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

// ─── State machine helpers ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SessionStatus }) {
    const map: Record<string, { label: string; color: string }> = {
        pending: { label: 'Đang chờ admin', color: '#f59e0b' },
        active: { label: 'Đang chat', color: '#10b981' },
        rejected: { label: 'Bị từ chối', color: '#ef4444' },
        closed: { label: 'Đã kết thúc', color: '#6b7280' },
    };
    const s = status ? map[status] : null;
    if (!s) return null;
    return (
        <span style={{ color: s.color }} className="text-xs font-semibold flex items-center gap-1.5 align-middle">
            <Circle className="w-2.5 h-2.5 fill-current" /> {s.label}
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const MessagesPage: React.FC = () => {
    const { isAuthenticated, user } = useAuthStore();
    const {
        sessionId,
        sessionStatus,
        messages,
        isLoading,
        fetchMySession,
        requestSupport,
        fetchMessages,
        addMessage,
        setMessages,
        setSessionStatus,
        setSessionId,
        uploadImage,
    } = useSupportStore();

    const [input, setInput] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const sseCleanupRef = useRef<(() => void) | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, []);

    // ── On mount: fetch session status ────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        fetchMySession().then(() => {
            const { sessionStatus: status, sessionId: id } = useSupportStore.getState();
            if (status === 'pending') {
                openSseChannel();
            } else if (status === 'active' && id) {
                openChatChannel(id);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user]);

    // ── Scroll whenever messages update ──────────────────────────────────────
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            sseCleanupRef.current?.();
            supportSocket.disconnect();
        };
    }, []);

    // ── SSE helpers ───────────────────────────────────────────────────────────

    function openSseChannel() {
        // Close previous SSE if any
        sseCleanupRef.current?.();

        const cleanup = openSupportSse((event) => {
            if (event.type === 'support_session_approved') {
                // SSE done – close it
                sseCleanupRef.current?.();
                sseCleanupRef.current = null;

                setSessionStatus('active');
                setSessionId(event.session_id);
                toast.success('Admin đã chấp nhận yêu cầu! Bắt đầu chat.');
                openChatChannel(event.session_id);
            } else if (event.type === 'support_session_rejected') {
                sseCleanupRef.current?.();
                sseCleanupRef.current = null;

                setSessionStatus('rejected');
                toast.error('Hiện tại chưa có hỗ trợ nào rảnh. Vui lòng yêu cầu nhắn tin hỗ trợ sau 5p');
            }
        });

        sseCleanupRef.current = cleanup;
    }

    // ── WebSocket helpers ─────────────────────────────────────────────────────

    async function openChatChannel(sid: string) {
        fetchMessages(sid);

        const socketRef = supportSocket;
        await socketRef.disconnect(); // Clear old listeners and connection
        socketRef.connect().then(() => {
            setWsConnected(true);
            socketRef.joinSession(sid);
        });

        socketRef.onConnectionChange((connected) => {
            setWsConnected(connected);
        });

        socketRef.onHistory((msgs: SupportMessage[]) => {
            setMessages(msgs);
            // wait for DOM paint
            requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
        });

        socketRef.onMessage((msg: SupportMessage) => {
            addMessage(msg);
            requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
        });

        socketRef.onSessionClosed(() => {
            setSessionStatus('closed');
            socketRef.disconnect();
            setWsConnected(false);
        });
    }

    // ── User: request support ─────────────────────────────────────────────────

    async function handleRequestSupport() {
        const sid = await requestSupport();
        if (!sid) {
            toast.error('Không thể tạo yêu cầu hỗ trợ, hãy thử lại.');
            return;
        }
        toast.success('Yêu cầu đã gửi! Đang chờ admin phê duyệt...');
        openSseChannel();
    }

    // ── Send message ──────────────────────────────────────────────────────────

    // ── Send message ──────────────────────────────────────────────────────────

    function handleSend() {
        if (!input.trim() || !sessionId) return;
        supportSocket.sendMessage(sessionId, input.trim());
        setInput('');
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !sessionId) return;

        try {
            setIsUploading(true);
            const imageUrl = await uploadImage(file);

            supportSocket.sendMessage(sessionId, null, imageUrl);
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
            // Reset textarea height after sending
            e.currentTarget.style.height = 'auto';
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    const renderContent = () => {
        if (!isAuthenticated) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground w-full">
                    Vui lòng đăng nhập để sử dụng hỗ trợ.
                </div>
            );
        }

        if (!sessionStatus) {
            return <IdleState loading={isLoading} onRequest={handleRequestSupport} />;
        }

        if (sessionStatus === 'pending') {
            return <WaitingState />;
        }

        if (sessionStatus === 'rejected') {
            return (
                <RejectedState
                    onRetry={() => {
                        setSessionStatus(null);
                        setSessionId(null);
                    }}
                />
            );
        }

        if (sessionStatus === 'closed') {
            return (
                <ClosedState
                    loading={isLoading}
                    onRetry={() => {
                        setMessages([]);
                        handleRequestSupport();
                    }}
                />
            );
        }

        // ── ACTIVE (chat) ─────────────────────────────────────────────────────────
        return (
            <div className="flex flex-col h-full w-full bg-[#111318]/50 overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-wide">Hỗ Trợ Trực Tiếp</h2>
                        <div className="mt-1">
                            <StatusBadge status={sessionStatus} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <span
                            className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}
                        />
                        <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
                            {wsConnected ? 'Đã kết nối' : 'Mất kết nối'}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar scroll-smooth">
                    {messages.length === 0 && (
                        <div className="text-center text-white/30 text-sm py-12 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
                                <HelpCircle className="w-6 h-6 text-white/20" />
                            </div>
                            <span>Bắt đầu cuộc trò chuyện với admin</span>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderType === 'user';
                        const senderName = isMe ? 'Bạn' : 'Hỗ trợ viên';
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className={`text-[11px] font-medium text-white/40 mb-1 px-1`}>
                                    {senderName}
                                </span>
                                <div
                                    className={`max-w-[80%] px-4 py-3 text-[15px] leading-relaxed relative ${isMe
                                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-black rounded-2xl rounded-tr-sm shadow-[0_2px_10px_rgba(251,191,36,0.2)]'
                                        : 'bg-[#2a2d36] text-gray-100 rounded-2xl rounded-tl-sm shadow-md border border-white/5'
                                        }`}
                                >
                                    {msg.message && <div className="break-words whitespace-pre-wrap">{msg.message}</div>}
                                    {msg.imageUrl && (
                                        <div className="mt-2 text-center pb-2">
                                            <img src={getAvatarUrl(msg.imageUrl)} alt="attachment" className="max-w-full rounded-lg max-h-64 object-contain mx-auto border border-black/10" />
                                        </div>
                                    )}
                                    <div className={`text-[10px] mt-1.5 flex items-center ${isMe ? 'text-black/60 justify-end' : 'text-white/40 justify-start'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-white/5 bg-[#171923] flex gap-3 z-10 shrink-0">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!wsConnected || isUploading}
                        className="h-[52px] w-[52px] shrink-0 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ImageIcon className="w-5 h-5 text-white/50" />}
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
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                        className="flex-1 resize-none bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400/50 min-h-[52px] max-h-[140px] shadow-inner custom-scrollbar block"
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                            const t = e.currentTarget;
                            t.style.height = 'auto';
                            t.style.height = `${t.scrollHeight}px`;
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || !wsConnected}
                        className="px-6 py-0 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:shadow-none hover:opacity-90 hover:scale-[0.98] active:scale-[0.96] transition-all self-end h-[52px] flex items-center justify-center shrink-0"
                    >
                        Gửi
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full items-center justify-center py-4 sm:py-6 px-4">
            <div className="w-full max-w-4xl h-[75vh] md:h-[80vh] min-h-[500px] bg-[#1a1b1e]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
                {renderContent()}
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function IdleState({ loading, onRequest }: { loading: boolean; onRequest: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-amber-400/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-amber-500" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Hỗ trợ trực tiếp</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Gửi yêu cầu hỗ trợ và admin sẽ kết nối với bạn trong thời gian sớm nhất.
                </p>
            </div>
            <button
                onClick={onRequest}
                disabled={loading}
                className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                {loading ? 'Đang gửi...' : 'Yêu cầu hỗ trợ'}
            </button>
        </div>
    );
}

function WaitingState() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-amber-400/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Đang chờ admin</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Yêu cầu của bạn đã được gửi. Admin sẽ phê duyệt sớm nhất có thể.
                </p>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Đang chờ phê duyệt...
            </span>
        </div>
    );
}

function RejectedState({ onRetry }: { onRetry: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRetry();
        }, 5 * 60 * 1000);
        return () => clearTimeout(timer);
    }, [onRetry]);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-red-400/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Chưa có hỗ trợ viên</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Hiện tại chưa có hỗ trợ nào rảnh. Vui lòng yêu cầu nhắn tin hỗ trợ sau 5p
                </p>
            </div>
            <button
                onClick={onRetry}
                className="px-8 py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                Thử lại
            </button>
        </div>
    );
}

function ClosedState({ onRetry, loading }: { onRetry: () => void; loading?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-gray-400/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Phiên chat đã kết thúc</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Admin đã kết thúc phiên hỗ trợ này. Bạn có thể tạo yêu cầu mới.
                </p>
            </div>
            <button
                onClick={onRetry}
                disabled={loading}
                className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                {loading ? 'Đang gửi...' : 'Yêu cầu hỗ trợ mới'}
            </button>
        </div>
    );
}
