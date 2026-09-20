import db from "../../database/conection.ts";
import type {
  InternalNoteReadStateRow,
  InternalNoteRow,
  InternalRole,
} from "../../shared/types/internalNotes.ts";

interface RequestIdentityRow {
  request_id: string;
}

export async function findRequestIdByProtocol(
  protocol: string,
): Promise<RequestIdentityRow | undefined> {
  return db("requests").where({ protocol }).first("request_id");
}

export async function listByRequestId(requestId: string): Promise<InternalNoteRow[]> {
  return db("request_internal_notes as note")
    .join("users as author", "author.user_id", "note.author_user_id")
    .where("note.request_id", requestId)
    .select(
      "note.internal_note_id",
      "note.request_id",
      "note.author_user_id",
      "note.author_role_at_creation",
      "note.content",
      "note.created_at",
      "author.full_name as author_name",
    )
    .orderBy("note.created_at", "asc")
    .orderBy("note.internal_note_id", "asc");
}

export async function findReadState(
  requestId: string,
  userId: number,
): Promise<InternalNoteReadStateRow | undefined> {
  return db("request_internal_note_read_states")
    .where({ request_id: requestId, user_id: userId })
    .first();
}

export async function insert(
  requestId: string,
  author: { userId: number; role: InternalRole },
  content: string,
): Promise<string> {
  const rows = (await db("request_internal_notes")
    .insert({
      request_id: requestId,
      author_user_id: author.userId,
      author_role_at_creation: author.role,
      content,
    })
    .returning("internal_note_id")) as Array<{ internal_note_id: string }>;

  const row = rows[0];
  if (!row) {
    throw new Error("Falha ao salvar a observação interna.");
  }
  return String(row.internal_note_id);
}

export async function findById(internalNoteId: string): Promise<InternalNoteRow | undefined> {
  return db("request_internal_notes as note")
    .join("users as author", "author.user_id", "note.author_user_id")
    .where("note.internal_note_id", internalNoteId)
    .select(
      "note.internal_note_id",
      "note.request_id",
      "note.author_user_id",
      "note.author_role_at_creation",
      "note.content",
      "note.created_at",
      "author.full_name as author_name",
    )
    .first();
}

export async function upsertReadState(
  requestId: string,
  userId: number,
  lastReadNoteId: string,
): Promise<void> {
  await db("request_internal_note_read_states")
    .insert({
      request_id: requestId,
      user_id: userId,
      last_read_note_id: lastReadNoteId,
      read_at: db.fn.now(),
    })
    .onConflict(["request_id", "user_id"])
    .merge({
      last_read_note_id: db.raw(
        'GREATEST("request_internal_note_read_states"."last_read_note_id", EXCLUDED."last_read_note_id")',
      ),
      read_at: db.raw(`
        CASE
          WHEN EXCLUDED."last_read_note_id" > "request_internal_note_read_states"."last_read_note_id"
            THEN EXCLUDED."read_at"
          ELSE "request_internal_note_read_states"."read_at"
        END
      `),
    });
}
