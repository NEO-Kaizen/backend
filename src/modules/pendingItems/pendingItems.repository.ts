import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import type { PendingItem } from "../DTOs/pendingItems/PendingItems.dto.ts";

export interface RequestRef {
  request_id: string;
  protocol: string;
  status: string;
  status_id: number;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
}

export async function findRequestByProtocol(
  protocol: string,
  trx?: Knex.Transaction,
): Promise<RequestRef | null> {
  const conn = trx ?? db;
  const row = await conn("requests")
    .join("statuses", "statuses.status_id", "requests.status_id")
    .join("requesters", "requesters.requester_id", "requests.requester_id")
    .where("requests.protocol", protocol.trim())
    .first({
      request_id: "requests.request_id",
      protocol: "requests.protocol",
      status: "statuses.name",
      status_id: "statuses.status_id",
      requester_user_id: "requests.requester_user_id",
      requester_name: "requesters.full_name",
      requester_email: "requesters.corporate_email",
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
    .where("requests.request_id", requestId)
    .first({
      request_id: "requests.request_id",
      protocol: "requests.protocol",
      status: "statuses.name",
      status_id: "statuses.status_id",
      requester_user_id: "requests.requester_user_id",
      requester_name: "requesters.full_name",
      requester_email: "requesters.corporate_email",
    });
  return (row as RequestRef | undefined) ?? null;
}

export async function hasOpenPending(requestId: string, trx?: Knex.Transaction): Promise<boolean> {
  const conn = trx ?? db;
  const row = await conn("pending_items")
    .where({ request_id: requestId })
    .whereIn("status", ["requested", "responded"])
    .first("pending_item_id");
  return row !== undefined;
}

export async function findPendingItemsByRequestId(
  requestId: string,
  trx?: Knex.Transaction,
): Promise<Record<string, unknown>[]> {
  const conn = trx ?? db;
  return (await conn("pending_items")
    .where("pending_items.request_id", requestId)
    .orderBy("pending_items.created_at", "asc")
    .select("*")) as unknown as Record<string, unknown>[];
}

export async function findPendingItemById(
  pendingItemId: string,
  trx?: Knex.Transaction,
): Promise<Record<string, unknown> | null> {
  const conn = trx ?? db;
  const row = await conn("pending_items").where({ pending_item_id: pendingItemId }).first("*");
  return (row as unknown as Record<string, unknown> | undefined) ?? null;
}

/** Busca em lote — evita N+1 no `buildPendingItems`. */
export async function findAttachmentsByPendingItemIds(
  pendingItemIds: string[],
  trx?: Knex.Transaction,
): Promise<Map<string, Record<string, unknown>[]>> {
  const grouped = new Map<string, Record<string, unknown>[]>();
  if (pendingItemIds.length === 0) return grouped;

  const conn = trx ?? db;
  const rows = (await conn("attachments")
    .whereIn("pending_item_id", pendingItemIds)
    .orderBy("uploaded_at", "asc")
    .select("*")) as unknown as Record<string, unknown>[];

  for (const row of rows) {
    const key = row["pending_item_id"] as string;
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
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
  const rows = (await conn("pending_items")
    .where({ request_id: requestId })
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

  const rows = (await conn("pending_items")
    .where({ request_id: requestId })
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
  const row = (await conn("pending_items")
    .where({ request_id: requestId, status: "responded" })
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

// --- Use-cases transacionais (transação pertence ao repository; service só decide) ---

/** Linha de `pending_items` a inserir — ids/timestamps/estado são preenchidos aqui. */
export type PendingItemInsert = {
  request_id: string;
  batch_id: string;
  type: "field_edit" | "observation";
  field_key: string | null;
  field_label: string | null;
  current_value: string | null;
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

async function currentRequestStatus(
  trx: Knex.Transaction,
  requestId: string,
): Promise<{ statusName: string; statusId: number }> {
  const row = await trx("requests")
    .join("statuses", "statuses.status_id", "requests.status_id")
    .where("requests.request_id", requestId)
    .first({ statusName: "statuses.name", statusId: "statuses.status_id" });
  if (!row) throw new AppError("Solicitação não encontrada", 404);
  return row as { statusName: string; statusId: number };
}

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

export async function findProfessionalIdByUserId(userId: number): Promise<string | null> {
  const row = await db("details_professional").where({ user_id: userId }).first("professional_id");
  return (row?.professional_id as string | undefined) ?? null;
}

export async function findProfessionalIdByRequestId(requestId: string): Promise<string | null> {
  const row = await db("requests").where({ request_id: requestId }).first("professional_id");
  return (row?.professional_id as string | undefined) ?? null;
}

export async function findPendingItemsByBatchId(
  batchId: string,
  requestId: string,
  trx?: Knex.Transaction,
): Promise<Record<string, unknown>[]> {
  const conn = trx ?? db;
  return (await conn("pending_items")
    .where({ batch_id: batchId, request_id: requestId })
    .orderBy("created_at", "asc")
    .select("*")) as unknown as Record<string, unknown>[];
}

export async function createPendingItemsBatch(input: {
  requestId: string;
  protocol: string;
  batchId: string;
  rows: PendingItemInsert[];
  actor: { id: number; email: string };
  ip: string | undefined;
}): Promise<Record<string, unknown>[]> {
  return db.transaction(async (trx) => {
    const toInsert = input.rows.map((row) => ({
      ...row,
      pending_item_id: randomUUID(),
      status: "requested",
      corrected_value: null,
      response_text: null,
      deadline: null,
      responded_at: null,
      validated_at: null,
      created_at: trx.fn.now(),
    }));

    if (toInsert.length > 0) {
      await trx("pending_items").insert(toInsert);
    }

    const current = await currentRequestStatus(trx, input.requestId);
    const pendingStatusId = await findStatusIdByName("Pendente de informações", trx);

    if (current.statusId !== pendingStatusId) {
      await updateRequestStatusId(trx, input.requestId, pendingStatusId, input.actor.email);
      await recordAudit(trx, {
        entityType: "pending_item",
        actionType: "pending_item.create",
        entityId: input.protocol,
        userId: input.actor.id,
        previousValue: current.statusName,
        newValue: "Pendente de informações",
        note: input.ip ?? null,
        changeOrigin: "admin",
      });
      await recordAudit(trx, {
        entityType: "request",
        actionType: "request.status_change",
        entityId: input.protocol,
        userId: input.actor.id,
        previousValue: current.statusName,
        newValue: "Pendente de informações",
        note: input.ip ?? null,
        changeOrigin: "system",
      });
    } else {
      await recordAudit(trx, {
        entityType: "pending_item",
        actionType: "pending_item.create",
        entityId: input.protocol,
        userId: input.actor.id,
        previousValue: null,
        newValue: input.batchId,
        note: input.ip ?? null,
        changeOrigin: "admin",
      });
    }

    return (await trx("pending_items")
      .where({ batch_id: input.batchId, request_id: input.requestId })
      .select("*")
      .orderBy("created_at", "asc")) as unknown as Record<string, unknown>[];
  });
}

export async function respondPendingItemTx(input: {
  requestId: string;
  protocol: string;
  pendingItemId: string;
  batchId: string;
  patch: Record<string, unknown>;
  actorEmail: string | undefined;
  isInternal: boolean;
  ip: string | undefined;
  decideStatus: (facts: RespondFacts) => string | null;
}): Promise<Record<string, unknown>> {
  return db.transaction(async (trx) => {
    const row = (await trx("pending_items")
      .where({ pending_item_id: input.pendingItemId })
      .first("*")) as Record<string, unknown> | undefined;
    if (!row) throw new AppError("Solicitação não encontrada", 404);
    if ((row.status as string) !== "requested") {
      throw new AppError("Esta pendência já foi respondida.", 409);
    }

    await trx("pending_items")
      .where({ pending_item_id: input.pendingItemId })
      .update({
        ...input.patch,
        status: "responded",
        responded_at: trx.fn.now(),
      });

    await recordAudit(trx, {
      entityType: "pending_item",
      actionType: "pending_item.respond",
      entityId: input.pendingItemId,
      userId: null,
      previousValue: "requested",
      newValue: "responded",
      note: input.ip ?? null,
      changeOrigin: input.isInternal ? "admin" : "requester",
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

    const current = await currentRequestStatus(trx, input.requestId);
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

    return (await trx("pending_items")
      .where({ pending_item_id: input.pendingItemId })
      .first("*")) as Record<string, unknown>;
  });
}

export async function addPendingItemAttachmentTx(input: {
  requestId: string;
  pendingItemId: string;
  saved: SavedPendingAttachment;
  ip: string | undefined;
}): Promise<void> {
  await db.transaction(async (trx) => {
    await trx("attachments").insert({
      attachment_id: randomUUID(),
      request_id: input.requestId,
      pending_item_id: input.pendingItemId,
      file_name: input.saved.fileName,
      file_path: input.saved.storageKey,
      content_type: input.saved.mimeType,
      size_bytes: input.saved.sizeBytes,
      is_restricted: false,
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
      note: input.ip ?? null,
      changeOrigin: "requester",
    });
  });
}

export async function applyReviewDecisionsTx(input: {
  requestId: string;
  protocol: string;
  batchId: string;
  decisions: ReviewDecisionInput[];
  requestAttachment: boolean | undefined;
  actor: { id: number; email: string };
  ip: string | undefined;
  currentStatusName: string;
  decideStatus: (facts: ReviewFacts) => string | null;
}): Promise<Record<string, unknown>[]> {
  return db.transaction(async (trx) => {
    if (typeof input.requestAttachment === "boolean") {
      await trx("pending_items")
        .where({ batch_id: input.batchId, request_id: input.requestId })
        .update({ request_attachment: input.requestAttachment });
    }

    let hasReopen = false;

    for (const dec of input.decisions) {
      const row = (await trx("pending_items").where({ pending_item_id: dec.id }).first("*")) as
        Record<string, unknown> | undefined;
      if (!row) continue;

      const currentStatus = row.status as string;
      if (dec.decision === "validate" && currentStatus === "validated") continue;
      if (dec.decision === "reopen" && currentStatus === "requested") continue;

      if (dec.decision === "validate") {
        if (dec.fieldKey) {
          await applyFieldToRequest(trx, input.requestId, dec.fieldKey, dec.value);
        }
        await trx("pending_items")
          .where({ pending_item_id: dec.id })
          .update({ status: "validated", validated_at: trx.fn.now() });
        await recordAudit(trx, {
          entityType: "pending_item",
          actionType: "pending_item.validate",
          entityId: dec.id,
          userId: input.actor.id,
          previousValue: "responded",
          newValue: "validated",
          note: dec.note ?? input.ip ?? null,
          changeOrigin: "admin",
        });
      } else {
        hasReopen = true;
        await trx("pending_items").where({ pending_item_id: dec.id }).update({
          status: "requested",
          comment: dec.comment,
          corrected_value: null,
          response_text: null,
          responded_at: null,
          validated_at: null,
          created_at: trx.fn.now(),
        });
        await recordAudit(trx, {
          entityType: "pending_item",
          actionType: "pending_item.reopen",
          entityId: dec.id,
          userId: input.actor.id,
          previousValue: "responded",
          newValue: "requested",
          note: dec.comment,
          changeOrigin: "admin",
        });
      }
    }

    const nextStatusName = input.decideStatus({ hasReopen });
    if (nextStatusName) {
      const statusId = await findStatusIdByName(nextStatusName, trx);
      await updateRequestStatusId(trx, input.requestId, statusId, input.actor.email);
      await recordAudit(trx, {
        entityType: "request",
        actionType: "request.status_change",
        entityId: input.protocol,
        userId: input.actor.id,
        previousValue: input.currentStatusName,
        newValue: nextStatusName,
        note: "reopen pending",
        changeOrigin: "system",
      });
    }

    return (await trx("pending_items")
      .whereIn(
        "pending_item_id",
        input.decisions.map((d) => d.id),
      )
      .select("*")) as unknown as Record<string, unknown>[];
  });
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
  row: Record<string, unknown>,
): Omit<PendingItem, "responseAttachments"> {
  return {
    id: row["pending_item_id"] as string,
    protocol: "", // preenchido pelo service com request.protocol
    batchId: row["batch_id"] as string,
    type: row["type"] as "field_edit" | "observation",
    field: (row["field_key"] as string | null)
      ? {
          fieldKey: row["field_key"] as string,
          fieldLabel: (row["field_label"] as string) ?? (row["field_key"] as string),
          currentValue: (row["current_value"] as string | number | boolean | null) ?? null,
        }
      : null,
    comment: (row["comment"] as string) ?? (row["description"] as string) ?? "",
    status: row["status"] as "requested" | "responded" | "validated",
    correctedValue: (row["corrected_value"] as string | number | boolean | null) ?? null,
    responseText: (row["response_text"] as string | null) ?? null,
    deadline: row["deadline"]
      ? new Date(row["deadline"] as string).toISOString().slice(0, 10)
      : null,
    createdAt: row["created_at"]
      ? new Date(row["created_at"] as string).toISOString()
      : new Date().toISOString(),
    respondedAt: row["responded_at"] ? new Date(row["responded_at"] as string).toISOString() : null,
    validatedAt: row["validated_at"] ? new Date(row["validated_at"] as string).toISOString() : null,
  };
}
