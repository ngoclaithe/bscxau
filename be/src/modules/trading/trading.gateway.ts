import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { TradeCreatedEvent, TradeSettledEvent } from '../../events/trade.events';
import { PriceManipulationService } from '../oracle/price-manipulation.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import * as cookie from 'cookie';

@WebSocketGateway({ cors: true })
export class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;
    private readonly PRICE_PAIRS = ['BTC/USD', 'WTI/USD'];
    private readonly logger = new Logger(TradingGateway.name);

    constructor(
        private priceManipulationService: PriceManipulationService,
        private jwtService: JwtService,
        private redisService: RedisService,
    ) {
        this.logger.log('TradingGateway constructor called');
    }

    async afterInit() {
        this.logger.log('TradingGateway afterInit called');
        this.subscribeToOraclePrices();
    }

    async handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        // Handle auth for online status
        try {
            const rawCookie = client.request.headers.cookie;
            if (rawCookie) {
                const cookies = cookie.parse(rawCookie);
                const token = cookies.access_token;
                if (token) {
                    const decoded = this.jwtService.decode(token) as any;
                    if (decoded && decoded.sub) {
                        client.data.userId = decoded.sub;
                        await this.redisService.getClient().sadd('online_users', decoded.sub);
                    }
                }
            }
        } catch (e) {
            // Ignore auth errors, sockets can be public
        }

        // Auto-subscribe new clients to all price feeds
        this.PRICE_PAIRS.forEach((pair) => {
            client.join(`price:${pair}`);
            this.logger.debug(`Client ${client.id} joined room price:${pair}`);
        });
    }

    async handleDisconnect(client: Socket) {
        if (client.data && client.data.userId) {
            try {
                await this.redisService.getClient().srem('online_users', client.data.userId);
            } catch (e) { }
        }
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe:price')
    handleSubscribePrice(client: Socket, pairs: string[]) {
        pairs.forEach((pair) => client.join(`price:${pair}`));
        return { event: 'subscribed', data: pairs };
    }

    @SubscribeMessage('unsubscribe:price')
    handleUnsubscribePrice(client: Socket, pairs: string[]) {
        pairs.forEach((pair) => client.leave(`price:${pair}`));
        return { event: 'unsubscribed', data: pairs };
    }

    @SubscribeMessage('get:prices')
    async handleGetPrices() {
        const prices: { pair: string; price: number; timestamp: number }[] = [];
        for (const pair of this.PRICE_PAIRS) {
            const price = this.priceManipulationService.getCurrentPrice(pair);
            prices.push({ pair, price, timestamp: Date.now() });
        }
        return { event: 'prices', data: prices };
    }

    @OnEvent('trade.created')
    handleTradeCreated(event: TradeCreatedEvent) {
        this.server.emit('trade:created', event);
    }

    @OnEvent('trade.settled')
    handleTradeSettled(event: TradeSettledEvent) {
        this.server.emit('trade:settled', event);
    }

    private subscribeToOraclePrices() {
        this.logger.log('Subscribing to PriceManipulationService updates');
        this.priceManipulationService.priceUpdates$.subscribe((update) => {
            // this.logger.debug(`Received price update for ${update.symbol}: ${update.price}`);
            this.broadcastPrice(update.symbol, update.price);
        });
    }

    broadcastPrice(pair: string, price: number) {
        // this.logger.debug(`Broadcasting price for ${pair}: ${price}`);
        this.server.to(`price:${pair}`).emit('price:update', { pair, price, timestamp: Date.now() });
        // Also broadcast to all connected clients
        this.server.emit('price:update', { pair, price, timestamp: Date.now() });
    }
}
