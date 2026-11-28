import { hasResponsibleCustody, type PermissionActor } from "../../shared/access/requestAccess.ts";
import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { z } from "zod";
import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { lockRequestForWrite } from "../requests/requests.repository.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import type { PendingItem, ReviewDecision } from "../DTOs/pendingItems/PendingItems.dto.ts";
import type { PendingFieldValue } from "../../shared/types/pendingItems.ts";

export interface RequestRef {
  request_id: string;
  protocol: string;
  title: string;
  status: string;
  status_id: number;
  reopen_ref: string | null;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
  responsible_user_id: number | null;
}

/** Escalar JSON aceito em `pending_items.current_value/corrected_value`. */
const pendingFieldValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/** BIGINT do Postgres chega como string; aceita número para drivers/test doubles. */
const dbBigIntStringSchema = z
  .union([z.string().min(1), z.number().int()])
  .transform((value) => String(value));

const dbTimestampSchema = z.union([z.date(), z.string().min(1)]);

/** Projeção de `pending_items` validada na fronteira do repository. */
const pendingItemRowSchema = z.object({
  pending_item_id: z.string().uuid(),
  request_id: dbBigIntStringSchema,
  batch_id: z.string().uuid(),
  type: z.enum(["field_edit", "observation"]),
  field_key: z.string().nullable(),
  field_label: z.string().nullable(),
  current_value: pendingFieldValueSchema,
  comment: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(["requested", "responded", "validated"]),
  corrected_value: pendingFieldValueSchema,
  response_text: z.string().nullable(),
  request_attachment: z.boolean(),
  deadline: z.union([z.date(), z.string().min(1)]).nullable(),
  created_at: dbTimestampSchema,
  responded_at: dbTimestampSchema.nullable(),
  validated_at: dbTimestampSchema.nullable(),
});

export type PendingItemRow = z.infer<typeof pendingItemRowSchema>;

/** Anexo de Pendência usado pelo `buildPendingItems` (evita N+1). */
const pendingAttachmentRowSchema = z.object({
  pending_item_id: z.string().uuid(),
  file_name: z.string().min(1),
  content_type: z.string().min(1),
  size_bytes: z
    .union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
    .transform((value) => Number(value)),
});

export type PendingAttachmentRow = z.infer<typeof pendingAttachmentRowSchema>;

function parseDbRow<Row>(schema: z.ZodType<Row>, row: Record<string, unknown>): Row {
  const parsed = schema.safeParse(row);
  if (!parsed.success) {
    throw new AppError("Dados de pendência inválidos.", 500);
  }
  return parsed.data;
}

function mapPendingItemRow(row: Record<string, unknown>): PendingItemRow {
  return parseDbRow(pendingItemRowSchema, row);
}

function mapPendingItemRows(rows: Record<string, unknown>[]): PendingItemRow[] {
  return rows.map(mapPendingItemRow);
}

function mapPendingAttachmentRow(row: Record<string, unknown>): PendingAttachmentRow {
  return parseDbRow(pendingAttachmentRowSchema, row);
}

export async function findRequestByProtocol(
  protocol: string,
  trx?: Knex.Transaction,
): Promise<RequestRef | null> {
  const conn = trx ?? db;
  const row = await conn("requests")
    .join("statuses", "statuses.status_id", "requests.status_id")
    .join("requesters", "requesters.requester_id", "requests.requester_id")
    .leftJoin(
      "details_professional as responsible_professional",
      "responsible_professional.professional_id",
      "requests.professional_id",
    )
    .leftJoin(
      "users as responsible_user",
      "responsible_user.user_id",
      "responsible_professional.user_id",
    )
    .where("requests.protocol", protocol.trim())
    .select(conn.raw("requests.reopen_ref AS reopen_ref"))
    .first({
      request_id: "requests.request_id",
      protocol: "requests.protocol",
      title: "requests.title",
      status: "statuses.name",
      status_id: "statuses.status_id",
      requester_user_id: "requests.requester_user_id",
      requester_name: "requesters.full_name",
      requester_email: "requesters.corporate_email",
      responsible_user_id: "responsible_user.user_id",
    });
  return (row as RequestRef | undefined) ?? null;
}

