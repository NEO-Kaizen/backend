import { AppError } from "../../shared/errors/AppError.ts";
import { createRateLimiter } from "../../shared/middleware/rateLimit.ts";
import type { NextFunction, Request, Response } from "express";

/**
 * Rate limit em memória da rota pública de duplicidade (issue #209):
 * 30 requisições/10 s E 120/min por IP. O `429` é genérico para não revelar
 * detalhes do limitador.
 */
const perTenSeconds = createRateLimiter({ windowMs: 10_000, limit: 30 });
const perMinute = createRateLimiter({ windowMs: 60_000, limit: 120 });

const RATE_LIMIT_MESSAGE = "Muitas requisições. Tente novamente em instantes.";

export function duplicateCheckRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

  if (!perTenSeconds.checkRateLimit(ip) || !perMinute.checkRateLimit(ip)) {
    next(new AppError(RATE_LIMIT_MESSAGE, 429));
    return;
  }

  next();
}
