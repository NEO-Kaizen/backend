import type { AuditEntityName } from "../../../shared/audit/auditCatalog.ts";

export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityName;
}

export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
}

export interface AuditHistorySummary {
  audit_id: number;
  entity_type: string;
  entity_type_label: string;
  action_type: string;
  actor: AuditActor;
  occurred_at: string;
}

export interface AuditHistoryDetail {
  audit_id: number;
  entity_type: string;
  entity_id: string;
  action_type: string;
  actor: AuditActor;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  change_origin: string | null;
  occurred_at: string;
}

export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number;
  page: number;
  limit: number;
}
