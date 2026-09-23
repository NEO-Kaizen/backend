import { AppError } from "../../shared/errors/AppError.ts";
import { resolveRole } from "../../shared/utils/roleUtils.ts";
import type {
  InternalNoteRow,
  InternalRole,
  MappingHistoryRow,
  TimelineCursor,
  TimelineEventRow,
  TriageHistoryRow,
} from "../../shared/types/internalNotes.ts";
import type {
  CreateInternalNoteRequest,
  InternalNotesResponse,
  MappingHistoryEntry,
  MarkInternalNotesReadRequest,
  TimelineActorDTO,
  TimelineEvent,
  TimelineItem,
  TimelineNote,
  TriageHistoryEntry,
} from "../DTOs/internalNotes/InternalNotes.dto.ts";
import * as repository from "./internalNotes.repository.ts";
import type { ListTimelineQuery, TimelineCursorPayload } from "./internalNotes.schema.ts";

const EVENT_ID_PREFIX = "audit:";
const NOTE_RANK = 0;
const EVENT_RANK = 1;

function toNoteDTO(row: InternalNoteRow): TimelineNote {
  return {
    type: "note",
    id: String(row.internal_note_id),
    content: row.content,
    createdAt: row.created_at.toISOString(),
    author: {
      id: String(row.author_user_id),
      name: row.author_name,
      role: row.author_role_at_creation,
    },
  };
}

async function requireRequestId(protocol: string): Promise<string> {
  const request = await repository.findRequestIdByProtocol(protocol);
  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }
  return String(request.request_id);
}

function toRepositoryCursor(cursor: TimelineCursorPayload | undefined): TimelineCursor | null {
  if (cursor === undefined) {
    return null;
  }
  return { t: new Date(cursor.t), type: cursor.type, id: cursor.id };
}

