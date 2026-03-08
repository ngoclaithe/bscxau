import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService) => {
                const host = configService.get<string>('REDIS_HOST', 'localhost');
                const port = configService.get<number>('REDIS_PORT', 6379);

                // Initialize Redis client
                const redis = new Redis({
                    host,
                    port,
                });

                redis.on('connect', () => {
                    console.log('Redis connected');
                });

                redis.on('error', (err) => {
                    console.error('Redis connection error', err);
                });

                return redis;
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule { }
