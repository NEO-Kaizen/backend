import db from "../../database/conection.ts";
import type { AuditHistoryQuery } from "../DTOs/auditHistory/AuditHistory.dto.ts";

interface AuditSummaryRow {
  audit_id: number;
  entity_type: string;
  action_type: string;
  user_id: number | null;
  actor_name: string | null;
  occurred_at: Date;
}

interface AuditCountRow {
  total: number | string;
}

interface AuditHistoryDetailRow {
  audit_id: number | string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  user_id: number | string | null;
  actor_name: string | null;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  change_origin: string | null;
  occurred_at: Date | string;
}

export async function listAuditHistory(
  filters: AuditHistoryQuery,
): Promise<{ items: AuditSummaryRow[]; total: number }> {
  const query = db("audit_history as a")
    .leftJoin("users as u", "u.user_id", "a.user_id")
    .select(
      "a.audit_id",
      "a.entity_type",
      "a.action_type",
      "a.user_id",
      "u.full_name as actor_name",
      "a.occurred_at",
    )
    .orderBy("a.occurred_at", "desc");

  if (filters.entityType) {
    query.where("a.entity_type", filters.entityType);
  }

  const totalRow = await db("audit_history")
    .where((builder) => {
      if (filters.entityType) {
        builder.where("entity_type", filters.entityType);
      }
    })
    .first<AuditCountRow>(db.raw("COUNT(*)::int AS total"));

  const total = Number(totalRow?.total ?? 0);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;
  const items = (await query.limit(limit).offset(offset)) as AuditSummaryRow[];

  return { items, total };
}

export async function findAuditHistoryById(
  auditId: number,
): Promise<AuditHistoryDetailRow | undefined> {
  return db("audit_history as a")
    .leftJoin("users as u", "u.user_id", "a.user_id")
    .select(
      "a.audit_id",
      "a.entity_type",
      "a.entity_id",
      "a.action_type",
      "a.user_id",
      "u.full_name as actor_name",
      "a.previous_value",
      "a.new_value",
      "a.note",
      "a.change_origin",
      "a.occurred_at",
    )
    .where("a.audit_id", auditId)
    .first<AuditHistoryDetailRow>();
}

/**
 * Timeline de auditoria de uma solicitação (alias `GET /audit-logs/:protocol`,
 * issue #124): registros `request.*` cujo `entity_id` é o protocolo, do mais
 * recente ao mais antigo.
 */
export async function listAuditHistoryByProtocol(
  protocol: string,
): Promise<AuditHistoryDetailRow[]> {
  return db("audit_history as a")
    .leftJoin("users as u", "u.user_id", "a.user_id")
    .select(
      "a.audit_id",
      "a.entity_type",
      "a.entity_id",
      "a.action_type",
      "a.user_id",
      "u.full_name as actor_name",
      "a.previous_value",
      "a.new_value",
      "a.note",
      "a.change_origin",
      "a.occurred_at",
    )
    .where("a.entity_type", "request")
    .andWhere("a.entity_id", protocol)
    .orderBy("a.occurred_at", "desc")
    .orderBy("a.audit_id", "desc")
    .then((rows) => rows as AuditHistoryDetailRow[]);
}
