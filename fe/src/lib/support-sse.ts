import { API_URL } from './api';

export type SseSessionEvent =
    | { type: 'support_session_approved'; session_id: string }
    | { type: 'support_session_rejected'; session_id: string };

type SseListener = (event: SseSessionEvent) => void;

/**
 * Opens an SSE connection to /support/sse.
 * Returns a cleanup function that closes the connection.
 *
 * Usage:
 *   const close = openSupportSse((event) => { ... });
 *   // Later:
 *   close();
 */
export function openSupportSse(listener: SseListener): () => void {
    const es = new EventSource(`${API_URL}/support/sse`, { withCredentials: true });

    const handleEvent = (raw: MessageEvent, type: string) => {
        try {
            const payload = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
            listener({ type, session_id: payload.session_id } as SseSessionEvent);
        } catch (e) {
            console.warn('[SupportSSE] Failed to parse event', type, e);
        }
    };

    es.addEventListener('support_session_approved', (e) =>
        handleEvent(e as MessageEvent, 'support_session_approved'),
    );
    es.addEventListener('support_session_rejected', (e) =>
        handleEvent(e as MessageEvent, 'support_session_rejected'),
    );

    es.onerror = (err) => {
        console.warn('[SupportSSE] Connection error', err);
    };

    return () => {
        es.close();
    };
}
