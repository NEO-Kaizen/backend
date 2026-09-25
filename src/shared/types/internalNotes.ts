import type { Role } from "./role.ts";

export type InternalRole = Exclude<Role, "Solicitante">;

export interface InternalNoteRow {
  internal_note_id: string;
  request_id: string;
  author_user_id: number;
  author_role_at_creation: InternalRole;
  content: string;
  created_at: Date;
  author_name: string;
}

export interface InternalNoteReadStateRow {
  request_id: string;
  user_id: number;
  last_read_note_id: string;
  read_at: Date;
}

export type TimelineEventAction =
  | "request.assign"
  | "request.reassign"
  | "request.unassign"
  | "request.status_change"
  | "mapping.assign";

/**
 * Ações persistidas em `audit_history` que alimentam a timeline. Diferente da
 * lista fechada exposta na API (`TimelineEventAction`, 5 ações), inclui
 * `request.override_status_admin` — gravada pelo bypass de Administrador no
 * `PATCH /requests/:protocol/status` e **normalizada na leitura** para
 * `request.status_change` (issue #124). A gravação permanece intocada.
 */
export type AuditTimelineAction = TimelineEventAction | "request.override_status_admin";

export type TimelineChangeOrigin = "admin" | "system" | "internal" | null;

export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}

export interface TimelineEventRow {
  audit_id: string;
  action_type: AuditTimelineAction;
  previous_value: string | null;
  new_value: string | null;
  /** Justificativa interna da transição (`audit_history.note`). */
  note: string | null;
  /** Snapshot do retorno público da transição (`audit_history.last_technical_message`). */
  last_technical_message: string | null;
  change_origin: TimelineChangeOrigin;
  occurred_at: Date;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}

/** Linha do histórico de triagem: snapshot normalizado + data do audit. */
export interface TriageHistoryRow {
  triage_id: string;
  adherent_to_scope: "Sim" | "Não" | "";
  adherent_justification: string;
  change_category: "Sim" | "Não" | "";
  new_category: string;
  preliminary_complexity: string;
  perceived_risks: string;
  suggested_responsible: string;
  suggested_responsible_justification: string;
  exit_status: number;
  result: string;
  conclusion_justification: string;
  assignee_user_id: number | null;
  assignee_name: string | null;
  assignee_email: string | null;
  last_technical_message: string | null;
  occurred_at: Date;
}

/** Participante de um mapeamento histórico (userId null = externo). */
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}

/** Designado de um mapeamento histórico (join details_professional → users). */
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}

/** Linha do histórico de mapeamento: snapshot + participantes + designado + data. */
export interface MappingHistoryRow {
  protocol: string;
  mapping_id: string;
  professional_id: string | null;
  scheduled_for: Date | string | null;
  duration_minutes: number | null;
  modality: "REMOTE" | "IN_PERSON" | null;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  target_status_id: number | null;
  justification: string | null;
  last_technical_message: string | null;
  occurred_at: Date;
  participants: MappingHistoryParticipant[];
  mappingAssignee: MappingHistoryAssignee | null;
}