export async function findRequestById(
  requestId: string,
  trx?: Knex.Transaction,
): Promise<RequestRef | null> {
  const conn = trx ?? db;
  const row = await conn("requests")
    .join("statuses", "statuses.status_id", "requests.status_id")
    .join("requesters", "requesters.requester_id", "requests.requester_id")
    .leftJoin(
      "details_professional as responsible_professional",
      "responsible_professional.professional_id",
      "requests.professional_id",
    )
    .leftJoin(
      "users as responsible_user",
      "responsible_user.user_id",
      "responsible_professional.user_id",
    )
    .where("requests.request_id", requestId)
    .select(conn.raw("requests.reopen_ref AS reopen_ref"))
    .first({
      request_id: "requests.request_id",
      protocol: "requests.protocol",
      title: "requests.title",
      status: "statuses.name",
      status_id: "statuses.status_id",
      requester_user_id: "requests.requester_user_id",
      requester_name: "requesters.full_name",
      requester_email: "requesters.corporate_email",
      responsible_user_id: "responsible_user.user_id",
    });
  return (row as RequestRef | undefined) ?? null;
}

function currentPendingRows(source: Knex | Knex.Transaction, requestId: string) {
  return source("pending_items")
    .where("pending_items.request_id", requestId)
    .whereExists(
      source("requests")
        .select(source.raw("1"))
        .where("requests.request_id", requestId)
        .andWhere((query) => {
          query
            .whereNull("requests.last_reopened_at")
            .orWhereRaw("?? >= ??", ["pending_items.created_at", "requests.last_reopened_at"]);
        }),
    );
}

async function lockActiveRequest(trx: Knex.Transaction, requestId: string) {
  const request = await lockRequestForWrite(trx, requestId);
  if (!request) throw new AppError("Solicitação não encontrada", 404);
  const status = await trx("statuses")
    .where("status_id", request.status_id)
    .first("name", "is_terminal");
  if (!status) throw new AppError("Status da solicitação não encontrado.", 404);
  if (status.is_terminal) {
    throw new AppError("Solicitação encerrada.", 409, "rf02_pending_terminal");
  }
  return { ...request, statusName: String(status.name) };
}

async function assertPendingCustody(
  trx: Knex.Transaction,
  professionalId: string | null,
  actor: PermissionActor,
  key: "pending_item:write" | "pending_item:review",
): Promise<void> {
  const custodian = await trx("details_professional")
    .where({ professional_id: professionalId })
    .first("user_id");
  if (!hasResponsibleCustody(actor, key, custodian?.user_id)) {
    throw new AppError("A custódia da solicitação mudou.", 409, "request_assignment_conflict");
  }
}

async function findCurrentPendingItem(
  trx: Knex.Transaction,
  requestId: string,
  itemId: string,
): Promise<Record<string, unknown>> {
  const item: Record<string, unknown> | undefined = await currentPendingRows(trx, requestId)
    .where("pending_item_id", itemId)
    .first();
  if (!item) throw new AppError("Pendência de um ciclo anterior.", 409, "rf02_pending_historical");
  return item;
}

/**
 * Usuário do Responsável corrente (`requests.professional_id`), dentro da
 * transação da resposta. `null` quando a solicitação não tem Responsável.
 * O estado atual da conta não altera a audiência: a designação é a fonte de
 * verdade (decisão registrada em `docs/notifications-contract.md`).
 */
export async function findAssigneeUserIdByRequestId(
  trx: Knex.Transaction,
  requestId: string,
): Promise<number | null> {
  const row = (await trx("requests")
    .join(
      "details_professional",
      "details_professional.professional_id",
      "requests.professional_id",
    )
    .where("requests.request_id", requestId)
    .first("details_professional.user_id")) as { user_id: number } | undefined;

  return row ? Number(row.user_id) : null;
}

export async function hasOpenPending(requestId: string, trx?: Knex.Transaction): Promise<boolean> {
  const conn = trx ?? db;
  const row = await currentPendingRows(conn, requestId)
    .whereIn("status", ["requested", "responded"])
    .first("pending_item_id");
  return row !== undefined;
}

export async function findPendingItemsByRequestId(
  requestId: string,
  trx?: Knex.Transaction,
): Promise<PendingItemRow[]> {
  const conn = trx ?? db;
  const rows = (await currentPendingRows(conn, requestId)
    .orderBy("pending_items.created_at", "asc")
    .select("*")) as unknown as Record<string, unknown>[];
  return mapPendingItemRows(rows);
}

