import db from "../../database/conection.ts";
import type { AuditHistoryQuery } from "../DTOs/auditHistory/AuditHistory.dto.ts";

interface AuditSummaryRow {
  audit_id: number;
  entity_type: string;
  action_type: string;
  user_id: number | null;
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
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  change_origin: string | null;
  occurred_at: Date | string;
}

export async function listAuditHistory(
  filters: AuditHistoryQuery,
): Promise<{ items: AuditSummaryRow[]; total: number }> {
  const query = db("audit_history")
    .select("audit_id", "entity_type", "action_type", "user_id", "occurred_at")
    .orderBy("occurred_at", "desc");

  if (filters.entityType) {
    query.where("entity_type", filters.entityType);
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
  return db("audit_history").where("audit_id", auditId).first<AuditHistoryDetailRow>();
}
