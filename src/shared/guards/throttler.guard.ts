import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { Logger } from '@nestjs/common/services/logger.service';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { Request, Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private logger = new Logger(CustomThrottlerGuard.name);
  protected getTracker(request: Request): string {
    this.logger.log(`Getting tracker for request: ${request.url}`);

    const firebaseCookie = request.cookies?.firebase_session as string | null;
    const customToken = request.cookies?.custom_session as string | null;
    if (!firebaseCookie && !customToken) return `ip:${request.ip || 'unknown'}`;

    return `user:${request.ip}`;
  }

  protected async handleRequest(context: ExecutionContext): Promise<boolean> {
    const { req, res } = this.getRequestResponse(context);

    const tracker = this.getTracker(req as Request);

    const isAuthenticated = tracker.split(':')[0] === 'user';

    // Different rate limits for authenticated and unauthenticated users
    const limit = isAuthenticated ? 10 : 5;
    const ttl = 60;

    const key = this.generateKey(context, tracker);
    const current = (await this.storageService.getRecord(key)) ?? [];

    const now = Date.now();
    const windowStart = now - ttl * 1000;
    const recentHits = current.filter((timestamp) => timestamp > windowStart);

    if (recentHits.length >= limit) {
      this.setRateLimitHeaders(res as Response, limit, 0, ttl, now);
      this.throwThrottlingException(context);
    }

    recentHits.push(now);
    await this.storageService.addRecord(key, ttl);

    this.setRateLimitHeaders(
      res as Response,
      limit,
      limit - recentHits.length,
      ttl,
      now,
    );

    return true;
  }

  private setRateLimitHeaders(
    res: Response,
    limit: number,
    remaining: number,
    ttl: number,
    now: number,
  ) {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(now / 1000) + ttl);
  }
}
