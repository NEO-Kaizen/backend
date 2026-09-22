import { AppError } from "../../shared/errors/AppError.ts";
import type {
  AuditHistoryQuery,
  AuditHistorySummary,
  AuditHistoryDetail,
  AuditHistoryListResponse,
} from "../DTOs/auditHistory/AuditHistory.dto.ts";
import * as repository from "./auditHistory.repository.ts";
import { auditCatalog, type AuditEntityName } from "../../shared/audit/auditCatalog.ts";

const entityLabels: Record<AuditEntityName, string> = Object.fromEntries(
  Object.entries(auditCatalog).map(([key, val]) => [key, val.label]),
) as Record<AuditEntityName, string>;

export async function listAuditHistoryLogs(
  filters: AuditHistoryQuery,
): Promise<AuditHistoryListResponse> {
  const { items, total } = await repository.listAuditHistory(filters);

  const formatted: AuditHistorySummary[] = items.map((row) => ({
    audit_id: Number(row.audit_id),
    entity_type: row.entity_type,
    entity_type_label: entityLabels[row.entity_type as AuditEntityName] ?? row.entity_type,
    action_type: row.action_type,
    user_id: row.user_id,
    occurred_at: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
  }));

  return {
    items: formatted,
    total,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  };
}

export async function getAuditHistoryDetail(auditId: number): Promise<AuditHistoryDetail> {
  const row = await repository.findAuditHistoryById(auditId);
  if (!row) {
    throw new AppError("Log não encontrado", 404);
  }
  const occurredAt =
    row.occurred_at instanceof Date ? row.occurred_at.toISOString() : String(row.occurred_at);
  return {
    audit_id: Number(row.audit_id),
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action_type: row.action_type,
    user_id: row.user_id === null ? null : Number(row.user_id),
    previous_value: row.previous_value,
    new_value: row.new_value,
    note: row.note,
    change_origin: row.change_origin,
    occurred_at: occurredAt,
  };
}
