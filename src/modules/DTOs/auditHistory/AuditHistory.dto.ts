import type {
  AuditEntityType,
  ChangeOrigin,
} from "../../../shared/audit/auditCatalog.ts";

export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityType;
}

export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
}

export interface AuditHistorySummary {
  audit_id: number;
  entity_type: AuditEntityType;
  entity_type_label: string;
  action_type: string; // histórico pode conter ações fora do catálogo atual
  actor: AuditActor;
  occurred_at: string;
}

export interface AuditHistoryDetail {
  audit_id: number;
  entity_type: AuditEntityType;
  entity_id: string;
  action_type: string;
  actor: AuditActor;
  previous_value: string | null;
  new_value: string | null;
  /** Justificativa interna da transição. */
  note: string | null;
  /** Snapshot do retorno público da transição (nunca concatenado em `note`). */
  last_technical_message: string | null;
  ip_address: string | null;
  change_origin: ChangeOrigin | null;
  occurred_at: string;
}

export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number;
  page: number;
  limit: number;
}