export async function findPendingItemById(
  pendingItemId: string,
  trx?: Knex.Transaction,
): Promise<PendingItemRow | null> {
  const conn = trx ?? db;
  const row = (await conn("pending_items")
    .where({ pending_item_id: pendingItemId })
    .first("*")) as unknown as Record<string, unknown> | undefined;
  return row ? mapPendingItemRow(row) : null;
}

/** Busca em lote — evita N+1 no `buildPendingItems`. */
export async function findAttachmentsByPendingItemIds(
  pendingItemIds: string[],
  trx?: Knex.Transaction,
): Promise<Map<string, PendingAttachmentRow[]>> {
  const grouped = new Map<string, PendingAttachmentRow[]>();
  if (pendingItemIds.length === 0) return grouped;

  const conn = trx ?? db;
  const rows = (await conn("attachments")
    .whereIn("pending_item_id", pendingItemIds)
    .orderBy("uploaded_at", "asc")
    .select("*")) as unknown as Record<string, unknown>[];

  for (const row of rows) {
    const attachment = mapPendingAttachmentRow(row);
    const list = grouped.get(attachment.pending_item_id) ?? [];
    list.push(attachment);
    grouped.set(attachment.pending_item_id, list);
  }
  return grouped;
}

export async function countAttachmentsByBatchId(
  batchId: string,
  requestId: string,
  trx?: Knex.Transaction,
): Promise<number> {
  const conn = trx ?? db;
  const row = await conn("pending_items")
    .join("attachments", "attachments.pending_item_id", "pending_items.pending_item_id")
    .where("pending_items.batch_id", batchId)
    .andWhere("pending_items.request_id", requestId)
    .count<{ count: string }>("attachments.attachment_id as count")
    .first();
  return Number(row?.count ?? 0);
}

export async function pendingSummaryByRequestId(
  requestId: string,
  trx?: Knex.Transaction,
): Promise<{ total: number; requested: number; responded: number; validated: number }> {
  const conn = trx ?? db;
  const rows = (await currentPendingRows(conn, requestId)
    .select("status")
    .select(conn.raw("count(*)::int as count"))
    .groupBy("status")) as unknown as Array<{ status: string; count: number }>;

  const map = new Map(rows.map((r) => [r.status, Number(r.count)]));
  const requested = map.get("requested") ?? 0;
  const responded = map.get("responded") ?? 0;
  const validated = map.get("validated") ?? 0;
  return { total: requested + responded + validated, requested, responded, validated };
}

/**
 * Lote "resposta a aprovar": todos os itens `responded` e nenhum `requested`.
 * Se o lote exige anexo (`request_attachment`), precisa de ≥1 anexo. Uma query
 * agrupada por `batch_id` + `status` resolve todos os lotes de uma vez.
 */
export async function findCorrectionAlert(
  requestId: string,
  trx?: Knex.Transaction,
): Promise<{ batchId: string; count: number } | null> {
  const conn = trx ?? db;

  const rows = (await currentPendingRows(conn, requestId)
    .select("batch_id", "status")
    .count<{ count: string }>("* as count")
    .groupBy("batch_id", "status")) as unknown as Array<{
    batch_id: string;
    status: string;
    count: string;
  }>;

  const byBatch = new Map<string, { total: number; responded: number; requested: number }>();
  for (const row of rows) {
    const entry = byBatch.get(row.batch_id) ?? { total: 0, responded: 0, requested: 0 };
    const count = Number(row.count);
    entry.total += count;
    if (row.status === "responded") entry.responded += count;
    if (row.status === "requested") entry.requested += count;
    byBatch.set(row.batch_id, entry);
  }

  const candidates = [...byBatch.entries()].filter(
    ([, s]) => s.responded > 0 && s.requested === 0 && s.responded === s.total,
  );
  if (candidates.length === 0) return null;

  const requiresAttachment = (await conn("pending_items")
    .where({ request_id: requestId })
    .whereIn(
      "batch_id",
      candidates.map(([batchId]) => batchId),
    )
    .where("request_attachment", true)
    .distinct("batch_id")) as unknown as Array<{ batch_id: string }>;
  const requiresSet = new Set(requiresAttachment.map((r) => r.batch_id));

  const attachmentCounts = new Map<string, number>();
  if (requiresSet.size > 0) {
    const counts = (await conn("pending_items")
      .join("attachments", "attachments.pending_item_id", "pending_items.pending_item_id")
      .where({ "pending_items.request_id": requestId })
      .whereIn("pending_items.batch_id", [...requiresSet])
      .select("pending_items.batch_id")
      .count<{ count: string }>("attachments.attachment_id as count")
      .groupBy("pending_items.batch_id")) as unknown as Array<{
      batch_id: string;
      count: string;
    }>;
    for (const c of counts) attachmentCounts.set(c.batch_id, Number(c.count));
  }

  for (const [batchId, summary] of candidates) {
    if (requiresSet.has(batchId) && (attachmentCounts.get(batchId) ?? 0) === 0) continue;
    return { batchId, count: summary.responded };
  }
  return null;
}

