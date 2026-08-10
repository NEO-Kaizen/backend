import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { verifyToken, type TokenPayload } from "../services/JwtService.ts";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new AppError("Token not provided", 401));
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new AppError("Token not provided", 401));
    return;
  }

  try {
    const payload: TokenPayload = verifyToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}
