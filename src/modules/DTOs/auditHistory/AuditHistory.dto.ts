export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: string;
}

export interface AuditHistorySummary {
  audit_id: number;
  entity_type: string;
  entity_type_label: string;
  action_type: string;
  user_id: number | null;
  occurred_at: string;
}

export interface AuditHistoryDetail {
  audit_id: number;
  entity_type: string;
  entity_id: string;
  action_type: string;
  user_id: number | null;
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
