import type { Request } from "express";
import type { EffectivePermission } from "../catalog/permissionCatalog.ts";
import { AppError } from "../errors/AppError.ts";

export interface PermissionActor {
  readonly id: number;
  readonly email: string;
  readonly permissions: readonly EffectivePermission[];
}

export interface NamedPermissionActor extends PermissionActor {
  readonly name: string;
}

function permissionActor(req: Request): PermissionActor {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const id = Number(req.user.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  if (!req.permissions) {
    throw new AppError("Permissões não carregadas para esta operação", 403);
  }

  return {
    id,
    email: req.user.email,
    permissions: req.permissions,
  };
}

export function permissionActorFromRequest(req: Request): PermissionActor {
  return permissionActor(req);
}

export function namedPermissionActorFromRequest(req: Request): NamedPermissionActor {
  const actor = permissionActor(req);
  const name = req.user?.name;
  if (typeof name !== "string") {
    throw new AppError("Token inválido ou expirado", 401);
  }

  return { ...actor, name };
}
