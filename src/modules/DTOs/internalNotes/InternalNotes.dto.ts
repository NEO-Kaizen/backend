import type { InternalRole } from "../../../shared/types/internalNotes.ts";

export interface InternalNoteAuthorDTO {
  id: string;
  name: string;
  role: InternalRole;
}

export interface InternalNoteDTO {
  id: string;
  content: string;
  createdAt: string;
  author: InternalNoteAuthorDTO;
}

export interface ListInternalNotesResponse {
  items: InternalNoteDTO[];
  unseenCount: number;
}

export interface CreateInternalNoteRequest {
  content: string;
}

export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
