import type { NextFunction, Request, Response } from "express";
import { authMiddleware } from "./auth.ts";
import Config from "../../configs.ts";
import { getSolicitationMode } from "../../modules/portalConfig/portalConfig.repository.ts";
import type { PortalSolicitationMode } from "../types/systemSettings.ts";

const COOKIE_NAME = Config.COOKIE_NAME;

/**
 * Guard do modo de abertura do portal (`system_settings.solicitation_mode`).
 *
 * - `PUBLIC`: libera a rota sem sessão. Se houver cookie de sessão, autentica
 *   e usa a porta autenticada — a sessão decide qual porta o ator usa (RBAC
 *   §1.6), inclusive para o escopo por Posse.
 * - `AUTHENTICATED`: delega ao `authMiddleware`, exigindo sessão JWT válida.
 *   Reaproveita toda a validação já existente (cookie, revogação por
 *   `password_changed_at`, `mustChangePassword` e resolução de perfil).
 *
 * O modo é lido do banco a cada request para que a troca via
 * `PATCH /portal-config/access` tenha efeito imediato. O valor vigente fica em
 * `req.accessMode`, permitindo que os controllers adaptem a regra de negócio
 * (escopo por identidade da sessão) sem reler o banco.
 */
export function requireAccessMode() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let mode: PortalSolicitationMode;

    // O `try` cobre apenas a leitura: `next()` fica fora para não capturar
    // erros de middlewares a jusante (evita `next(error)` duplicado).
    try {
      mode = await getSolicitationMode();
    } catch (error) {
      next(error);
      return;
    }

    req.accessMode = mode;

    const hasSessionCookie = Boolean(req.cookies?.[COOKIE_NAME]);

    if (mode === "AUTHENTICATED" || hasSessionCookie) {
      // Delega ao authMiddleware — ele chama `next()` (ou encaminha o erro).
      await authMiddleware(req, res, next);
      return;
    }

    next();
  };
}
