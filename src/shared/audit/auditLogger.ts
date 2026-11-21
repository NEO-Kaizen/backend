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

const requestStatusTransitionActions = new Set([
  "request.status_change",
  "request.override_status_admin",
  "request.triage",
]);

function extractStatusName(value: string | null | undefined): string | null {
  if (value == null) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "string") return parsed;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      typeof parsed.status === "string"
    ) {
      return parsed.status;
    }
    return null;
  } catch {
    return value;
  }
}

async function findStatusIdByName(
  trx: Knex.Transaction,
  statusName: string | null,
): Promise<number | null> {
  if (!statusName) return null;
  const row = await trx("statuses")
    .where({ name: statusName })
    .first<{ status_id: number }>("status_id");
  return row?.status_id ?? null;
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
 * Tipos inválidos (fora do `auditCatalog`) são erro de programação e também
 * lançam exceção para abortar a transação.
 *
 * Retorna o `audit_id` gerado — chave natural para correlacionar o evento de
 * negócio com outras projeções gravadas na mesma transação (ex.: Notificação).
 */
export async function recordAudit<E extends AuditEntityType, A extends ComposedAuditAction<E>>(
  trx: Knex.Transaction,
  entry: AuditEntryBase & { entityType: E; actionType: A },
): Promise<string> {
  if (
    !isAuditEntityName(entry.entityType) ||
    !isComposedAuditAction(entry.entityType, entry.actionType)
  ) {
    throw new AppError(
      `Evento de auditoria desconhecido: "${entry.entityType}" / "${entry.actionType}"`,
      500,
    );
  }

  const isStatusTransition =
    entry.entityType === "request" && requestStatusTransitionActions.has(entry.actionType);
  const [statusId, previousStatusId] = isStatusTransition
    ? await Promise.all([
        findStatusIdByName(trx, extractStatusName(entry.newValue)),
        findStatusIdByName(trx, extractStatusName(entry.previousValue)),
      ])
    : [null, null];

  if (isStatusTransition && statusId === null) {
    throw new AppError("Status de destino da transição não encontrado.", 500);
  }

  const rows = await trx("audit_history")
    .insert({
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
      status_id: statusId,
      previous_status_id: previousStatusId,
      transaction_id: trx.raw("pg_current_xact_id()"),
    })
    .returning("audit_id");

  const row = rows[0] as { audit_id: string | number } | undefined;
  if (!row) {
    throw new AppError("Não foi possível registrar o evento de auditoria.", 500);
  }

  return String(row.audit_id);
}

export { auditCatalog };
export type { AuditEntityType, ComposedAuditAction } from "./auditCatalog.ts";
