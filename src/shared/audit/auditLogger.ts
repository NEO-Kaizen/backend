import type { Knex } from "knex";
import { AppError } from "../errors/AppError.ts";
import type { PermissionKey } from "../catalog/permissionCatalog.ts";
import {
  auditCatalog,
  isAuditEntityName,
  isComposedAuditAction,
  type AuditEntityName,
  type ComposedAuditAction,
} from "./auditCatalog.ts";

export interface AuditEntryBase {
  /** Identificador da entidade afetada. */
  entityId: string;
  /** Ator (quem executou). Nulo para ações de sistema. */
  userId: number | null;
  /** Valor anterior (texto livre), ex.: is_active antes. */
  previousValue?: string | null;
  newValue?: string | null;
  /** Justificativa interna da transição (nunca o retorno público). */
  note?: string | null;
  /** Snapshot do retorno público submetido na transição (só status público). */
  lastTechnicalMessage?: string | null;
  ipAddress?: string | null;
  changeOrigin?: string | null;
  /**
   * Chaves de Permissão avaliadas na recusa (`*.access_denied`): ausentes no
   * gate ou presentes sem o vínculo suficiente (Custódia ou Posse) na linha.
   * Vazio nas demais ações: a chave que **autorizou** não é registrada.
   */
  deniedPermissionKeys?: readonly PermissionKey[];
}

/**
 * Evento de auditoria tipado: `actionType` é restrito às ações válidas
 * da `entityType` escolhida (veja `auditCatalog`).
 */
export type AuditEntry<
  E extends AuditEntityName = AuditEntityName,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };

interface ActorProfileRow {
  profile_id: number;
  name: string;
}

/** Guard de linha do banco: `recordAudit` não confia em shape sem validar. */
function isActorProfileRow(value: unknown): value is ActorProfileRow {
  if (typeof value !== "object" || value === null) return false;
  if (!("profile_id" in value) || !("name" in value)) return false;
  return Number.isInteger(value.profile_id) && typeof value.name === "string";
}

/**
 * Snapshot do Perfil do ator no momento do evento. O nome fica congelado; o
 * ID é a identidade estável. Ações de sistema (`userId` nulo) não têm Perfil.
 */
async function resolveActorProfile(
  trx: Knex.Transaction,
  userId: number | null,
): Promise<ActorProfileRow | null> {
  if (userId === null) {
    return null;
  }

  const row: unknown = await trx("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("u.user_id", userId)
    .first("p.profile_id", "p.name");

  return isActorProfileRow(row) ? row : null;
}

/**
 * Registra um evento de auditoria na `audit_history`, dentro da MESMA
 * transação da operação de negócio (`trx`).
 *
 * A gravação é atômica com a operação: se o evento falhar, a exceção é
 * propagada e o service realiza rollback — a alteração nunca fica sem
 * histórico (e o contrário também não ocorre).
 *
 * Tipos inválidos (fora do `auditCatalog`) são erro de programação e também
 * lançam exceção para abortar a transação.
 */
export async function recordAudit<E extends AuditEntityName, A extends ComposedAuditAction<E>>(
  trx: Knex.Transaction,
  entry: AuditEntryBase & { entityType: E; actionType: A },
): Promise<void> {
  if (
    !isAuditEntityName(entry.entityType) ||
    !isComposedAuditAction(entry.entityType, entry.actionType)
  ) {
    throw new AppError(
      `Evento de auditoria desconhecido: "${entry.entityType}" / "${entry.actionType}"`,
      500,
    );
  }

  const actorProfile = await resolveActorProfile(trx, entry.userId);

  await trx("audit_history").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action_type: entry.actionType,
    user_id: entry.userId,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
    note: entry.note ?? null,
    last_technical_message: entry.lastTechnicalMessage ?? null,
    ip_address: entry.ipAddress ?? null,
    change_origin: entry.changeOrigin ?? null,
    actor_profile_id: actorProfile?.profile_id ?? null,
    actor_profile_name: actorProfile?.name ?? null,
    denied_permission_keys: entry.deniedPermissionKeys ? [...entry.deniedPermissionKeys] : [],
  });
}

export { auditCatalog };
export type { AuditEntityName, ComposedAuditAction } from "./auditCatalog.ts";
