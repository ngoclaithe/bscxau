import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

    async get(key: string): Promise<string | null> {
        return await this.redis.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.redis.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    getClient(): Redis {
        return this.redis;
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.redis.exists(key);
        return result === 1;
    }

    async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            await this.set(key, stringValue, ttlSeconds);
        } catch (error) {
            console.error('Redis setJson error:', error);
            throw error;
        }
    }

    async getJson<T>(key: string): Promise<T | null> {
        try {
            const value = await this.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            console.error('Redis getJson error:', error);
            return null;
        }
    }
}