function encodeCursor(item: TimelineItem): string {
  const payload =
    item.type === "note"
      ? { t: item.createdAt, type: item.type, id: item.id }
      : { t: item.occurredAt, type: item.type, id: item.id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

interface TimelineEntry {
  item: TimelineItem;
  timeMs: number;
  rank: number;
  id: bigint;
}

function toEntry(item: TimelineItem): TimelineEntry {
  if (item.type === "note") {
    return { item, timeMs: Date.parse(item.createdAt), rank: NOTE_RANK, id: BigInt(item.id) };
  }
  return {
    item,
    timeMs: Date.parse(item.occurredAt),
    rank: EVENT_RANK,
    id: BigInt(item.id.slice(EVENT_ID_PREFIX.length)),
  };
}

function compareDesc(a: TimelineEntry, b: TimelineEntry): number {
  if (a.timeMs !== b.timeMs) return b.timeMs - a.timeMs;
  if (a.rank !== b.rank) return b.rank - a.rank;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

function mergeTimeline(
  notes: TimelineNote[],
  events: TimelineEvent[],
  limit: number,
): { items: TimelineItem[]; nextCursor: string | null } {
  const entries = [...notes.map(toEntry), ...events.map(toEntry)].sort(compareDesc);
  const page = entries.slice(0, limit);
  const oldest = page.at(-1);
  const nextCursor =
    entries.length > limit && oldest !== undefined ? encodeCursor(oldest.item) : null;
  return { items: page.map((entry) => entry.item), nextCursor };
}

function positiveIntOrNull(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function composeEventText(
  row: TimelineEventRow,
  userNames: Map<number, string>,
  professionalNames: Map<string, string>,
): string {
  switch (row.action_type) {
    case "request.status_change":
      return row.new_value ? `Status alterado: ${row.new_value}` : "Status alterado";
    case "request.assign": {
      const userId = positiveIntOrNull(row.new_value);
      const name = userId === null ? undefined : userNames.get(userId);
      return name === undefined ? "Responsável atribuído" : `Responsável atribuído: ${name}`;
    }
    case "request.reassign": {
      const userId = positiveIntOrNull(row.new_value);
      const name = userId === null ? undefined : userNames.get(userId);
      return name === undefined ? "Responsável substituído" : `Responsável substituído: ${name}`;
    }
    case "request.unassign":
      return "Responsável removido";
    case "mapping.assign": {
      if (row.new_value === null) return "Responsável pelo mapeamento removido";
      const name = professionalNames.get(row.new_value);
      return name === undefined
        ? "Responsável pelo mapeamento alterado"
        : `Responsável pelo mapeamento alterado: ${name}`;
    }
  }
}

/** Proveniência mínima do audit compartilhada por eventos e históricos. */
interface ActorSource {
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}

function toActorDTO(row: ActorSource): TimelineActorDTO | null {
  if (row.actor_user_id === null || row.actor_name === null || row.actor_profile_name === null) {
    return null;
  }

  const role = resolveRole(row.actor_profile_name);
  if (role === "Solicitante") {
    return null;
  }
  return { id: String(row.actor_user_id), name: row.actor_name, role };
}

/** Serializa instante para ISO-8601 UTC com sufixo `Z` e precisão de segundos. */
function toIsoSeconds(value: Date | string | null): string | null {
  if (value === null) return null;

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace(/\.\d+Z$/, "Z");
}

function toTriageHistoryEntry(row: TriageHistoryRow): TriageHistoryEntry {
  return {
    triage: {
      id: row.triage_id,
      adherentToScope: row.adherent_to_scope,
      adherentJustification: row.adherent_justification,
      changeCategory: row.change_category,
      newCategory: row.new_category,
      preliminaryComplexity: row.preliminary_complexity,
      perceivedRisks: row.perceived_risks,
      suggestedResponsible: row.suggested_responsible,
      suggestedResponsibleJustification: row.suggested_responsible_justification,
      exitStatus: row.exit_status,
      result: row.result,
      conclusionJustification: row.conclusion_justification,
    },
    occurredAt: row.occurred_at.toISOString(),
  };
}

function toMappingHistoryEntry(row: MappingHistoryRow): MappingHistoryEntry {
  return {
    mapping: {
      protocol: row.protocol,
      id: row.mapping_id,
      scheduledFor: toIsoSeconds(row.scheduled_for),
      durationMinutes: row.duration_minutes,
      modality: row.modality,
      meetingLink: row.meeting_link,
      location: row.location,
      participants: row.participants.map((participant) => ({
        id: participant.userId === null ? null : String(participant.userId),
        name: participant.name,
        email: participant.email,
      })),
      notes: row.notes,
      mappingAssignee:
        row.mappingAssignee === null
          ? null
          : {
              id: row.mappingAssignee.id,
              userId: String(row.mappingAssignee.userId),
              name: row.mappingAssignee.name,
              email: row.mappingAssignee.email,
              jobTitle: row.mappingAssignee.jobTitle,
            },
    },
    occurredAt: row.occurred_at.toISOString(),
  };
}

async function buildEventDTOs(rows: TimelineEventRow[]): Promise<TimelineEvent[]> {
  const userIds = new Set<number>();
  const professionalIds = new Set<string>();

  for (const row of rows) {
    if (row.action_type === "request.assign" || row.action_type === "request.reassign") {
      const userId = positiveIntOrNull(row.new_value);
      if (userId !== null) {
        userIds.add(userId);
      }
    } else if (row.action_type === "mapping.assign" && row.new_value !== null) {
      professionalIds.add(row.new_value);
    }
  }

  const [userNames, professionalNames] = await Promise.all([
    repository.resolveUserNames([...userIds]),
    repository.resolveProfessionalNames([...professionalIds]),
  ]);

  return rows.map((row) => ({
    type: "event",
    id: `${EVENT_ID_PREFIX}${row.audit_id}`,
    action: row.action_type,
    text: composeEventText(row, userNames, professionalNames),
    occurredAt: row.occurred_at.toISOString(),
    actor: toActorDTO(row),
    changeOrigin: row.change_origin,
  }));
}

export async function listInternalNotes(
  protocol: string,
  actorUserId: number,
  query: ListTimelineQuery,
): Promise<InternalNotesResponse> {
  const requestId = await requireRequestId(protocol);
  const cursor = toRepositoryCursor(query.cursor);
  const pageLimit = query.limit + 1;

  const readState = await repository.findReadState(requestId, actorUserId);

  const [noteRows, eventRows, unseenCount, triageRows, mappingRows] = await Promise.all([
    repository.listNotesPage(requestId, cursor, pageLimit),
    repository.listEventsPage(protocol, requestId, cursor, pageLimit),
    repository.countUnseen(requestId, actorUserId, readState?.last_read_note_id),
    repository.listTriageHistory(requestId),
    repository.listMappingHistory(requestId),
  ]);

  const events = await buildEventDTOs(eventRows);
  const notes = noteRows.map(toNoteDTO);
  const { items, nextCursor } = mergeTimeline(notes, events, query.limit);

  return {
    items,
    nextCursor,
    unseenCount,
    triages: triageRows.map(toTriageHistoryEntry),
    mappings: mappingRows.map(toMappingHistoryEntry),
  };
}

export async function createInternalNote(
  protocol: string,
  payload: CreateInternalNoteRequest,
  actor: { userId: number; role: InternalRole },
): Promise<TimelineNote> {
  const requestId = await requireRequestId(protocol);
  const internalNoteId = await repository.insert(requestId, actor, payload.content);
  const note = await repository.findById(internalNoteId);

  if (!note) {
    throw new Error("Observação interna salva, mas não encontrada para retorno.");
  }
  return toNoteDTO(note);
}

export async function markInternalNotesRead(
  protocol: string,
  payload: MarkInternalNotesReadRequest,
  actorUserId: number,
): Promise<void> {
  const requestId = await requireRequestId(protocol);
  const note = await repository.findById(payload.lastReadNoteId);

  if (!note || String(note.request_id) !== requestId) {
    throw new AppError("Observação interna não pertence à solicitação", 400);
  }

  await repository.upsertReadState(requestId, actorUserId, payload.lastReadNoteId);
}
