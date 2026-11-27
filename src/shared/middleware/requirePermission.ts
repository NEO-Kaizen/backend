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
      deniedPermissionKeys: keys,
    });
    return;
  }

  const resource = req.baseUrl.split("/").filter(Boolean).at(-1);
  if (resource !== "queue" && resource !== "reports" && resource !== "prioritization") return;

  const routePath =
    typeof req.route?.path === "string" ? `${req.baseUrl}${req.route.path}` : req.baseUrl;
  await recordAccessDeniedAttempt({
    entityType: resource,
    entityId: routePath || keys.join(", "),
    userId: actorId,
    note,
    ipAddress: req.ip,
    deniedPermissionKeys: keys,
  });
}

function permissionDeniedMessage(keys: readonly PermissionKey[]): string {
  return keys.length === 1
    ? `Acesso restrito à permissão ${keys[0]}`
    : `Acesso restrito às permissões ${keys.join(" ou ")}`;
}

/**
 * Gate grosso de rota (contrato RBAC § 5): sessão válida e ao menos uma das
 * chaves. Não resolve a linha — a Custódia é aplicada pelo serviço de cada
 * domínio, que lê o vínculo da chave em `req.permissions`. Deve ser usado após
 * o `authMiddleware`.
 *
 * Dívida deliberada: este gate lê as concessões
 * do banco a cada requisição com chave e importa o repositório de
 * `modules/auth` (direção shared → modules). Mantido assim na expansão porque
 * só as rotas com gate pagam a leitura.
 *
 * Como cada rota com gate também recebe `req.permissions`, uma evolução futura
 * pode carregar as Permissões uma vez por requisição no `authMiddleware` e
 * remover a dependência do repositório daqui.
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
      next(new AppError(permissionDeniedMessage(requiredKeys), 403));
      return;
    }

    req.permissions = permissions;

    next();
  };
}

export function requirePermission(key: PermissionKey) {
  return requireAnyPermission([key]);
}
/**
 * Gate de chave para rotas que também aceitam a porta pública. Sem sessão não
 * há ator nem chave: a validação fica com o fluxo público do serviço. Com
 * sessão, exige ao menos uma das chaves informadas.
 */
export function requirePermissionIfSession(keys: PermissionKey | readonly PermissionKey[]) {
  const gate = requireAnyPermission(typeof keys === "string" ? [keys] : keys);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next();
      return;
    }

    await gate(req, res, next);
  };
}
