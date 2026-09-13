import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { verifyToken, type TokenPayload } from "../utils/jwtUtil.ts";
import Config from "../../configs.ts";
import { getAuthState } from "../../modules/auth/auth.repository.ts";

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
    // rota de troca (`PUT /auth/change-password`). Qualquer outra rota —
    // inclusive administrativas — é bloqueada até que a troca seja
    // concluída.
    const isPasswordChangeRoute = req.originalUrl.split("?")[0] === "/auth/change-password";

    if (userState.must_change_password && !isPasswordChangeRoute) {
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

    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
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
