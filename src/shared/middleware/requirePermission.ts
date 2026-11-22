import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { buildEffectivePermissions, type PermissionKey } from "../catalog/permissionCatalog.ts";
import { listUserPermissions } from "../../modules/auth/auth.repository.ts";
import { recordAccessDeniedAttempt } from "../audit/accessDenied.ts";

async function recordDeniedPermissionAttempt(
  req: Request,
  actorId: number,
  keys: readonly PermissionKey[],
): Promise<void> {
  const protocol = req.params.protocol;
  const note = `Permissão ausente: ${keys.join(", ")}`;
  if (typeof protocol === "string" && protocol.trim() !== "") {
    await recordAccessDeniedAttempt({
      entityType: "request",
      entityId: protocol.trim(),
      userId: actorId,
      note,
      ipAddress: req.ip,
    });
    return;
  }

  const resources = new Set(keys.map((key) => key.split(":")[0]));
  if (resources.size !== 1) return;

  const [resource] = resources;
  if (resource !== "queue" && resource !== "reports" && resource !== "prioritization") return;

  const routePath =
    typeof req.route?.path === "string" ? `${req.baseUrl}${req.route.path}` : req.baseUrl;
  await recordAccessDeniedAttempt({
    entityType: resource,
    entityId: routePath || keys.join(", "),
    userId: actorId,
    note,
    ipAddress: req.ip,
  });
}

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
export function requireAnyPermission(keys: readonly PermissionKey[]) {
  const requiredKeys = [...new Set(keys)];

  if (requiredKeys.length === 0) {
    throw new Error("requireAnyPermission exige ao menos uma chave");
  }

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

    if (!permissions.some((permission) => requiredKeys.includes(permission.key))) {
      await recordDeniedPermissionAttempt(req, Number(req.user.id), requiredKeys);
      const message =
        requiredKeys.length === 1
          ? `Acesso restrito à permissão ${requiredKeys[0]}`
          : `Acesso restrito a uma das permissões ${requiredKeys.join(", ")}`;
      next(new AppError(message, 403));
      return;
    }

    req.permissions = permissions;

    next();
  };
}

export function requirePermission(key: PermissionKey) {
  return requireAnyPermission([key]);
}
