import type { Knex } from "knex";
import db from "../../database/conection.ts";
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

export type StatusAuditAction =
  "request.status_change" | "request.override_status_admin" | "request.triage";

export interface StatusAuditEvent {
  action_type: StatusAuditAction;
  previous_value: string | null;
  new_value: string | null;
  occurred_at: Date;
  audit_id: string;
}

const STATUS_AUDIT_ACTIONS: readonly StatusAuditAction[] = [
  "request.status_change",
  "request.override_status_admin",
  "request.triage",
];

export async function listCompletedRequestsMissingConcludedAt(
  trx?: Knex.Transaction,
): Promise<CompletedRequestCandidate[]> {
  const source = trx ?? db;
  const rows = (await source("requests")
    .where({ status_id: STATUS_IDS.completed })
    .whereNull("concluded_at")
    .orderBy("protocol", "asc")
    .select("request_id", "protocol")) as Record<string, unknown>[];

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
  const rows = (await source("statuses").select("status_id", "name")) as Array<{
    status_id: number;
    name: string;
  }>;

  return new Map(rows.map((row) => [row.name, row.status_id]));
}

/**
 * Eventos que podem mudar o Status, em ordem de acontecimento. O desempate por
 * `audit_id` preserva a ordem de eventos gravados no mesmo instante.
 */
export async function listStatusAuditEvents(
  protocol: string,
  trx?: Knex.Transaction,
): Promise<StatusAuditEvent[]> {
  const source = trx ?? db;
  const rows = (await source("audit_history")
    .where({ entity_type: "request", entity_id: protocol })
    .whereIn("action_type", STATUS_AUDIT_ACTIONS)
    .orderBy("occurred_at", "asc")
    .orderBy("audit_id", "asc")
    .select("action_type", "previous_value", "new_value", "occurred_at", "audit_id")) as Record<
    string,
    unknown
  >[];

  return rows.map((row) => {
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
  });
}

function isStatusAuditAction(value: unknown): value is StatusAuditAction {
  return STATUS_AUDIT_ACTIONS.some((action) => action === value);
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
