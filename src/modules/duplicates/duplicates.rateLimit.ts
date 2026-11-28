import { AppError } from "../../shared/errors/AppError.ts";
import { createRateLimiter } from "../../shared/middleware/rateLimit.ts";
import type { NextFunction, Request, Response } from "express";

/**
 * Rate limit em memória das rotas públicas de duplicidade (#209 e #211):
 * 30 requisições/10 s **e** 120/min por IP, com `429` genérico. Cada rota tem
 * seu próprio par de limitadores, para uma não consumir o orçamento da outra.
 */
const RATE_LIMIT_MESSAGE = "Muitas requisições. Tente novamente em instantes.";

function createDuplicateRateLimit(): (req: Request, res: Response, next: NextFunction) => void {
  const perTenSeconds = createRateLimiter({ windowMs: 10_000, limit: 30 });
  const perMinute = createRateLimiter({ windowMs: 60_000, limit: 120 });

  return (req: Request, _res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

    if (!perTenSeconds.checkRateLimit(ip) || !perMinute.checkRateLimit(ip)) {
      next(new AppError(RATE_LIMIT_MESSAGE, 429));
      return;
    }

    next();
  };
}

export const duplicateCheckRateLimit = createDuplicateRateLimit();
export const duplicateTrackingRateLimit = createDuplicateRateLimit();
