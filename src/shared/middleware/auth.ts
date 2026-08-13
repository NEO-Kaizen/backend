import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { verifyToken, type TokenPayload } from "../utils/jwtUtil.ts";
import Config from "../../configs.ts";

const { JsonWebTokenError, NotBeforeError, TokenExpiredError } = jwt;
const COOKIE_NAME = Config.COOKIE_NAME;

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
      role: payload.role,
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
