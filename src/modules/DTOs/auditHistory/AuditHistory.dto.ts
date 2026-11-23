import type { AuditEntityName } from "../../../shared/audit/auditCatalog.ts";
import type { ProfileReference } from "../../../shared/types/profile.ts";

export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityName;
}

export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
  /**
   * Snapshot do Perfil do ator no momento do evento. `null` em ações de
   * sistema e em eventos anteriores ao snapshot — nunca inferido do nome.
   */
  profile: ProfileReference | null;
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
  /** Justificativa interna da transição. */
  note: string | null;
  /** Snapshot do retorno público da transição (nunca concatenado em `note`). */
  last_technical_message: string | null;
  ip_address: string | null;
  change_origin: string | null;
  /** Chaves exigidas e ausentes nas recusas; vazio nas demais ações. */
  denied_permission_keys: string[];
  occurred_at: string;
}

export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number;
  page: number;
  limit: number;
}
