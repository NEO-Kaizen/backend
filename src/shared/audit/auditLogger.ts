import type { Knex } from "knex";
import { AppError } from "../errors/AppError.ts";
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
}

/**
 * Evento de auditoria tipado: `actionType` é restrito às ações válidas
 * da `entityType` escolhida (veja `auditCatalog`).
 */
export type AuditEntry<
  E extends AuditEntityName = AuditEntityName,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };

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
export type { AuditEntityName, ComposedAuditAction } from "./auditCatalog.ts";
