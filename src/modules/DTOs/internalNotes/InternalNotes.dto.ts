import type {
  InternalRole,
  TimelineChangeOrigin,
  TimelineEventAction,
} from "../../../shared/types/internalNotes.ts";
import type { TriageAssessment } from "../../requests/triage/triage.schema.ts";
import type { MappingResponseDTO } from "../queue/mapping.dto.ts";

export interface TimelineActorDTO {
  id: string;
  name: string;
  role: InternalRole;
}

export interface TimelineNote {
  type: "note";
  id: string;
  content: string;
  createdAt: string;
  author: TimelineActorDTO;
}

export interface TimelineEvent {
  type: "event";
  id: string;
  action: TimelineEventAction;
  text: string;
  occurredAt: string;
  actor: TimelineActorDTO | null;
  changeOrigin: TimelineChangeOrigin;
}

export type TimelineItem = TimelineNote | TimelineEvent;

export interface InternalNotesResponse {
  items: TimelineItem[];
  nextCursor: string | null;
  unseenCount: number;
  triage: TriageAssessment | null;
  triageOccurredAt: string | null;
  mapping: MappingResponseDTO;
  mappingOccurredAt: string | null;
}

export interface CreateInternalNoteRequest {
  content: string;
}

export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
