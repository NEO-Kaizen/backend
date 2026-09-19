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
