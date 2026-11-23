import db from "../../database/conection.ts";
import { recordAudit } from "../audit/auditLogger.ts";
import type { Custody, EffectivePermission, PermissionKey } from "../catalog/permissionCatalog.ts";
import { AppError } from "../errors/AppError.ts";
import { normalizeEmail } from "../utils/normalizeIdentity.ts";
import { hasCustody, type CustodySubject } from "./custody.ts";

/**
 * Decisões de linha compartilhadas pelos domínios de solicitação.
 *
 * O gate de rota (`requirePermission`) só verifica sessão e chave. Cada serviço
 * resolve a linha e aplica a Custódia com este módulo, registrando a Tentativa
 * quando a recusa é por vínculo (contrato RBAC §§ 1.2–1.3 e 5).
 */

/** Ator autenticado com as Permissões efetivas carregadas pelo gate de rota. */
export interface PermissionActor {
  readonly id: number;
  readonly email: string;
  readonly permissions: readonly EffectivePermission[];
}

/** Campos de `req` necessários para montar o ator de domínio. */
export interface RequestActorSource {
  readonly user?: { readonly id: string; readonly email: string };
  readonly permissions?: readonly EffectivePermission[];
}

/** Converte a sessão do Express no ator tipado usado pelos serviços. */
export function permissionActorFromRequest(source: RequestActorSource): PermissionActor {
  if (!source.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const id = Number(source.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  if (!source.permissions) {
    throw new AppError("Permissões não carregadas para esta operação", 403);
  }

  return { id, email: source.user.email, permissions: source.permissions };
}

/** Vínculo concedido ao ator para a chave, ou `undefined` quando não a possui. */
export function custodyFor(
  actor: Pick<PermissionActor, "permissions">,
  key: PermissionKey,
): Custody | undefined {
  return actor.permissions.find((permission) => permission.key === key)?.custody;
}

/** A chave existe e o vínculo alcança a linha? */
function hasPermissionCustody(
  actor: PermissionActor,
  key: PermissionKey,
  subject: CustodySubject,
): boolean {
  const custody = custodyFor(actor, key);
  if (custody === undefined) return false;

  return hasCustody(custody, { userId: actor.id, email: actor.email }, subject);
}

/** Vínculo `assigned`/`all` sobre o Responsável corrente da solicitação. */
export function hasResponsibleCustody(
  actor: PermissionActor,
  key: PermissionKey,
  responsibleUserId: unknown,
): boolean {
  const responsibleId =
    typeof responsibleUserId === "number" ? responsibleUserId : Number(responsibleUserId);

  return hasPermissionCustody(actor, key, {
    responsibleIds: Number.isInteger(responsibleId) && responsibleId > 0 ? [responsibleId] : [],
  });
}

/**
 * Posse do Solicitante: o vínculo direto `requester_user_id` manda; em linhas
 * legadas sem vínculo, compara o e-mail normalizado do snapshot.
 */
export function isRequesterOwner(
  actor: { id: number; email: string },
  request: {
    requesterUserId: number | null | undefined;
    requesterEmail: string | null | undefined;
  },
): boolean {
  const requesterUserId = request.requesterUserId;

  if (typeof requesterUserId === "number") {
    return requesterUserId === actor.id;
  }

  return normalizeEmail(request.requesterEmail ?? "") === normalizeEmail(actor.email);
}

/** Erro uniforme de linha inexistente ou fora da Custódia (anti-enumeração). */
function inaccessibleRequestError(): AppError {
  return new AppError("Solicitação não encontrada", 404, "request_not_found");
}

/** Registra a Tentativa de acesso recusado na trilha de auditoria. */
export async function recordAccessDeniedAttempt(
  protocol: string,
  actorId: number,
  ipAddress: string | undefined,
  detail: string,
  deniedPermissionKeys: readonly PermissionKey[] = [],
): Promise<void> {
  await db.transaction(async (trx) => {
    await recordAudit(trx, {
      entityType: "request",
      entityId: protocol,
      actionType: "request.access_denied",
      userId: actorId,
      previousValue: null,
      newValue: null,
      note: `Access denied: ${detail}`,
      ipAddress,
      changeOrigin: "system",
      deniedPermissionKeys,
    });
  });
}

/** Recusa a linha e interrompe o fluxo com o erro genérico. */
export async function denyRequestAccess(
  protocol: string,
  actorId: number,
  ipAddress: string | undefined,
  detail: string,
  deniedPermissionKeys: readonly PermissionKey[] = [],
): Promise<never> {
  await recordAccessDeniedAttempt(protocol, actorId, ipAddress, detail, deniedPermissionKeys);
  throw inaccessibleRequestError();
}

/**
 * Concede a operação apenas quando a chave alcança o Responsável da linha.
 * Linha ausente e linha fora da Custódia recebem o mesmo 404.
 */
export async function requireResponsibleCustody<T>(
  request: T | null | undefined,
  actor: PermissionActor,
  key: PermissionKey,
  protocol: string,
  ipAddress: string | undefined,
  detail: string,
  responsibleId: (request: T) => number | null | undefined,
): Promise<T> {
  if (request === null || request === undefined) {
    // Recurso inexistente não é recusa de Permissão: nenhuma chave vai para a trilha.
    return denyRequestAccess(protocol, actor.id, ipAddress, detail);
  }

  if (!hasResponsibleCustody(actor, key, responsibleId(request))) {
    return denyRequestAccess(protocol, actor.id, ipAddress, detail, [key]);
  }

  return request;
}
