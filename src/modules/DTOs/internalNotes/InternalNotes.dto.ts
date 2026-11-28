import type {
  TimelineChangeOrigin,
  TimelineEventAction,
} from "../../../shared/types/internalNotes.ts";
import type { ProfileSnapshot } from "../../../shared/types/profile.ts";
import type { TriageAssessment } from "../../requests/triage/triage.schema.ts";
import type { MappingResponseDTO } from "../queue/mapping.dto.ts";

export interface TimelineActorDTO {
  id: string;
  name: string;
  /**
   * Snapshot do Perfil no momento do registro. `null` quando o evento não
   * guardou Perfil; em notas antigas, `id` é `null` porque só o nome foi
   * preservado — nunca inferido do nome.
   */
  profile: ProfileSnapshot | null;
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
  /** Justificativa interna da transição (nunca o retorno público). */
  justification?: string | null;
  /**
   * Snapshot do retorno público da própria transição — populado **somente**
   * em `request.status_change` de destino público; `null`/ausente nos demais.
   */
  lastTechnicalMessage?: string | null;
}

export type TimelineItem = TimelineNote | TimelineEvent;

export interface TriageHistoryEntry {
  triage: TriageAssessment;
  occurredAt: string;
}

export interface MappingHistoryEntry {
  mapping: MappingResponseDTO;
  occurredAt: string;
}

export interface InternalNotesResponse {
  items: TimelineItem[];
  nextCursor: string | null;
  unseenCount: number;
  triages: TriageHistoryEntry[];
  mappings: MappingHistoryEntry[];
}

export interface CreateInternalNoteRequest {
  content: string;
}

export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