export async function unreadForInternal(
  requestId: string,
  trx?: Knex.Transaction,
): Promise<{ count: number; lastUnreadAt: string | null }> {
  const conn = trx ?? db;
  const row = (await currentPendingRows(conn, requestId)
    .where({ status: "responded" })
    .count<{ count: string }>("* as count")
    .max({ lastUnreadAt: "responded_at" })
    .first()) as { count: string; lastUnreadAt: string | Date | null } | undefined;

  const count = Number(row?.count ?? 0);
  if (count === 0) return { count: 0, lastUnreadAt: null };
  const lastUnreadAt = row?.lastUnreadAt ? new Date(row.lastUnreadAt).toISOString() : null;
  return { count, lastUnreadAt };
}

export async function findStatusIdByName(name: string, trx: Knex.Transaction): Promise<number> {
  const row = await trx("statuses").where({ name }).first("status_id");
  if (!row) throw new Error(`Status não encontrado: ${name}`);
  return row.status_id;
}

// --- Use-cases transacionais (create/review recebem `trx`; respond/attach abrem a própria) ---

/** Linha de `pending_items` a inserir — ids/timestamps/estado são preenchidos aqui. */
export type PendingItemInsert = {
  request_id: string;
  batch_id: string;
  type: "field_edit" | "observation";
  field_key: string | null;
  field_label: string | null;
  current_value: PendingFieldValue;
  comment: string;
  description: string;
  request_attachment: boolean;
  created_by: string;
};

export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};

export type ReviewDecisionInput =
  | {
      id: string;
      decision: "validate";
      note: string | null;
      fieldKey: string | null;
      value: unknown;
    }
  | { id: string; decision: "reopen"; comment: string };

export type ReviewFacts = { hasReopen: boolean };

export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};

async function updateRequestStatusId(
  trx: Knex.Transaction,
  requestId: string,
  statusId: number,
  updatedBy: string,
): Promise<void> {
  await trx("requests").where({ request_id: requestId }).update({
    status_id: statusId,
    updated_by: updatedBy,
    updated_at: trx.fn.now(),
  });
}

/**
 * A criação/reabertura da Pendência também muda o Status da solicitação. Essa
 * mudança é auditada aqui, mas não gera Evento `status_changed`: o Evento
 * emitido é o da Pendência.
 */
async function recordPendingItemStatusChangeAudit(
  trx: Knex.Transaction,
  input: {
    protocol: string;
    actorUserId: number;
    previousStatusName: string;
    newStatusName: string;
    note?: string;
    ip: string | undefined;
  },
): Promise<void> {
  await recordAudit(trx, {
    entityType: "request",
    actionType: "request.status_change",
    entityId: input.protocol,
    userId: input.actorUserId,
    previousValue: input.previousStatusName,
    newValue: input.newStatusName,
    note: input.note ?? null,
    ipAddress: input.ip ?? null,
    changeOrigin: "system",
  });
}

export async function findPendingItemsByBatchId(
  batchId: string,
  requestId: string,
  trx?: Knex.Transaction,
): Promise<PendingItemRow[]> {
  const conn = trx ?? db;
  const rows = (await conn("pending_items")
    .where({ batch_id: batchId, request_id: requestId })
    .orderBy("created_at", "asc")
    .select("*")) as unknown as Record<string, unknown>[];
  return mapPendingItemRows(rows);
}

