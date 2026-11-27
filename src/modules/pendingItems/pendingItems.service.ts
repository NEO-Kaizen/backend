import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { PermissionActor } from "../../shared/access/requestAccess.ts";
import {
  custodyFor,
  denyRequestAccess,
  hasResponsibleCustody,
  isRequesterOwner,
  permissionActorFromRequest,
} from "../../shared/access/requestAccess.ts";
import type { EffectivePermission } from "../../shared/catalog/permissionCatalog.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { getFieldSnapshot, isFieldKey, type FieldKey } from "../../shared/catalog/fieldCatalog.ts";
import * as repo from "./pendingItems.repository.ts";
import type { PendingItemInsert, ReviewDecisionInput } from "./pendingItems.repository.ts";
import type {
  PendingItem,
  CreatePendingItemsBody,
  ListPendingItemsResponse,
  ReviewPendingItemsBody,
} from "../DTOs/pendingItems/PendingItems.dto.ts";
import type { InternalRequestRow } from "../../shared/types/requests.ts";
import { findInternalRequestByProtocol } from "../requests/requests.repository.ts";
import type { RequestStatus } from "../../shared/types/requests.ts";
import { normalizeEmail, normalizeName } from "../../shared/utils/normalizeIdentity.ts";
import { getSolicitationMode } from "../portalConfig/portalConfig.repository.ts";
import { removeFiles, saveFiles } from "../../shared/storage/fileStorage.ts";
import type { AuthenticatedUser } from "../../shared/types/user.ts";
import { ALLOWED_MIMES, MAX_FILE_SIZE_BYTES } from "../../shared/middleware/upload.ts";
import type { CommittedNotification } from "../../shared/notifications/emitNotification.ts";
import { publishCommittedNotifications } from "../../shared/notifications/notificationEmitter.ts";
import {
  emitPendingItemNotifications,
  type PendingItemNotificationRequest,
} from "../../shared/notifications/pendingItemNotification.ts";
import {
  emitPendingItemRespondedNotification,
  type PendingItemRespondedAudience,
} from "../../shared/notifications/pendingItemRespondedNotification.ts";
import { findActiveAdminUserIds, findUserIdByEmail } from "../users/users.repository.ts";

const TERMINAL_STATUSES = new Set(["Concluído", "Cancelado"]);
const IN_TRIAGE_STATUS: RequestStatus = "Em triagem";
const PENDING_INFO_STATUS: RequestStatus = "Pendente de informações";

/**
 * Relê a solicitação dentro da transação para que uma correção de título
 * validada na mesma revisão apareça no Payload.
 */
async function readPendingItemNotificationRequest(
  trx: Knex.Transaction,
  requestId: string,
): Promise<PendingItemNotificationRequest> {
  const request = await repo.findRequestById(requestId, trx);
  if (!request) throw new AppError("Solicitação não encontrada", 404);
  return {
    requestId: request.request_id,
    requesterUserId: request.requester_user_id,
    pointer: { protocol: request.protocol, title: request.title },
  };
}

/**
 * Executa o evento de negócio e publica as Notificações somente após o commit
 * (ADR-0001); se a transação falhar, nada é publicado.
 */
async function commitPendingItemAction<TResult>(
  action: (trx: Knex.Transaction) => Promise<{
    result: TResult;
    notifications: readonly CommittedNotification[];
  }>,
): Promise<TResult> {
  const { result, notifications } = await db.transaction(action);
  publishCommittedNotifications(notifications);
  return result;
}

function responseChangeOrigin(caller: PendingCaller): "admin" | "requester" {
  return caller.user !== undefined ? "admin" : "requester";
}

/**
 * Ator da Notificação. Sem sessão, a identidade pública representa o
 * solicitante vinculado; quando não há vínculo, o e-mail verificado identifica
 * uma eventual conta do mesmo dono para a autoexclusão.
 */
async function resolveResponseActorUserId(
  trx: Knex.Transaction,
  caller: PendingCaller,
  request: repo.RequestRef,
): Promise<number | null> {
  if (caller.user !== undefined) return Number(caller.user.id);
  if (request.requester_user_id !== null) return request.requester_user_id;
  return findUserIdByEmail(trx, request.requester_email);
}

/** Remove o ator e duplicatas antes de montar o Evento. */
function uniqueOtherRecipients(userIds: readonly number[], actorUserId: number | null): number[] {
  return [...new Set(userIds)].filter((userId) => userId !== actorUserId);
}

