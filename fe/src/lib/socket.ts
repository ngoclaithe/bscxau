import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (API_URL.startsWith('http') ? API_URL.replace(/\/api\/v1\/?$/, '') : window.location.origin);

class SocketService {
    private socket: Socket | null = null;
    private priceListeners: Map<string, ((price: number) => void)[]> = new Map();

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            // console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            // console.log('Socket disconnected');
        });

        this.socket.on('price:update', (data: { pair: string; price: number; timestamp: number }) => {
            const listeners = this.priceListeners.get(data.pair) || [];
            listeners.forEach((listener) => listener(data.price));

            const allListeners = this.priceListeners.get('*') || [];
            allListeners.forEach((listener) => listener(data.price));
        });

        this.socket.on('trade:created', (_data: unknown) => {
            // console.log('Trade created:', data);
        });

        this.socket.on('trade:settled', (_data: unknown) => {
            // console.log('Trade settled:', data);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribeToPair(pair: string, callback: (price: number) => void) {
        if (!this.priceListeners.has(pair)) {
            this.priceListeners.set(pair, []);
        }
        this.priceListeners.get(pair)!.push(callback);

        this.socket?.emit('subscribe:price', [pair]);
    }

    unsubscribeFromPair(pair: string, callback: (price: number) => void) {
        const listeners = this.priceListeners.get(pair);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
            if (listeners.length === 0) {
                this.socket?.emit('unsubscribe:price', [pair]);
                this.priceListeners.delete(pair);
            }
        }
    }

    onPriceUpdate(callback: (data: { pair: string; price: number; timestamp?: number }) => void) {
        this.socket?.on('price:update', callback);
    }

    offPriceUpdate(callback: (data: { pair: string; price: number; timestamp?: number }) => void) {
        this.socket?.off('price:update', callback);
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
