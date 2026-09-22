import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

/**
 * Slot lock: Redis preferred; Postgres advisory lock fallback when Redis down.
 */
@Injectable()
export class SlotLockService implements OnModuleDestroy {
  private readonly logger = new Logger(SlotLockService.name);
  private redis: Redis | null = null;
  private redisReady = false;
  private warnedFallback = false;

  constructor(private readonly prisma: PrismaService) {
    void this.initRedis();
  }

  private async initRedis() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL unset — using Postgres advisory locks');
      return;
    }
    try {
      const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 800,
        retryStrategy: () => null, // do not reconnect loop
      });
      client.on('error', () => {
        // swallow — we fall back to Postgres
      });
      await client.connect();
      await client.ping();
      this.redis = client;
      this.redisReady = true;
      this.logger.log('Redis connected for slot locks');
    } catch (err) {
      this.logger.warn(
        `Redis unavailable (${(err as Error).message}) — Postgres advisory locks`,
      );
      if (this.redis) {
        await this.redis.quit().catch(() => undefined);
      }
      this.redis = null;
      this.redisReady = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }

  /**
   * Run work while holding an exclusive lock for court+time window.
   * ttlSeconds used for Redis lock expiry.
   */
  async withSlotLock<T>(
    courtId: string,
    startsAtIso: string,
    ttlSeconds: number,
    work: () => Promise<T>,
  ): Promise<T> {
    const key = `ludi:slot:${courtId}:${startsAtIso}`;
    if (this.redis && this.redisReady) {
      const token = `${Date.now()}-${Math.random()}`;
      try {
        const acquired = await this.redis.set(
          key,
          token,
          'EX',
          ttlSeconds,
          'NX',
        );
        if (acquired !== 'OK') {
          throw new Error('SLOT_LOCKED');
        }
        try {
          return await work();
        } finally {
          const cur = await this.redis.get(key);
          if (cur === token) await this.redis.del(key);
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'SLOT_LOCKED') throw err;
        this.fallbackWarn();
        // fall through to Postgres
      }
    } else {
      this.fallbackWarn();
    }

    const lockId = this.toAdvisoryKey(key);
    await this.prisma.$executeRawUnsafe(`SELECT pg_advisory_lock(${lockId})`);
    try {
      return await work();
    } finally {
      await this.prisma.$executeRawUnsafe(
        `SELECT pg_advisory_unlock(${lockId})`,
      );
    }
  }

  private fallbackWarn() {
    if (!this.warnedFallback) {
      this.logger.debug('Using Postgres advisory lock for slot');
      this.warnedFallback = true;
    }
  }

  private toAdvisoryKey(key: string): number {
    const hex = createHash('sha256').update(key).digest('hex').slice(0, 15);
    return Number.parseInt(hex, 16) % 9007199254740991;
  }
}