export async function createPendingItemsBatchInTransaction(
  trx: Knex.Transaction,
  input: {
    requestId: string;
    protocol: string;
    batchId: string;
    rows: PendingItemInsert[];
    actor: PermissionActor;
    observedStatusId: number;
    observedReopenRef: string | null;
    ip: string | undefined;
  },
): Promise<{ rows: PendingItemRow[]; auditId: string }> {
  const current = await lockActiveRequest(trx, input.requestId);
  await assertPendingCustody(trx, current.professional_id, input.actor, "pending_item:write");
  if (
    current.status_id !== input.observedStatusId ||
    current.reopen_ref !== input.observedReopenRef ||
    (await hasOpenPending(input.requestId, trx))
  ) {
    throw new AppError(
      "Solicitação alterada ou com pendência em aberto.",
      409,
      "request_pending_conflict",
    );
  }
  const toInsert = input.rows.map((row) => ({
    ...row,
    pending_item_id: randomUUID(),
    status: "requested",
    corrected_value: null,
    response_text: null,
    deadline: null,
    responded_at: null,
    validated_at: null,
    created_at: trx.raw("clock_timestamp()"),
  }));

  if (toInsert.length > 0) {
    await trx("pending_items").insert(toInsert);
  }

  const pendingStatusId = await findStatusIdByName("Pendente de informações", trx);

  let createAuditId: string;
  if (current.status_id !== pendingStatusId) {
    await updateRequestStatusId(trx, input.requestId, pendingStatusId, input.actor.email);
    createAuditId = await recordAudit(trx, {
      entityType: "pending_item",
      actionType: "pending_item.create",
      entityId: input.protocol,
      userId: input.actor.id,
      previousValue: current.statusName,
      newValue: "Pendente de informações",
      ipAddress: input.ip ?? null,
      changeOrigin: "admin",
    });
    await recordPendingItemStatusChangeAudit(trx, {
      protocol: input.protocol,
      actorUserId: input.actor.id,
      previousStatusName: current.statusName,
      newStatusName: "Pendente de informações",
      ip: input.ip,
    });
  } else {
    createAuditId = await recordAudit(trx, {
      entityType: "pending_item",
      actionType: "pending_item.create",
      entityId: input.protocol,
      userId: input.actor.id,
      previousValue: null,
      newValue: input.batchId,
      ipAddress: input.ip ?? null,
      changeOrigin: "admin",
    });
  }

  const rows = (await trx("pending_items")
    .where({ batch_id: input.batchId, request_id: input.requestId })
    .select("*")
    .orderBy("created_at", "asc")) as unknown as Record<string, unknown>[];

  return { rows: mapPendingItemRows(rows), auditId: createAuditId };
}

/** Colunas de `pending_items` alteradas pela resposta do item. */
export type PendingItemResponsePatch = { corrected_value: string } | { response_text: string };

export interface PendingItemResponseInput {
  requestId: string;
  protocol: string;
  pendingItemId: string;
  batchId: string;
  patch: PendingItemResponsePatch;
  actorEmail: string | undefined;
  changeOrigin: "admin" | "requester";
  ip: string | undefined;
  decideStatus: (facts: RespondFacts) => string | null;
}

export interface PendingItemResponseResult {
  row: PendingItemRow;
  /** `audit_id` da resposta; base da `eventKey` do Evento de Notificação. */
  auditId: string;
}

/**
 * Aplica a resposta do item dentro da transação aberta pelo service, que
 * também emite a Notificação do Evento antes do commit.
 */