async function resolvePendingItemRespondedAudience(
  trx: Knex.Transaction,
  requestId: string,
  actorUserId: number | null,
): Promise<PendingItemRespondedAudience> {
  const assigneeUserId = await repo.findAssigneeUserIdByRequestId(trx, requestId);
  if (assigneeUserId !== null) {
    return { kind: "assignee", userId: assigneeUserId };
  }
  return {
    kind: "active_admins",
    userIds: uniqueOtherRecipients(await findActiveAdminUserIds(trx), actorUserId),
  };
}

function normalizeSummaryFieldKey(fieldKey: string): string {
  return fieldKey.trim();
}

async function buildPendingItems(
  protocol: string,
  rows: repo.PendingItemRow[],
): Promise<PendingItem[]> {
  const bases = rows.map((row) => {
    const base = repo.mapRowToPendingItemBase(row);
    base.protocol = protocol;
    return base;
  });
  const attachmentsByItem = await repo.findAttachmentsByPendingItemIds(bases.map((b) => b.id));

  const result: PendingItem[] = [];
  for (const base of bases) {
    const atts = attachmentsByItem.get(base.id) ?? [];
    const attachments = atts.map((a) => ({
      fileName: a["file_name"] as string,
      mimeType: a["content_type"] as string,
      sizeBytes: Number(a["size_bytes"]),
      downloadUrl: null as string | null,
      canDownload: false,
    }));

    let currentValue = base.field?.currentValue ?? null;
    if (currentValue !== null && typeof currentValue === "string") {
      try {
        const parsed = JSON.parse(currentValue as unknown as string);
        if (typeof parsed !== "object" || parsed === null)
          currentValue = parsed as string | number | boolean | null;
      } catch {
        // mantém string
      }
    }
    if (base.field) base.field.currentValue = currentValue;

    let corrected = base.correctedValue;
    if (corrected !== null && typeof corrected === "string") {
      try {
        const parsed = JSON.parse(corrected as unknown as string);
        if (typeof parsed !== "object" || parsed === null)
          corrected = parsed as string | number | boolean | null;
      } catch {
        // mantém string
      }
    }
    base.correctedValue = corrected;

    result.push({ ...base, responseAttachments: attachments });
  }
  return result;
}

