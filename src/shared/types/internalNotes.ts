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

export type TimelineChangeOrigin = "admin" | "system" | "internal" | null;

export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}

export interface TimelineEventRow {
  audit_id: string;
  action_type: TimelineEventAction;
  previous_value: string | null;
  new_value: string | null;
  change_origin: TimelineChangeOrigin;
  occurred_at: Date;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}

/** Linha do histórico de triagem: snapshot normalizado + proveniência do audit. */
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
  occurred_at: Date;
  change_origin: TimelineChangeOrigin;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
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

/** Linha do histórico de mapeamento: snapshot + participantes + designado + audit. */
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
  occurred_at: Date;
  change_origin: TimelineChangeOrigin;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
  participants: MappingHistoryParticipant[];
  mappingAssignee: MappingHistoryAssignee | null;
}