export async function applyPendingItemResponse(
  trx: Knex.Transaction,
  input: PendingItemResponseInput,
): Promise<PendingItemResponseResult> {
  const current = await lockActiveRequest(trx, input.requestId);
  const row = await findCurrentPendingItem(trx, input.requestId, input.pendingItemId);
  const currentItem = mapPendingItemRow(row);
  if (currentItem.status !== "requested") {
    throw new AppError("Esta pendência já foi respondida.", 409);
  }

  await trx("pending_items")
    .where({ pending_item_id: input.pendingItemId })
    .update({
      ...input.patch,
      status: "responded",
      responded_at: trx.fn.now(),
    });

  const auditId = await recordAudit(trx, {
    entityType: "pending_item",
    actionType: "pending_item.respond",
    entityId: input.pendingItemId,
    userId: null,
    previousValue: "requested",
    newValue: "responded",
    ipAddress: input.ip ?? null,
    changeOrigin: input.changeOrigin,
  });

  const requestedCount = (await trx("pending_items")
    .where({ request_id: input.requestId, batch_id: input.batchId, status: "requested" })
    .count<{ count: string }>("* as count")
    .first()) as { count: string } | undefined;
  const requestedRemaining = Number(requestedCount?.count ?? 0);

  const requiresAttachment = await trx("pending_items")
    .where({ request_id: input.requestId, batch_id: input.batchId, request_attachment: true })
    .first("pending_item_id");
  const attachmentSatisfied =
    !requiresAttachment ||
    (await countAttachmentsByBatchId(input.batchId, input.requestId, trx)) > 0;

  const nextStatusName = input.decideStatus({
    requestedRemaining,
    attachmentSatisfied,
    currentStatusName: current.statusName,
  });

  if (nextStatusName) {
    const statusId = await findStatusIdByName(nextStatusName, trx);
    await updateRequestStatusId(trx, input.requestId, statusId, input.actorEmail ?? "requester");
    await recordAudit(trx, {
      entityType: "request",
      actionType: "request.status_change",
      entityId: input.protocol,
      userId: null,
      previousValue: current.statusName,
      newValue: nextStatusName,
      note: "pendencia respondida completa",
      changeOrigin: "system",
    });
  }

  const updated = (await trx("pending_items")
    .where({ pending_item_id: input.pendingItemId })
    .first("*")) as unknown as Record<string, unknown>;

  return { row: mapPendingItemRow(updated), auditId };
}

export async function addPendingItemAttachmentTx(input: {
  requestId: string;
  pendingItemId: string;
  saved: SavedPendingAttachment;
  ip: string | undefined;
}): Promise<void> {
  await db.transaction(async (trx) => {
    await lockActiveRequest(trx, input.requestId);
    await findCurrentPendingItem(trx, input.requestId, input.pendingItemId);
    await trx("attachments").insert({
      attachment_id: randomUUID(),
      request_id: input.requestId,
      pending_item_id: input.pendingItemId,
      file_name: input.saved.fileName,
      file_path: input.saved.storageKey,
      content_type: input.saved.mimeType,
      size_bytes: input.saved.sizeBytes,
      uploaded_by: "requester",
      uploaded_at: trx.fn.now(),
    });
    await recordAudit(trx, {
      entityType: "pending_item",
      actionType: "pending_item.attach",
      entityId: input.pendingItemId,
      userId: null,
      previousValue: null,
      newValue: input.saved.fileName,
      ipAddress: input.ip ?? null,
      changeOrigin: "requester",
    });
  });
}