export async function createPendingItems(
  protocol: string,
  body: CreatePendingItemsBody,
  actor: PermissionActor,
  ip: string | undefined,
): Promise<{ batchId: string; requestAttachment: boolean; items: PendingItem[] }> {
  const request = await repo.findRequestByProtocol(protocol);
  if (!request) {
    return denyRequestAccess(protocol, actor.id, ip, "pending_item:write sem solicitação");
  }
  if (!hasResponsibleCustody(actor, "pending_item:write", request.responsible_user_id)) {
    return denyRequestAccess(request.protocol, actor.id, ip, "pending_item:write sem custódia", [
      "pending_item:write",
    ]);
  }
  if (TERMINAL_STATUSES.has(request.status)) {
    throw new AppError("Solicitação já concluída ou cancelada", 409);
  }
  if (await repo.hasOpenPending(request.request_id)) {
    throw new AppError("Já existe uma pendência em aberto para este protocolo", 409);
  }

  const observation = body.observation?.trim() ?? "";
  const items = body.items ?? [];
  const hasObservation = observation.length > 0;
  const hasItems = items.length > 0;
  if (!hasObservation && !hasItems) {
    throw new AppError("Campos obrigatórios ausentes: observation, items", 400);
  }
  if (hasObservation && observation.length > 2000) {
    throw new AppError("Campos inválidos: observation — Máximo de 2.000 caracteres.", 400);
  }

  let internalRow: InternalRequestRow | null = null;
  if (hasItems) {
    const raw = (await findInternalRequestByProtocol(
      protocol,
    )) as unknown as InternalRequestRow | null;
    if (!raw) throw new AppError("Solicitação não encontrada", 404);
    internalRow = raw;

    for (const item of items) {
      const fieldKey = normalizeSummaryFieldKey(item.fieldKey);
      if (!isFieldKey(fieldKey)) {
        throw new AppError(`Campos inválidos: fieldKey — ${fieldKey} não está no catálogo`, 400);
      }
      if (!item.comment || item.comment.trim().length === 0) {
        throw new AppError("Campos inválidos: comment — Campo obrigatório.", 400);
      }
      if (item.comment.trim().length > 2000) {
        throw new AppError("Campos inválidos: comment — Máximo de 2.000 caracteres.", 400);
      }
      if (
        (fieldKey === "requester.fullName" || fieldKey === "requester.corporateEmail") &&
        request.requester_user_id !== null
      ) {
        throw new AppError(
          `Campos inválidos: fieldKey — ${fieldKey} só pode ser solicitado para solicitação pública`,
          400,
        );
      }
    }
  }

  const batchId = randomUUID();
  const requestAttachment = body.requestAttachment ?? false;

  const rows: PendingItemInsert[] = [];
  if (hasObservation) {
    rows.push({
      request_id: request.request_id,
      batch_id: batchId,
      type: "observation",
      field_key: null,
      field_label: null,
      current_value: null,
      comment: observation,
      description: observation,
      request_attachment: requestAttachment,
      created_by: actor.email,
    });
  }
  for (const item of items) {
    const fieldKey = normalizeSummaryFieldKey(item.fieldKey) as FieldKey;
    const snapshot = internalRow
      ? getFieldSnapshot(fieldKey, internalRow)
      : { label: fieldKey, value: null };
    rows.push({
      request_id: request.request_id,
      batch_id: batchId,
      type: "field_edit",
      field_key: fieldKey,
      field_label: snapshot.label,
      current_value: JSON.stringify(snapshot.value),
      comment: item.comment.trim(),
      description: item.comment.trim(),
      request_attachment: requestAttachment,
      created_by: actor.email,
    });
  }

  const createdRows = await commitPendingItemAction(async (trx) => {
    const { rows: insertedRows, auditId } = await repo.createPendingItemsBatchInTransaction(trx, {
      requestId: request.request_id,
      protocol,
      batchId,
      rows,
      actor,
      ip,
    });

    const notifications = await emitPendingItemNotifications(trx, {
      request: await readPendingItemNotificationRequest(trx, request.request_id),
      actorUserId: actor.id,
      events: [{ action: "create", auditId }],
    });

    return { result: insertedRows, notifications };
  });

  const mapped = await buildPendingItems(protocol, createdRows);
  return { batchId, requestAttachment, items: mapped };
}

export type PendingCaller = {
  user?: AuthenticatedUser;
  permissions?: readonly EffectivePermission[];
  requesterIdentity?: { name: string; email: string } | null;
};

const TRACKING_INVALID_IDENTITY = "Valide seus dados para acompanhar esta solicitação.";

function isRequesterOf(request: repo.RequestRef, actor: PermissionActor): boolean {
  return isRequesterOwner(actor, {
    requesterUserId: request.requester_user_id,
    requesterEmail: request.requester_email,
  });
}

function assertPublicIdentity(
  request: repo.RequestRef,
  identity: { name: string; email: string } | null,
): void {
  if (!identity) {
    throw new AppError(TRACKING_INVALID_IDENTITY, 401);
  }

  const nameOk = normalizeName(request.requester_name) === normalizeName(identity.name);
  const emailOk = normalizeEmail(request.requester_email) === normalizeEmail(identity.email);

  if (!nameOk || !emailOk) {
    throw new AppError(TRACKING_INVALID_IDENTITY, 401);
  }
}

/**
 * Leitura da Pendência: a porta interna exige `pending_item:read` sob Custódia;
 * a porta do Solicitante aceita `pending_item:respond` em `own` sobre a própria
 * solicitação. Sem sessão, a identidade pública é validada como antes.
 */
async function requireReadableRequest(
  protocol: string,
  caller: PendingCaller,
  ip: string | undefined,
): Promise<repo.RequestRef> {
  const request = await repo.findRequestByProtocol(protocol);

  if (caller.user) {
    const actor = permissionActorFromRequest(caller);
    if (!request) {
      return denyRequestAccess(protocol, actor.id, ip, "pending_item:read sem solicitação");
    }

    const canReadAssigned = hasResponsibleCustody(
      actor,
      "pending_item:read",
      request.responsible_user_id,
    );
    const canRespondOwn =
      custodyFor(actor, "pending_item:respond") === "own" && isRequesterOf(request, actor);

    if (!canReadAssigned && !canRespondOwn) {
      return denyRequestAccess(request.protocol, actor.id, ip, "pending_item:read sem custódia", [
        "pending_item:read",
      ]);
    }

    return request;
  }

  if (!request) {
    throw new AppError(TRACKING_INVALID_IDENTITY, 401);
  }
  assertPublicIdentity(request, caller.requesterIdentity ?? null);
  return request;
}

