import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { authMiddleware } from "../../shared/middleware/auth.ts";
import { parseRequesterIdentity } from "./pendingItems.utils.ts";

/**
 * Middleware dual leve — sem acesso a DB (arquitetura: middleware não toca repository).
 * - se houver cookie `session_id`, delega ao `authMiddleware` (valida JWT + users.is_active).
 * - senão exige header `X-Requester-Identity: {"name","email"}` e só faz parse.
 * Validação de ownership (normalize + protocol + 401 genérico) fica no service
 * (`pendingItems.service.ts` via `findRequestByProtocol`), mantendo separação
 * controller/service/repository.
 */
export function pendingDualAuth(req: Request, res: Response, next: NextFunction): void {
  const hasCookie = !!req.cookies?.session_id;
  if (hasCookie) {
    authMiddleware(req, res, next);
    return;
  }

  const identity = parseRequesterIdentity(
    req.headers["x-requester-identity"] as string | undefined,
  );
  if (!identity) {
    next(new AppError("Valide seus dados para acompanhar esta solicitação.", 401));
    return;
  }

  // parse ok — marca para o controller/service validar ownership contra DB
  req.requesterIdentity = identity;
  req.requesterVerifiedProtocol = (req.params.protocol as string | undefined)?.trim() ?? null;
  next();
}
