import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import type { Role } from "../types/role.ts";

/**
 * Autorização por perfil (aceita um ou vários). Deve ser usado após o
 * `authMiddleware`, que popula `req.user` e `req.authScope`.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.authScope !== "session") {
      next(new AppError("Troca de senha obrigatória antes de continuar", 403));
      return;
    }

    if (req.user && roles.includes(req.user.role)) {
      next();
      return;
    }

    const expected = roles.join(" ou ");
    next(new AppError(`Acesso restrito ao perfil ${expected}`, 403));
  };
}