/**
 * Resposta e anexo pela Posse: qualquer sessão passa pelo vínculo
 * `requester_user_id`/e-mail; a porta pública continua validando nome+e-mail.
 */
async function requireOwnedRequest(
  protocol: string,
  caller: PendingCaller,
  ip: string | undefined,
  detail: string,
): Promise<{ request: repo.RequestRef; actorEmail: string | undefined }> {
  const request = await repo.findRequestByProtocol(protocol);

  if (caller.user) {
    const actor = permissionActorFromRequest(caller);
    if (!request) {
      return denyRequestAccess(protocol, actor.id, ip, `${detail} sem solicitação`);
    }
    if (!isRequesterOf(request, actor)) {
      return denyRequestAccess(request.protocol, actor.id, ip, detail, ["pending_item:respond"]);
    }
    return { request, actorEmail: actor.email };
  }

  if (!request) {
    throw new AppError(TRACKING_INVALID_IDENTITY, 401);
  }
  assertPublicIdentity(request, caller.requesterIdentity ?? null);
  return { request, actorEmail: undefined };
}

export async function listPendingItems(
  protocol: string,
  caller: PendingCaller,
  ip: string | undefined,
): Promise<ListPendingItemsResponse> {
  const request = await requireReadableRequest(protocol, caller, ip);
  const rows = await repo.findPendingItemsByRequestId(request.request_id);
  const items = await buildPendingItems(protocol, rows);

  if (rows.length === 0) {
    return { batchId: null, requestAttachment: false, items };
  }

  // Lote vigente = primeiro com item open (requested/responded); senão o mais
  // recente (rows em ordem cronológica asc). `requestAttachment` é uniforme no
  // lote (D-P8) — basta achar `true` em qualquer linha do lote alvo.
  const openRow = rows.find(
    (row) => row["status"] === "requested" || row["status"] === "responded",
  );
  const targetRow = openRow ?? rows[rows.length - 1];
  const batchId = (targetRow?.["batch_id"] as string | undefined) ?? null;
  const requestAttachment =
    batchId !== null &&
    rows.some((row) => row["batch_id"] === batchId && row["request_attachment"] === true);

  return { batchId, requestAttachment, items };
}

export async function respondPendingItem(
  protocol: string,
  pendingItemId: string,
  body: Record<string, unknown>,
  ip: string | undefined,
  caller: PendingCaller,
): Promise<PendingItem> {
  const { request, actorEmail } = await requireOwnedRequest(
    protocol,
    caller,
    ip,
    "pending_item:respond sem posse",
  );
  const row = await repo.findPendingItemById(pendingItemId);
  if (!row || (row["request_id"] as string) !== request.request_id) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  if ((row["status"] as string) !== "requested") {
    throw new AppError("Esta pendência já foi respondida.", 409);
  }
  const type = row["type"] as "field_edit" | "observation";

  let patch: Record<string, unknown>;
  if (type === "field_edit") {
    if (!Object.prototype.hasOwnProperty.call(body, "correctedValue")) {
      throw new AppError("Campos obrigatórios ausentes: correctedValue", 400);
    }
    if (body["correctedValue"] === undefined) {
      throw new AppError("Campos obrigatórios ausentes: correctedValue", 400);
    }
    if (Object.prototype.hasOwnProperty.call(body, "response")) {
      throw new AppError("Campos inválidos: response — não permitido para field_edit", 400);
    }
    patch = { corrected_value: JSON.stringify(body["correctedValue"]) };
  } else {
    if (!Object.prototype.hasOwnProperty.call(body, "response")) {
      throw new AppError("Campos obrigatórios ausentes: response", 400);
    }
    const response = body["response"] as string;
    if (typeof response !== "string" || response.trim().length === 0) {
      throw new AppError("Campos inválidos: response — Campo obrigatório.", 400);
    }
    if (response.trim().length > 2000) {
      throw new AppError("Campos inválidos: response — Máximo de 2.000 caracteres.", 400);
    }
    if (Object.prototype.hasOwnProperty.call(body, "correctedValue")) {
      throw new AppError("Campos inválidos: correctedValue — não permitido para observation", 400);
    }
    patch = { response_text: response.trim() };
  }

  const updated = await db.transaction(async (trx) => {
    const result = await repo.applyPendingItemResponse(trx, {
      requestId: request.request_id,
      protocol,
      pendingItemId,
      batchId: row["batch_id"] as string,
      patch: patch as repo.PendingItemResponsePatch,
      actorEmail,
      changeOrigin: responseChangeOrigin(caller),
      ip,
      decideStatus: (facts) =>
        facts.requestedRemaining === 0 &&
        facts.attachmentSatisfied &&
        facts.currentStatusName !== IN_TRIAGE_STATUS
          ? IN_TRIAGE_STATUS
          : null,
    });

    const actorUserId = await resolveResponseActorUserId(trx, caller, request);
    const audience = await resolvePendingItemRespondedAudience(
      trx,
      request.request_id,
      actorUserId,
    );

    const committedNotifications = await emitPendingItemRespondedNotification(trx, {
      auditId: result.auditId,
      requestId: request.request_id,
      requestPointer: {
        protocol: request.protocol,
        title: request.title,
      },
      actorUserId,
      audience,
    });

    publishCommittedNotifications(committedNotifications);
    return result.row;
  });

  const list = await buildPendingItems(protocol, [updated]);
  return list[0] as PendingItem;
}

