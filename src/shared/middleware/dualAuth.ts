import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { authMiddleware } from "./auth.ts";
import { parseRequesterIdentity } from "../utils/requesterIdentity.ts";

/**
 * Middleware dual leve — sem acesso a DB (arquitetura: middleware não toca
 * repository). Reusado pelo acompanhamento público (`GET /requests/:protocol/
 * tracking`) e pelas pendências do solicitante.
 *
 * - com cookie `session_id`: delega ao `authMiddleware` (valida JWT e
 *   `users.is_active`);
 * - sem cookie: exige o header `X-Requester-Identity: {"name","email"}` e só
 *   faz o parse.
 *
 * A decisão de modo (PUBLIC/AUTHENTICATED) e a validação de ownership ficam
 * no service, mantendo a separação controller/service/repository.
 */
export function requesterDualAuth(req: Request, res: Response, next: NextFunction): void {
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

  // Parse ok — marca a identidade para o service validar ownership contra o DB.
  req.requesterIdentity = identity;
  req.requesterVerifiedProtocol = (req.params.protocol as string | undefined)?.trim() ?? null;
  next();
}