export async function applyReviewDecisionsInTransaction(
  trx: Knex.Transaction,
  input: {
    requestId: string;
    protocol: string;
    batchId: string;
    decisions: ReviewDecisionInput[];
    requestAttachment: boolean | undefined;
    actor: PermissionActor;
    ip: string | undefined;
    decideStatus: (facts: ReviewFacts) => string | null;
  },
): Promise<{
  rows: PendingItemRow[];
  actionAuditIds: ReadonlyMap<ReviewDecision, string>;
}> {
  const current = await lockActiveRequest(trx, input.requestId);
  await assertPendingCustody(trx, current.professional_id, input.actor, "pending_item:review");
  const currentBatch = currentPendingRows(trx, input.requestId).where("batch_id", input.batchId);
  const decisionRows: Array<{ pending_item_id: string; status: string }> = await currentBatch
    .clone()
    .whereIn(
      "pending_item_id",
      input.decisions.map(({ id }) => id),
    )
    .select("pending_item_id", "status");
  const currentStatuses = new Map(
    decisionRows.map(({ pending_item_id, status }) => [pending_item_id, status]),
  );
  if (input.decisions.some(({ id }) => !currentStatuses.has(id))) {
    throw new AppError("Pendência de um ciclo anterior.", 409, "rf02_pending_historical");
  }
  if (typeof input.requestAttachment === "boolean") {
    await currentBatch.update({ request_attachment: input.requestAttachment });
  }
  let hasReopen = false;
  /** Primeiro `audit_id` de cada ação, na ordem em que apareceu na revisão. */
  const actionAuditIds = new Map<ReviewDecision, string>();
  const rememberFirstAudit = (action: ReviewDecision, auditId: string): void => {
    if (!actionAuditIds.has(action)) actionAuditIds.set(action, auditId);
  };

  for (const dec of input.decisions) {
    const currentStatus = currentStatuses.get(dec.id);
    if (dec.decision === "validate" && currentStatus === "validated") continue;
    if (dec.decision === "reopen" && currentStatus === "requested") continue;
    if (currentStatus !== "responded") throw new AppError("Estado da pendência mudou.", 409);

    if (dec.decision === "validate") {
      if (dec.fieldKey) {
        await applyFieldToRequest(trx, input.requestId, dec.fieldKey, dec.value);
      }
      await trx("pending_items")
        .where({ pending_item_id: dec.id })
        .update({ status: "validated", validated_at: trx.fn.now() });
      const validateAuditId = await recordAudit(trx, {
        entityType: "pending_item",
        actionType: "pending_item.validate",
        entityId: dec.id,
        userId: input.actor.id,
        previousValue: "responded",
        newValue: "validated",
        note: dec.note ?? null,
        ipAddress: input.ip ?? null,
        changeOrigin: "admin",
      });
      currentStatuses.set(dec.id, "validated");
      rememberFirstAudit("validate", validateAuditId);
    } else {
      hasReopen = true;
      await trx("pending_items")
        .where({ pending_item_id: dec.id })
        .update({
          status: "requested",
          comment: dec.comment,
          corrected_value: null,
          response_text: null,
          responded_at: null,
          validated_at: null,
          created_at: trx.raw("clock_timestamp()"),
        });
      const reopenAuditId = await recordAudit(trx, {
        entityType: "pending_item",
        actionType: "pending_item.reopen",
        entityId: dec.id,
        userId: input.actor.id,
        previousValue: "responded",
        newValue: "requested",
        note: dec.comment,
        changeOrigin: "admin",
      });
      currentStatuses.set(dec.id, "requested");
      rememberFirstAudit("reopen", reopenAuditId);
    }
  }

  const nextStatusName = input.decideStatus({ hasReopen });
  if (nextStatusName) {
    const statusId = await findStatusIdByName(nextStatusName, trx);
    await updateRequestStatusId(trx, input.requestId, statusId, input.actor.email);
    await recordPendingItemStatusChangeAudit(trx, {
      protocol: input.protocol,
      actorUserId: input.actor.id,
      previousStatusName: current.statusName,
      newStatusName: nextStatusName,
      note: "reopen pending",
      ip: input.ip,
    });
  }

  const rows = (await trx("pending_items")
    .whereIn(
      "pending_item_id",
      input.decisions.map((d) => d.id),
    )
    .select("*")) as unknown as Record<string, unknown>[];

  return { rows: mapPendingItemRows(rows), actionAuditIds };
}

