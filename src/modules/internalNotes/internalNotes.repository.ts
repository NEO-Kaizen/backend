import db from "../../database/conection.ts";
import type {
  InternalNoteReadStateRow,
  InternalNoteRow,
  InternalRole,
  TimelineCursor,
  TimelineEventAction,
  TimelineEventRow,
} from "../../shared/types/internalNotes.ts";

interface RequestIdentityRow {
  request_id: string;
}

const REQUEST_EVENT_ACTIONS: TimelineEventAction[] = [
  "request.assign",
  "request.reassign",
  "request.unassign",
  "request.status_change",
];

const MAPPING_RECORD_ACTIONS = ["mapping.save", "mapping.complete", "mapping.assign"];

const NOTE_COLUMNS = [
  "note.internal_note_id",
  "note.request_id",
  "note.author_user_id",
  "note.author_role_at_creation",
  "note.content",
  "note.created_at",
  "author.full_name as author_name",
] as const;

export async function findRequestIdByProtocol(
  protocol: string,
): Promise<RequestIdentityRow | undefined> {
  return db("requests").where({ protocol }).first("request_id");
}

export async function listNotesPage(
  requestId: string,
  cursor: TimelineCursor | null,
  limit: number,
): Promise<InternalNoteRow[]> {
  const query = db("request_internal_notes as note")
    .join("users as author", "author.user_id", "note.author_user_id")
    .where("note.request_id", requestId);

  if (cursor !== null) {
    if (cursor.type === "note") {
      query.where((builder) => {
        builder.where("note.created_at", "<", cursor.t).orWhere((nested) => {
          nested
            .where("note.created_at", "=", cursor.t)
            .where("note.internal_note_id", "<", cursor.id);
        });
      });
    } else {
      query.where("note.created_at", "<=", cursor.t);
    }
  }

  return query
    .select([...NOTE_COLUMNS])
    .orderBy("note.created_at", "desc")
    .orderBy("note.internal_note_id", "desc")
    .limit(limit);
}

export async function listEventsPage(
  protocol: string,
  requestId: string,
  cursor: TimelineCursor | null,
  limit: number,
): Promise<TimelineEventRow[]> {
  const query = db("audit_history as audit")
    .leftJoin("users as actor", "actor.user_id", "audit.user_id")
    .leftJoin("profiles as actor_profile", "actor_profile.profile_id", "actor.profile_id")
    .where((scope) => {
      scope
        .where((requestScope) => {
          requestScope
            .where("audit.entity_type", "request")
            .where("audit.entity_id", protocol)
            .whereIn("audit.action_type", REQUEST_EVENT_ACTIONS);
        })
        .orWhere((mappingScope) => {
          mappingScope
            .where("audit.entity_type", "mapping")
            .where("audit.action_type", "mapping.assign")
            .whereIn(
              "audit.entity_id",
              db("mappings").select("mapping_id").where("request_id", requestId),
            );
        });
    });

  if (cursor !== null) {
    if (cursor.type === "event") {
      const auditId = cursor.id.slice("audit:".length);
      query.where((builder) => {
        builder.where("audit.occurred_at", "<", cursor.t).orWhere((nested) => {
          nested.where("audit.occurred_at", "=", cursor.t).where("audit.audit_id", "<", auditId);
        });
      });
    } else {
      query.where("audit.occurred_at", "<", cursor.t);
    }
  }

  return query
    .select(
      "audit.audit_id",
      "audit.action_type",
      "audit.previous_value",
      "audit.new_value",
      "audit.change_origin",
      "audit.occurred_at",
      "audit.user_id as actor_user_id",
      "actor.full_name as actor_name",
      "actor_profile.name as actor_profile_name",
    )
    .orderBy("audit.occurred_at", "desc")
    .orderBy("audit.audit_id", "desc")
    .limit(limit);
}

export async function countUnseen(
  requestId: string,
  actorUserId: number,
  lastReadNoteId?: string,
): Promise<number> {
  const query = db("request_internal_notes as note")
    .where("note.request_id", requestId)
    .whereNot("note.author_user_id", actorUserId);

  if (lastReadNoteId !== undefined) {
    query.where("note.internal_note_id", ">", lastReadNoteId);
  }

  const row = await query.count<{ count: string }>("* as count").first();
  return Number(row?.count ?? 0);
}

export async function findTriageOccurredAt(protocol: string): Promise<Date | null> {
  const row = (await db("audit_history")
    .where({
      entity_type: "request",
      entity_id: protocol,
      action_type: "request.triage",
    })
    .max({ occurredAt: "occurred_at" })
    .first()) as { occurredAt: Date | string | null } | undefined;

  const value = row?.occurredAt;
  return value === null || value === undefined ? null : new Date(value);
}

export async function findMappingOccurredAt(requestId: string): Promise<Date | null> {
  const row = (await db("audit_history as audit")
    .where("audit.entity_type", "mapping")
    .whereIn("audit.action_type", MAPPING_RECORD_ACTIONS)
    .whereIn("audit.entity_id", db("mappings").select("mapping_id").where("request_id", requestId))
    .max({ occurredAt: "audit.occurred_at" })
    .first()) as { occurredAt: Date | string | null } | undefined;

  const value = row?.occurredAt;
  return value === null || value === undefined ? null : new Date(value);
}

export async function resolveUserNames(userIds: number[]): Promise<Map<number, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows: Array<{ user_id: number; full_name: string }> = await db("users")
    .whereIn("user_id", userIds)
    .select("user_id", "full_name");

  return new Map(rows.map((row) => [row.user_id, row.full_name]));
}

export async function resolveProfessionalNames(
  professionalIds: string[],
): Promise<Map<string, string>> {
  if (professionalIds.length === 0) {
    return new Map();
  }

  const rows: Array<{ professional_id: string; full_name: string }> = await db(
    "details_professional as dp",
  )
    .join("users as u", "u.user_id", "dp.user_id")
    .whereIn("dp.professional_id", professionalIds)
    .select("dp.professional_id", "u.full_name");

  return new Map(rows.map((row) => [row.professional_id, row.full_name]));
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
    .select([...NOTE_COLUMNS])
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