export async function addAttachment(
  protocol: string,
  pendingItemId: string,
  file: Express.Multer.File,
  ip: string | undefined,
  caller: PendingCaller,
): Promise<{
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  canDownload: boolean;
}> {
  const { request } = await requireOwnedRequest(
    protocol,
    caller,
    ip,
    "pending_item:respond sem posse",
  );
  const row = await repo.findPendingItemById(pendingItemId);
  if (!row || (row["request_id"] as string) !== request.request_id) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  if (!ALLOWED_MIMES.has(file.mimetype)) {
    throw new AppError(
      "Formato de arquivo não permitido. Aceitos: PDF, DOCX, XLSX, PNG e JPG.",
      400,
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError("Cada anexo deve ter no máximo 10MB.", 400);
  }

  // save fora da trx (padrão requests.service) — trx só segura insert+audit
  const [saved] = await saveFiles([file]);
  if (!saved) throw new AppError("Falha ao salvar anexo", 500);

  try {
    await repo.addPendingItemAttachmentTx({
      requestId: request.request_id,
      pendingItemId,
      saved,
      ip,
    });
  } catch (err) {
    await removeFiles([saved]);
    throw err;
  }

  return {
    fileName: saved.fileName,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
    downloadUrl: null,
    canDownload: false,
  };
}

function validateCorrectedValueForField(fieldKey: string, value: unknown): void {
  if (fieldKey === "operational.peopleInvolved" || fieldKey === "operational.monthlyEffortHours") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new AppError(`Campos inválidos: correctedValue — ${fieldKey} deve ser número`, 400);
    }
    if (value <= 0 && fieldKey === "operational.peopleInvolved") {
      throw new AppError("Campos inválidos: correctedValue — peopleInvolved > 0", 400);
    }
    return;
  }
  if (fieldKey === "operational.hasManualControls") {
    if (value !== false && (typeof value !== "string" || (value as string).trim() === "")) {
      throw new AppError(
        "Campos inválidos: correctedValue — hasManualControls deve ser false ou texto não vazio",
        400,
      );
    }
    return;
  }
  if (fieldKey === "operational.desiredDeadline") {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new AppError(
        "Campos inválidos: correctedValue — desiredDeadline deve ser yyyy-mm-dd",
        400,
      );
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError("Campos inválidos: correctedValue — data inválida", 400);
    }
    return;
  }
  if (fieldKey === "operational.operationalImpact") {
    if (!["Baixo", "Médio", "Alto", "Crítico"].includes(value as string)) {
      throw new AppError("Campos inválidos: correctedValue — operationalImpact inválido", 400);
    }
    return;
  }
  if (fieldKey === "operational.perceivedCriticality") {
    if (!["Baixa", "Média", "Alta", "Crítica"].includes(value as string)) {
      throw new AppError("Campos inválidos: correctedValue — perceivedCriticality inválido", 400);
    }
    return;
  }
  if (value !== null && typeof value !== "string") {
    throw new AppError(`Campos inválidos: correctedValue — ${fieldKey} deve ser texto`, 400);
  }
  if (typeof value === "string" && value.trim() === "") {
    const nullableComplement = new Set([
      "requester.department",
      "requester.additionalContact",
      "complementary.additionalNotes",
      "complementary.hasProcessDocumentation",
      "complementary.hasSimilarSolution",
      "complementary.dependsOnOtherAreas",
      "complementary.handlesRestrictedInfo",
    ]);
    if (!nullableComplement.has(fieldKey)) {
      throw new AppError(`Campos inválidos: correctedValue — ${fieldKey} não pode ser vazio`, 400);
    }
  }
}

