import { AppError } from "../../shared/errors/AppError.ts";
import type { InternalNoteRow, InternalRole } from "../../shared/types/internalNotes.ts";
import type {
  CreateInternalNoteRequest,
  InternalNoteDTO,
  ListInternalNotesResponse,
  MarkInternalNotesReadRequest,
} from "../DTOs/internalNotes/InternalNotes.dto.ts";
import * as repository from "./internalNotes.repository.ts";

function toDTO(row: InternalNoteRow): InternalNoteDTO {
  return {
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

function countUnseen(
  items: InternalNoteRow[],
  actorUserId: number,
  lastReadNoteId?: string,
): number {
  const checkpoint = BigInt(lastReadNoteId ?? "0");
  return items.filter(
    (item) => item.author_user_id !== actorUserId && BigInt(item.internal_note_id) > checkpoint,
  ).length;
}

async function requireRequestId(protocol: string): Promise<string> {
  const request = await repository.findRequestIdByProtocol(protocol);
  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }
  return String(request.request_id);
}

export async function listInternalNotes(
  protocol: string,
  actorUserId: number,
): Promise<ListInternalNotesResponse> {
  const requestId = await requireRequestId(protocol);
  const [items, readState] = await Promise.all([
    repository.listByRequestId(requestId),
    repository.findReadState(requestId, actorUserId),
  ]);
  const unseenCount = countUnseen(items, actorUserId, readState?.last_read_note_id);

  return { items: items.map(toDTO), unseenCount };
}

export async function createInternalNote(
  protocol: string,
  payload: CreateInternalNoteRequest,
  actor: { userId: number; role: InternalRole },
): Promise<InternalNoteDTO> {
  const requestId = await requireRequestId(protocol);
  const internalNoteId = await repository.insert(requestId, actor, payload.content);
  const note = await repository.findById(internalNoteId);

  if (!note) {
    throw new Error("Observação interna salva, mas não encontrada para retorno.");
  }
  return toDTO(note);
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
