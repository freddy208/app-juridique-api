/* eslint-disable @typescript-eslint/require-await */
// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          throw new Error('REDIS_URL is required');
        }

        return {
          store: redisStore,
          url: redisUrl,
          tls: {}, // TLS requis pour Render
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          ttl: configService.get('REDIS_TTL') || 3600,
          isGlobal: true,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