function parseCorrectedValue(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function reviewPendingItems(
  protocol: string,
  body: ReviewPendingItemsBody,
  actor: PermissionActor,
  ip: string | undefined,
): Promise<{ batchId: string; items: PendingItem[] }> {
  const request = await repo.findRequestByProtocol(protocol);
  if (!request) {
    return denyRequestAccess(protocol, actor.id, ip, "pending_item:review sem solicitação");
  }
  if (!hasResponsibleCustody(actor, "pending_item:review", request.responsible_user_id)) {
    return denyRequestAccess(request.protocol, actor.id, ip, "pending_item:review sem custódia", [
      "pending_item:review",
    ]);
  }

  const batchId = body.batchId.trim();
  const batchRows = await repo.findPendingItemsByBatchId(batchId, request.request_id);
  if (batchRows.length === 0) throw new AppError("Lote não encontrado", 404);

  const byId = new Map(batchRows.map((row) => [row["pending_item_id"] as string, row]));

  for (const decision of body.items) {
    const row = byId.get(decision.id);
    if (!row) throw new AppError(`Item ${decision.id} não pertence ao lote`, 404);
    const status = row["status"] as string;
    // idempotência: reenvio mesmo id+decision não duplica audit nem altera estado
    if (decision.decision === "validate" && status === "validated") continue;
    if (decision.decision === "reopen" && status === "requested") continue;
    if (status !== "responded") {
      throw new AppError(`Item ${decision.id} não está com status responded`, 409);
    }
    if (decision.decision === "reopen" && decision.comment.trim() === "") {
      throw new AppError("Campos obrigatórios ausentes: comment", 400);
    }
  }

  const decisions: ReviewDecisionInput[] = body.items.map((decision) => {
    if (decision.decision === "reopen") {
      return { id: decision.id, decision: "reopen", comment: decision.comment };
    }
    const row = byId.get(decision.id) as Record<string, unknown>;
    const fieldKey = (row["field_key"] as string | null) ?? null;
    let value: unknown = null;
    if (fieldKey) {
      value = parseCorrectedValue(row["corrected_value"] as string | null);
      validateCorrectedValueForField(fieldKey, value);
    }
    return { id: decision.id, decision: "validate", note: decision.note ?? null, fieldKey, value };
  });

  const decidedRows = await commitPendingItemAction(async (trx) => {
    const { rows: reviewedRows, actionAuditIds } = await repo.applyReviewDecisionsInTransaction(
      trx,
      {
        requestId: request.request_id,
        protocol,
        batchId,
        decisions,
        requestAttachment: body.requestAttachment,
        actor,
        ip,
        currentStatusName: request.status,
        decideStatus: (facts) => (facts.hasReopen ? PENDING_INFO_STATUS : null),
      },
    );

    const notifications = await emitPendingItemNotifications(trx, {
      request: await readPendingItemNotificationRequest(trx, request.request_id),
      actorUserId: actor.id,
      events: [...actionAuditIds].map(([action, auditId]) => ({ action, auditId })),
    });

    return { result: reviewedRows, notifications };
  });

  const mapped = await buildPendingItems(protocol, decidedRows);
  return { batchId, items: mapped };
}

export async function verifyPublicAccess(
  protocol: string,
  name: string,
  email: string,
  providedProtocol: string,
): Promise<void> {
  const mode = await getSolicitationMode();
  if (mode !== "PUBLIC") throw new AppError("Verificação indisponível no modo atual", 403);
  if (providedProtocol.trim() !== protocol) {
    throw new AppError("Valide seus dados para acompanhar esta solicitação.", 401);
  }
  const found = await repo.findRequestByProtocol(protocol);
  if (!found) throw new AppError("Valide seus dados para acompanhar esta solicitação.", 401);
  const nameOk = normalizeName(found.requester_name) === normalizeName(name);
  const emailOk = normalizeEmail(found.requester_email) === normalizeEmail(email);
  if (!nameOk || !emailOk) {
    throw new AppError("Valide seus dados para acompanhar esta solicitação.", 401);
  }
}
