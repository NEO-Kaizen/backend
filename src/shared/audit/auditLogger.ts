import type { Knex } from "knex";
import { AppError } from "../errors/AppError.ts";
import {
  auditCatalog,
  isAuditEntityName,
  isComposedAuditAction,
  type AuditEntityType,
  type ChangeOrigin,
  type ComposedAuditAction,
} from "./auditCatalog.ts";

export interface AuditEntryBase {
  /** Identificador da entidade afetada. */
  entityId: string;
  /** Ator (quem executou). Nulo para aÃ§Ãµes de sistema. */
  userId: number | null;
  /** Valor anterior (texto livre), ex.: is_active antes. */
  previousValue?: string | null;
  newValue?: string | null;
  /** Justificativa interna da transiÃ§Ã£o (nunca o retorno pÃºblico). */
  note?: string | null;
  /** Snapshot do retorno pÃºblico submetido na transiÃ§Ã£o (sÃ³ status pÃºblico). */
  lastTechnicalMessage?: string | null;
  ipAddress?: string | null;
  /** Origem da alteração — restrita aos valores gravados pelo sistema. */
  changeOrigin?: ChangeOrigin | null;
}

/**
 * Evento de auditoria tipado: `actionType` é restrito às ações válidas
 * da `entityType` escolhida (veja `auditCatalog`).
 */
export type AuditEntry<
  E extends AuditEntityType = AuditEntityType,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };

/**
 * Registra um evento de auditoria na `audit_history`, dentro da MESMA
 * transaÃ§Ã£o da operaÃ§Ã£o de negÃ³cio (`trx`).
 *
 * A gravaÃ§Ã£o Ã© atÃ´mica com a operaÃ§Ã£o: se o evento falhar, a exceÃ§Ã£o Ã©
 * propagada e o service realiza rollback â€” a alteraÃ§Ã£o nunca fica sem
 * histÃ³rico (e o contrÃ¡rio tambÃ©m nÃ£o ocorre).
 *
 * Tipos invÃ¡lidos (fora do `auditCatalog`) sÃ£o erro de programaÃ§Ã£o e tambÃ©m
 * lanÃ§am exceÃ§Ã£o para abortar a transaÃ§Ã£o.
 */
export async function recordAudit<E extends AuditEntityType, A extends ComposedAuditAction<E>>(
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
  });
}

export { auditCatalog };
export type { AuditEntityType, ComposedAuditAction } from "./auditCatalog.ts";