/** Aplica `correctedValue` validado da revisão no campo correspondente da solicitação. */
async function applyFieldToRequest(
  trx: Knex.Transaction,
  requestId: string,
  fieldKey: string,
  value: unknown,
): Promise<void> {
  if (fieldKey.startsWith("requester.")) {
    const colMap: Record<string, string> = {
      "requester.fullName": "full_name",
      "requester.corporateEmail": "corporate_email",
      "requester.area": "area",
      "requester.department": "department",
      "requester.manager": "manager_name",
      "requester.additionalContact": "additional_contact",
    };
    const col = colMap[fieldKey];
    if (!col) return;
    let v = value as string | null;
    if (fieldKey === "requester.corporateEmail" && typeof v === "string") {
      v = v.trim().toLowerCase();
    }
    const requesterRow = await trx("requests")
      .where({ request_id: requestId })
      .first("requester_id");
    if (requesterRow) {
      await trx("requesters")
        .where({ requester_id: requesterRow.requester_id })
        .update({ [col]: v });
    }
    return;
  }

  if (fieldKey.startsWith("demand.")) {
    const colMap: Record<string, string> = {
      "demand.title": "title",
      "demand.requestType": "request_type",
      "demand.category": "category_id",
      "demand.processName": "process_name",
      "demand.description": "need_description",
      "demand.problem": "problem_opportunity",
      "demand.expectedResult": "expected_result",
      "demand.justification": "justification",
    };
    const col = colMap[fieldKey];
    if (!col) return;
    if (fieldKey === "demand.category") {
      const category = await trx("categories")
        .where({ name: value as string, status: "active" })
        .first("category_id");
      if (!category) throw new AppError("Categoria inválida — selecione uma opção da lista.", 400);
      await trx("requests")
        .where({ request_id: requestId })
        .update({ category_id: category.category_id });
    } else {
      await trx("requests")
        .where({ request_id: requestId })
        .update({ [col]: value as string });
    }
    return;
  }

  if (fieldKey.startsWith("operational.")) {
    if (fieldKey === "operational.hasManualControls") {
      if (value === false) {
        await trx("requests")
          .where({ request_id: requestId })
          .update({ has_manual_controls: false, manual_controls_detail: null });
      } else {
        await trx("requests")
          .where({ request_id: requestId })
          .update({ has_manual_controls: true, manual_controls_detail: value as string });
      }
      return;
    }
    const colMap: Record<string, string> = {
      "operational.processDescription": "process_description",
      "operational.processSteps": "process_steps",
      "operational.systemsUsed": "systems_used",
      "operational.executionFrequency": "execution_frequency",
      "operational.volumetry": "approximate_volume",
      "operational.peopleInvolved": "people_involved",
      "operational.averageExecutionTime": "average_duration",
      "operational.monthlyEffortHours": "estimated_monthly_effort",
      "operational.mainRisks": "main_risks",
      "operational.clientImpact": "client_impact",
      "operational.operationalImpact": "operational_impact",
      "operational.desiredDeadline": "desired_deadline",
      "operational.perceivedCriticality": "perceived_criticality",
    };
    const col = colMap[fieldKey];
    if (!col) return;
    await trx("requests")
      .where({ request_id: requestId })
      .update({ [col]: value as never });
    return;
  }

  if (fieldKey.startsWith("complementary.")) {
    const flagMap: Record<string, { flag: string; detail: string }> = {
      "complementary.hasProcessDocumentation": {
        flag: "has_process_documentation",
        detail: "process_documentation_detail",
      },
      "complementary.hasSimilarSolution": {
        flag: "has_similar_solution",
        detail: "similar_solution_detail",
      },
      "complementary.dependsOnOtherAreas": {
        flag: "depends_on_other_areas",
        detail: "other_areas_detail",
      },
      "complementary.handlesRestrictedInfo": {
        flag: "handles_restricted_info",
        detail: "restricted_info_detail",
      },
    };
    const entry = flagMap[fieldKey];
    if (entry) {
      if (value === false) {
        await trx("requests")
          .where({ request_id: requestId })
          .update({ [entry.flag]: false, [entry.detail]: null });
      } else if (value === null) {
        await trx("requests")
          .where({ request_id: requestId })
          .update({ [entry.flag]: null, [entry.detail]: null });
      } else {
        await trx("requests")
          .where({ request_id: requestId })
          .update({ [entry.flag]: true, [entry.detail]: value as string });
      }
      return;
    }
    if (fieldKey === "complementary.additionalNotes") {
      await trx("requests")
        .where({ request_id: requestId })
        .update({ additional_notes: value as string | null });
    }
  }
}

// Helpers to map DB rows to PendingItem
export function mapRowToPendingItemBase(
  row: PendingItemRow,
): Omit<PendingItem, "responseAttachments"> {
  const currentValue: PendingFieldValue = row.current_value;
  return {
    id: row.pending_item_id,
    protocol: "", // preenchido pelo service com request.protocol
    batchId: row.batch_id,
    type: row.type,
    field: row.field_key
      ? {
          fieldKey: row.field_key,
          fieldLabel: row.field_label ?? row.field_key,
          currentValue,
        }
      : null,
    comment: row.comment ?? row.description ?? "",
    status: row.status,
    correctedValue: row.corrected_value,
    responseText: row.response_text,
    deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    respondedAt: row.responded_at ? new Date(row.responded_at).toISOString() : null,
    validatedAt: row.validated_at ? new Date(row.validated_at).toISOString() : null,
  };
}
