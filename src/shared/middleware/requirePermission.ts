import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { buildEffectivePermissions, type PermissionKey } from "../catalog/permissionCatalog.ts";
import { listUserPermissions } from "../../modules/auth/auth.repository.ts";

/**
 * Gate grosso de rota (contrato RBAC § 5): sessão válida e a chave. Não
 * resolve a linha — a Custódia é aplicada pelo serviço de cada domínio, que
 * lê o vínculo da chave em `req.permissions`. Deve ser usado após o
 * `authMiddleware`, como o `requireRole`.
 *
 * Dívida deliberada (ticket 06 — contração, #167): este gate lê as concessões
 * do banco a cada requisição com chave e importa o repositório de
 * `modules/auth` (direção shared → modules). Mantido assim na expansão porque
 * só as rotas com gate pagam a leitura.
 *
 * No ticket 06, quando o guard por nome morrer e todas as rotas forem por
 * chave: carregar as Permissões uma vez por requisição no `authMiddleware`
 * (anexando `req.permissions`), deixando este middleware puro e sem import de
 * repositório — e então reavaliar o lugar da consulta em `src/shared/access/`.
 * Remover este bloco junto com a dívida.
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
