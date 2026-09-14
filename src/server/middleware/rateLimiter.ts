import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

export function createRateLimiter(windowMs: number, maxRequests: number, message = 'Too many requests. Please slow down.') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = store.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterMs: record.resetTime - now,
      });
      return;
    }

    next();
  };
}

export const standardRateLimiter = createRateLimiter(60 * 1000, 120); // 120 reqs / min
export const authRateLimiter = createRateLimiter(60 * 1000, 15, 'Too many authentication attempts. Please wait 1 minute.');
export const aiRateLimiter = createRateLimiter(60 * 1000, 20, 'Dark Falcon AI rate limit reached. Please wait before asking more questions.');
