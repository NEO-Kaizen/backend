import type { Knex } from "knex";
import db from "../../database/conection.ts";
import {
  isStatusAuditAction,
  STATUS_AUDIT_ACTIONS,
  type StatusAuditAction,
} from "../../shared/audit/statusAuditActions.ts";
import { STATUS_IDS } from "../../shared/types/status.ts";

/**
 * Leitura/escrita do backfill de `requests.concluded_at` (issue #210).
 *
 * O backfill só olha Solicitações no Status 16 com `concluded_at` nulo e
 * reconstrói a entrada no Status a partir da Auditoria. `updated_at` nunca é
 * lido como fallback.
 */
export interface CompletedRequestCandidate {
  request_id: string;
  protocol: string;
}

export interface StatusAuditEvent {
  action_type: StatusAuditAction;
  previous_value: string | null;
  new_value: string | null;
  occurred_at: Date;
  audit_id: string;
}

export async function listCompletedRequestsMissingConcludedAt(
  trx?: Knex.Transaction,
): Promise<CompletedRequestCandidate[]> {
  const source = trx ?? db;
  const rows: Record<string, unknown>[] = await source("requests")
    .where({ status_id: STATUS_IDS.completed })
    .whereNull("concluded_at")
    .orderBy("protocol", "asc")
    .select("request_id", "protocol");

  return rows.map((row) => {
    const { request_id, protocol } = row;
    if (typeof request_id !== "string" || typeof protocol !== "string") {
      throw new Error("Linha inválida em requests para o backfill.");
    }
    return { request_id, protocol };
  });
}

export async function listStatusIdsByName(trx?: Knex.Transaction): Promise<Map<string, number>> {
  const source = trx ?? db;
  const rows: Record<string, unknown>[] = await source("statuses").select("status_id", "name");

  return new Map(
    rows.map((row) => {
      const { status_id, name } = row;
      if (
        typeof status_id !== "number" ||
        !Number.isInteger(status_id) ||
        typeof name !== "string"
      ) {
        throw new Error("Linha inválida em statuses para o backfill.");
      }
      return [name, status_id];
    }),
  );
}

/**
 * Eventos de Status de um lote de protocolos, agrupados por `entity_id`. Uma
 * única consulta `whereIn` evita uma leitura de Auditoria por candidata. O
 * desempate por `audit_id` preserva a ordem de eventos gravados no mesmo
 * instante.
 */
export async function listStatusAuditEventsForProtocols(
  protocols: readonly string[],
  trx?: Knex.Transaction,
): Promise<Map<string, StatusAuditEvent[]>> {
  if (protocols.length === 0) return new Map();

  const source = trx ?? db;
  const rows: Record<string, unknown>[] = await source("audit_history")
    .where({ entity_type: "request" })
    .whereIn("entity_id", protocols)
    .whereIn("action_type", STATUS_AUDIT_ACTIONS)
    .orderBy("occurred_at", "asc")
    .orderBy("audit_id", "asc")
    .select("entity_id", "action_type", "previous_value", "new_value", "occurred_at", "audit_id");

  const eventsByProtocol = new Map<string, StatusAuditEvent[]>();

  for (const row of rows) {
    const { entity_id } = row;
    if (typeof entity_id !== "string") {
      throw new Error("Linha inválida em audit_history para o backfill.");
    }

    const event = parseStatusAuditEvent(row);
    const events = eventsByProtocol.get(entity_id);

    if (events) {
      events.push(event);
    } else {
      eventsByProtocol.set(entity_id, [event]);
    }
  }

  return eventsByProtocol;
}

function parseStatusAuditEvent(row: Record<string, unknown>): StatusAuditEvent {
  const { action_type, previous_value, new_value, occurred_at, audit_id } = row;

  if (
    !isStatusAuditAction(action_type) ||
    !(previous_value === null || typeof previous_value === "string") ||
    !(new_value === null || typeof new_value === "string") ||
    !(occurred_at instanceof Date) ||
    !(typeof audit_id === "string" || typeof audit_id === "number")
  ) {
    throw new Error("Linha inválida em audit_history para o backfill.");
  }

  return {
    action_type,
    previous_value,
    new_value,
    occurred_at,
    audit_id: String(audit_id),
  };
}

/**
 * Preenche `concluded_at` apenas quando a Solicitação ainda está no Status 16 e
 * a data continua nula. Não toca `updated_at` nem `updated_by`.
 */
export async function setConcludedAtIfMissing(
  trx: Knex.Transaction,
  requestId: string,
  concludedAt: Date,
): Promise<boolean> {
  const updatedRows = await trx("requests")
    .where({ request_id: requestId, status_id: STATUS_IDS.completed })
    .whereNull("concluded_at")
    .update({ concluded_at: concludedAt });

  return updatedRows > 0;
}
