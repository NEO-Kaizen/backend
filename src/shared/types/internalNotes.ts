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
