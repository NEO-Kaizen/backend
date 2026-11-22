import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import type { PermissionKey } from "../catalog/permissionCatalog.ts";
import { loadEffectivePermissions } from "../access/permissions.ts";

function permissionDeniedMessage(keys: readonly PermissionKey[]): string {
  return keys.length === 1
    ? `Acesso restrito à permissão ${keys[0]}`
    : `Acesso restrito às permissões ${keys.join(" ou ")}`;
}

/**
 * Gate grosso de rota (contrato RBAC § 5): sessão válida e ao menos uma das
 * chaves. Não resolve a linha — a Custódia é aplicada pelo serviço de cada
 * domínio, que lê o vínculo da chave em `req.permissions`. Deve ser usado após
 * o `authMiddleware`, como o `requireRole`.
 *
 * Dívida deliberada (ticket 06 — contração, #167): este gate lê as concessões
 * do banco a cada requisição com chave. No ticket 06, quando o guard por nome
 * morrer e todas as rotas forem por chave: carregar as Permissões uma vez por
 * requisição no `authMiddleware` (anexando `req.permissions`), deixando este
 * middleware puro e sem I/O.
 */
export function requireAnyPermission(keys: readonly PermissionKey[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.authScope !== "session") {
      next(new AppError("Troca de senha obrigatória antes de continuar", 403));
      return;
    }

    if (!req.user) {
      next(new AppError("Token inválido ou expirado", 401));
      return;
    }

    const permissions = await loadEffectivePermissions(Number(req.user.id));

    if (!permissions.some((permission) => keys.includes(permission.key))) {
      next(new AppError(permissionDeniedMessage(keys), 403));
      return;
    }

    req.permissions = permissions;

    next();
  };
}

export function requirePermission(key: PermissionKey) {
  return requireAnyPermission([key]);
}
