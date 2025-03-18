import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import { config } from '../config/redis';

export class RateLimitService {
  private limiter: RateLimiterRedis;

  constructor() {
    const redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      enableOfflineQueue: false,
    });

    this.limiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'login_attempt',
      points: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      duration: Number(process.env.LOGIN_TIMEOUT) || 900, // 15 minutes
      blockDuration: Number(process.env.LOCKOUT_DURATION) || 86400, // 24 hours
    });
  }

  /**
   * Check if the given identifier has exceeded rate limits
   * @param identifier IP address or user identifier
   * @returns Object containing blocked status and wait time if blocked
   */
  async checkRateLimit(identifier: string): Promise<{
    blocked: boolean;
    waitTime?: number;
    remainingPoints?: number;
  }> {
    try {
      const rateLimitRes = await this.limiter.consume(identifier);
      return {
        blocked: false,
        remainingPoints: rateLimitRes.remainingPoints,
      };
    } catch (error) {
      const waitTime = Math.ceil(error.msBeforeNext / 1000);
      return {
        blocked: true,
        waitTime,
        remainingPoints: 0,
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   * @param identifier IP address or user identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    await this.limiter.delete(identifier);
  }

  /**
   * Block an identifier immediately
   * @param identifier IP address or user identifier
   */
  async blockNow(identifier: string): Promise<void> {
    await this.limiter.penalty(identifier, this.limiter.points);
  }
}
