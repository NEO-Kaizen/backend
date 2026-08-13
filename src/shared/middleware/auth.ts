import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { verifyToken, type TokenPayload } from "../utils/jwtUtil.ts";

const COOKIE_NAME = process.env.COOKIE_NAME ?? "session_id";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    next(new AppError("Token não fornecido", 401));
    return;
  }

  try {
    const payload: TokenPayload = verifyToken(token);

    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role
    };

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