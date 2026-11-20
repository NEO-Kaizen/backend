import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { buildEffectivePermissions, type PermissionKey } from "../catalog/permissionCatalog.ts";
import { listUserPermissions } from "../../modules/auth/auth.repository.ts";

/**
 * Gate grosso de rota (contrato RBAC § 5): sessão válida e a chave. Não
 * resolve a linha — a Custódia é aplicada pelo serviço de cada domínio, que
 * lê o vínculo da chave em `req.permissions`. Deve ser usado após o
 * `authMiddleware`, como o `requireRole`.
 */
export function requirePermission(key: PermissionKey) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.authScope !== "session") {
      next(new AppError("Troca de senha obrigatória antes de continuar", 403));
      return;
    }

    if (!req.user) {
      next(new AppError("Token inválido ou expirado", 401));
      return;
    }

    const grants = await listUserPermissions(Number(req.user.id));
    const permissions = buildEffectivePermissions(grants);

    if (!permissions.some((permission) => permission.key === key)) {
      next(new AppError(`Acesso restrito à permissão ${key}`, 403));
      return;
    }

    req.permissions = permissions;

    next();
  };
}
