import db from "../../database/conection.ts";
import type {
  AuditTimelineAction,
  InternalNoteReadStateRow,
  InternalNoteRow,
  InternalRole,
  MappingHistoryAssignee,
  MappingHistoryParticipant,
  MappingHistoryRow,
  TimelineCursor,
  TimelineEventRow,
  TriageHistoryRow,
} from "../../shared/types/internalNotes.ts";

interface RequestIdentityRow {
  request_id: string;
}

// `request.override_status_admin` é persistido pelo bypass de Administrador no
// `PATCH /requests/:protocol/status`; entra no filtro e é normalizado para
// `request.status_change` na montagem do DTO (issue #124).
const REQUEST_EVENT_ACTIONS: AuditTimelineAction[] = [
  "request.assign",
  "request.reassign",
  "request.unassign",
  "request.status_change",
  "request.override_status_admin",
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
              db("mappings").select(db.raw("mapping_id::text")).where("request_id", requestId),
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
      "audit.note",
      "audit.last_technical_message",
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

/** Linha do histórico de mapeamento sem os agregados resolvidos em lote. */
type MappingHistoryBaseRow = Omit<MappingHistoryRow, "participants" | "mappingAssignee">;

const TRIAGE_HISTORY_COLUMNS = [
  "t.triage_id",
  "t.adherent_to_scope",
  "t.adherent_justification",
  "t.change_category",
  "t.new_category",
  "t.preliminary_complexity",
  "t.perceived_risks",
  "t.suggested_responsible",
  "t.suggested_responsible_justification",
  "t.exit_status",
  "t.result",
  "t.conclusion_justification",
  "t.assignee_user_id",
  "t.assignee_name",
  "t.assignee_email",
  "t.last_technical_message",
  "audit.occurred_at as occurred_at",
] as const;

/**
 * Histórico versionado de triagens (D-N14) — `triages` ⋈ `audit_history`
 * (`request.triage` via `new_value->>'triageId'`). Ordenado
 * `oldest → newest` por `occurred_at`/`audit_id`. O audit segue como fonte
 * de data; ator/origem não são expostos nas entries (removidos da API).
 */
export async function listTriageHistory(requestId: string): Promise<TriageHistoryRow[]> {
  return (await db("triages as t")
    .joinRaw(
      "JOIN audit_history AS audit ON audit.entity_type = 'request'" +
        " AND audit.action_type = 'request.triage'" +
        " AND (audit.new_value::json->>'triageId')::uuid = t.triage_id",
    )
    .where("t.request_id", requestId)
    .select([...TRIAGE_HISTORY_COLUMNS])
    .orderBy("audit.occurred_at", "asc")
    .orderBy("audit.audit_id", "asc")) as TriageHistoryRow[];
}

/**
 * Histórico versionado de mapeamentos (D-N14): cada row de `mappings` é uma
 * versão/entrada; a proveniência vem da **última** linha `mapping.*` do
 * `audit_history` daquele `mapping_id` (`DISTINCT ON` por `occurred_at` desc).
 * Participantes e designado são resolvidos em lote para montar o snapshot
 * completo (`MappingResponseDTO`). Ordenado `oldest → newest`.
 */
export async function listMappingHistory(requestId: string): Promise<MappingHistoryRow[]> {
  const latestAudit = db("audit_history as a")
    .distinctOn("a.entity_id")
    .where("a.entity_type", "mapping")
    .whereIn("a.action_type", MAPPING_RECORD_ACTIONS)
    .orderBy("a.entity_id", "asc")
    .orderBy("a.occurred_at", "desc")
    .orderBy("a.audit_id", "desc")
    .select("a.entity_id", "a.occurred_at", "a.audit_id");

  const rows = (await db("mappings as m")
    .join("requests as r", "r.request_id", "m.request_id")
    .join(latestAudit.as("audit"), function () {
      this.on("audit.entity_id", "=", db.raw("m.mapping_id::text"));
    })
    .where("m.request_id", requestId)
    .select([
      "r.protocol as protocol",
      "m.mapping_id",
      "m.professional_id",
      "m.scheduled_for",
      "m.duration_minutes",
      "m.modality",
      "m.meeting_link",
      "m.location",
      "m.notes",
      "m.target_status_id",
      "m.justification",
      "m.last_technical_message",
      "audit.occurred_at as occurred_at",
    ])
    .orderBy("audit.occurred_at", "asc")
    .orderBy("audit.audit_id", "asc")) as MappingHistoryBaseRow[];

  if (rows.length === 0) {
    return [];
  }

  const mappingIds = rows.map((row) => row.mapping_id);
  const professionalIds = [
    ...new Set(rows.map((row) => row.professional_id).filter((id): id is string => id !== null)),
  ];

  const [participantRows, assigneeRows] = await Promise.all([
    db("mapping_participants as mp")
      .leftJoin("users as u", "u.user_id", "mp.user_id")
      .whereIn("mp.mapping_id", mappingIds)
      .orderBy("mp.created_at", "asc")
      .orderBy("mp.participant_id", "asc")
      .select([
        "mp.mapping_id",
        "mp.user_id as userId",
        db.raw("COALESCE(u.full_name, mp.name) as name"),
        db.raw("COALESCE(u.email, mp.email) as email"),
      ]) as Promise<Array<{ mapping_id: string } & MappingHistoryParticipant>>,
    professionalIds.length === 0
      ? Promise.resolve([] as MappingHistoryAssignee[])
      : (db("details_professional as dp")
          .join("users as u", "u.user_id", "dp.user_id")
          .join("profiles as p", "p.profile_id", "u.profile_id")
          .whereIn("dp.professional_id", professionalIds)
          .select([
            "dp.professional_id as id",
            "dp.user_id as userId",
            "u.full_name as name",
            "u.email as email",
            "dp.job_title as jobTitle",
          ]) as Promise<MappingHistoryAssignee[]>),
  ]);

  const participantsByMapping = new Map<string, MappingHistoryParticipant[]>();
  for (const participant of participantRows) {
    const list = participantsByMapping.get(participant.mapping_id) ?? [];
    list.push({
      userId: participant.userId,
      name: participant.name,
      email: participant.email,
    });
    participantsByMapping.set(participant.mapping_id, list);
  }

  const assigneeById = new Map(assigneeRows.map((assignee) => [assignee.id, assignee]));

  return rows.map((row) => ({
    ...row,
    participants: participantsByMapping.get(row.mapping_id) ?? [],
    mappingAssignee:
      row.professional_id === null ? null : (assigneeById.get(row.professional_id) ?? null),
  }));
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

export async function resolveStatusNames(statusIds: number[]): Promise<Map<number, string>> {
  if (statusIds.length === 0) {
    return new Map();
  }

  const rows = (await db("statuses")
    .whereIn("status_id", statusIds)
    .select("status_id", "name")) as Array<{ status_id: number; name: string }>;

  return new Map(rows.map((row) => [row.status_id, row.name]));
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
