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
 * Além de validar o token, consulta o estado do usuário no banco a cada
 * request para que desativação (`is_active`) e redefinição de senha
 * (`must_change_password`) tenham efeito imediato sobre sessões já emitidas.
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

    if (!userState.is_active) {
      next(new AppError("Usuário inativo", 401));
      return;
    }

    const scope = payload.scope ?? "session";

    if (userState.must_change_password && scope !== "change_password") {
      next(new AppError("Troca de senha obrigatória antes de continuar", 403));
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
