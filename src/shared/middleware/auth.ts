import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { verifyToken, type TokenPayload } from "../utils/jwtUtil.ts";
import Config from "../../configs.ts";
import { getAuthState } from "../../modules/auth/auth.repository.ts";
import { resolveRole } from "../utils/roleUtils.ts";

const { JsonWebTokenError, NotBeforeError, TokenExpiredError } = jwt;
const COOKIE_NAME = Config.COOKIE_NAME;

/**
 * Autenticação por cookie JWT (HttpOnly).
 *
 * Além de validar o token, consulta o estado do usuário e do perfil no banco
 * a cada request para que desativação (`users.is_active`, `profiles.is_active`)
 * e redefinição de senha (`must_change_password`) tenham efeito imediato sobre
 * sessões já emitidas — sem distinguir o motivo (anti-enumeração).
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    next(new AppError("Token não fornecido", 401));
    return;
  }

  try {
    const payload: TokenPayload = verifyToken(token);

    const userState = await getAuthState(Number(payload.id));

    if (!userState) {
      next(new AppError("Token inválido ou expirado", 401));
      return;
    }

    if (!userState.is_active || !userState.profile_is_active) {
      next(new AppError("Token inválido ou expirado", 401));
      return;
    }

    const scope = payload.scope ?? "session";

    // Quem está com a senha pendente de troca só pode acessar a PRÓPRIA
    // rota de troca (`PUT /auth/change-password`) e a de consulta de sessão
    // (`GET /auth/me`, que expõe `mustChangePassword` para o frontend exibir
    // a tela de troca). Qualquer outra rota — inclusive administrativas — é
    // bloqueada até que a troca seja concluída.
    const isPendingChangeAllowedRoute =
      req.originalUrl.split("?")[0] === "/auth/change-password" ||
      req.originalUrl.split("?")[0] === "/auth/me";

    if (userState.must_change_password && !isPendingChangeAllowedRoute) {
      next(new AppError("Troca de senha obrigatória antes de continuar", 403));
      return;
    }

    // Revogação permanente: toda troca/redefinição de senha avança
    // users.password_changed_at; tokens emitidos antes desse momento têm o
    // valor antigo embutido e deixam de ser aceitos.
    const tokenPasswordChangedAt = Number(payload.password_changed_at);
    const currentPasswordChangedAt = userState.password_changed_at.getTime();

    if (tokenPasswordChangedAt !== currentPasswordChangedAt) {
      next(new AppError("Sua sessão foi revogada. Faça login novamente.", 401));
      return;
    }

    // O papel vem do banco a cada request — nunca do JWT. Assim, uma troca
    // de perfil passa a valer imediatamente em todas as rotas protegidas por
    // `requireRole`, mesmo com o cookie antigo ainda válido.
    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: resolveRole(userState.profile_name),
    };

    req.authScope = scope;

    next();
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError ||
      error instanceof NotBeforeError
    ) {
      next(new AppError("Token inválido ou expirado", 401));
      return;
    }
    next(error);
  }
}
