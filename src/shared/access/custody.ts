import type { Custody, EffectivePermission, PermissionKey } from "../catalog/permissionCatalog.ts";

/**
 * Resolução de Custódia — predicado puro compartilhado pelos serviços.
 *
 * O gate de rota (`requirePermission`) é grosso: só sessão válida e a chave.
 * A linha é resolvida aqui, no serviço de cada domínio, que passa apenas as
 * fontes que valem para a linha (contrato RBAC § 5).
 */

/** Ator autenticado para as decisões de linha. */
export interface CustodyActor {
  readonly userId: number;
  readonly email: string;
}

/**
 * Fontes do vínculo com a linha: `responsibleIds` cobre o Responsável da
 * solicitação e, nas chaves de mapeamento, também o do mapeamento corrente;
 * `requesterEmail` cobre a posse.
 */
export interface CustodySubject {
  readonly responsibleIds?: readonly number[];
  readonly requesterEmail?: string | null;
}

export type ResponsibleScope =
  { readonly kind: "all" } | { readonly kind: "assigned"; readonly userId: number };

/**
 * O vínculo concede acesso à linha? `all` dispensa filtro; `assigned` compara
 * o Responsável; `own` compara o e-mail do Solicitante com o da conta. Chave
 * `global` não tem vínculo de linha e sempre passa.
 */
export function hasCustody(
  custody: Custody,
  actor: CustodyActor,
  subject: CustodySubject,
): boolean {
  switch (custody) {
    case "global":
    case "all":
      return true;
    case "assigned":
      return (subject.responsibleIds ?? []).includes(actor.userId);
    case "own":
      return (
        typeof subject.requesterEmail === "string" &&
        subject.requesterEmail.trim().toLowerCase() === actor.email.trim().toLowerCase()
      );
  }
}

/** Vínculo da chave na sessão do ator; `undefined` quando a chave não existe. */
export function custodyFor(
  permissions: readonly EffectivePermission[],
  key: PermissionKey,
): Custody | undefined {
  return permissions.find((permission) => permission.key === key)?.custody;
}

/**
 * Mantém a origem de auditoria administrativa sem comparar nomes de Perfil.
 * Os perfis base Administrador e Admin Root têm `request:status_override` global.
 */
export function hasAdministrativeAuditOrigin(permissions: readonly EffectivePermission[]): boolean {
  return custodyFor(permissions, "request:status_override") === "global";
}

/**
 * Escopo de linha das chaves de Fila (`queue:read`, `queue:export`).
 *
 * Devolve um escopo explícito: `all` ou `assigned` com o user id. Ausência de
 * chave, vínculo inválido ou id inválido retorna `undefined` para o service
 * negar o acesso, em vez de mascarar a inconsistência como uma lista vazia.
 */
export function resolveResponsibleScope(
  permissions: readonly EffectivePermission[],
  key: PermissionKey,
  actorId: number,
): ResponsibleScope | undefined {
  const custody = custodyFor(permissions, key);

  if (custody === "all") return { kind: "all" };
  if (custody !== "assigned") return undefined;

  return Number.isInteger(actorId) && actorId > 0
    ? { kind: "assigned", userId: actorId }
    : undefined;
}
