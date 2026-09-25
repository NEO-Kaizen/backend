import type { NextFunction, Request, Response } from "express";
import { authMiddleware } from "./auth.ts";
import Config from "../../configs.ts";
import { getSolicitationMode } from "../../modules/portalConfig/portalConfig.repository.ts";
import type { PortalSolicitationMode } from "../types/systemSettings.ts";

/**
 * Guard do modo de abertura do portal (`system_settings.solicitation_mode`).
 *
 * - `PUBLIC`: libera a rota sem autenticação (comportamento público). Com
 *   `identifyInPublic`, a identidade da sessão (quando houver cookie) é
 *   resolvida em modo "best effort" para que o controller possa escopar a
 *   consulta ao dono — ver `resolveOptionalSession`.
 * - `AUTHENTICATED`: delega ao `authMiddleware`, exigindo sessão JWT válida.
 *   Reaproveita toda a validação já existente (cookie, revogação por
 *   `password_changed_at`, `mustChangePassword` e resolução de perfil).
 *
 * O modo é lido do banco a cada request para que a troca via
 * `PATCH /portal-config/access` tenha efeito imediato. O valor vigente fica em
 * `req.accessMode`, permitindo que os controllers adaptem a regra de negócio
 * (escopo por identidade da sessão) sem reler o banco.
 */
export function requireAccessMode(options: { identifyInPublic?: boolean } = {}) {
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

    if (mode === "AUTHENTICATED") {
      // Delega ao authMiddleware — ele chama `next()` (ou encaminha o erro).
      await authMiddleware(req, res, next);
      return;
    }

    // PUBLIC: a rota permanece pública (o fluxo anônimo não muda), mas quando
    // há cookie de sessão resolvemos `req.user` para que o controller consiga
    // travar o usuário logado que tenta consultar dados de terceiros. É opt-in
    // por rota: sem `identifyInPublic`, `req.user` segue `undefined` em PUBLIC
    // e nenhum controller muda de comportamento.
    if (options.identifyInPublic && req.cookies?.[Config.COOKIE_NAME]) {
      await resolveOptionalSession(req, res);
    }

    next();
  };
}

/**
 * Identificação opcional: roda o `authMiddleware` com um `next` local que
 * absorve o erro (cookie expirado, usuário inativo, troca de senha pendente) —
 * nesses casos `req.user` fica `undefined` e a request segue como anônima,
 * exatamente como antes. Nunca concede acesso; apenas identifica.
 */
async function resolveOptionalSession(req: Request, res: Response): Promise<void> {
  try {
    await authMiddleware(req, res, () => undefined);
  } catch {
    // Identificação é opcional em PUBLIC — segue anônimo.
  }
}
