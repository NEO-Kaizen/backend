import { randomUUID } from "node:crypto";
import db from "../../../database/conection.ts";
import { recordAudit } from "../../../shared/audit/auditLogger.ts";
import { recordAccessDeniedAttempt } from "../../../shared/audit/accessDenied.ts";
import {
  hasAdministrativeAuditOrigin,
  hasPermissionCustody,
} from "../../../shared/access/custody.ts";
import type { PermissionKey } from "../../../shared/catalog/permissionCatalog.ts";
import { AppError } from "../../../shared/errors/AppError.ts";
import { ValidationError } from "../../../shared/errors/ValidationError.ts";
import type { CommittedNotification } from "../../../shared/notifications/emitNotification.ts";
import { publishCommittedNotifications } from "../../../shared/notifications/notificationEmitter.ts";
import {
  emitStatusChangedNotification,
  type StatusTarget,
} from "../../../shared/notifications/statusChangedNotification.ts";
import type { CreateTriagePayload, TriageAssessment } from "./triage.schema.ts";
import type { NamedPermissionActor } from "../../../shared/access/permissionActor.ts";
import * as repository from "./triage.repository.ts";
import type { RequestContextRow, StatusRow } from "./triage.repository.ts";

/** Custódia da Triagem: user_id ligado a `requests.professional_id` (§5 RBAC). */
function hasTriageCustody(
  actor: NamedPermissionActor,
  key: PermissionKey,
  request: Pick<RequestContextRow, "assignee_user_id" | "mapping_user_id">,
): boolean {
  return hasPermissionCustody(actor.permissions, key, { userId: actor.id, email: actor.email }, [
    request.assignee_user_id,
    request.mapping_user_id,
  ]);
}

function recordTriageAccessDenied(
  protocol: string,
  actor: NamedPermissionActor,
  ipAddress: string | undefined,
  detail: string,
  deniedPermissionKeys: readonly PermissionKey[],
): Promise<void> {
  return recordAccessDeniedAttempt({
    entityType: "request",
    entityId: protocol,
    userId: actor.id,
    note: `Triagem negada: ${detail}`,
    ipAddress,
    deniedPermissionKeys,
  });
}

interface CommitTriageDecisionInput {
  protocol: string;
  request: RequestContextRow;
  triage: TriageAssessment;
  categoryId: number | null;
  exitStatus: StatusRow;
  actor: NamedPermissionActor;
  ipAddress?: string;
}

/**
 * Persiste o veredito da Triagem, a transição de Status, a auditoria e a
 * Notificação na mesma transação; devolve as Notificações gravadas para o
 * aviso pós-commit.
 */
async function commitTriageDecision(
  input: CommitTriageDecisionInput,
): Promise<CommittedNotification[]> {
  const { protocol, request, triage, categoryId, exitStatus, actor, ipAddress } = input;

  return db.transaction(async (trx) => {
    await repository.insertTriage(request.request_id, triage, trx);
    await repository.applyRequestOutcome({
      protocol,
      categoryId,
      statusId: exitStatus.status_id,
      isStatusPublic: exitStatus.isPublic,
      lastTechnicalMessage: triage.lastTechnicalMessage,
      expectedStatusId: request.status_id,
      updatedBy: actor.email,
      trx,
    });

    const triageAuditId = await recordAudit(trx, {
      entityType: "request",
      entityId: protocol,
      actionType: "request.triage",
      userId: actor.id,
      previousValue: JSON.stringify({
        status: request.status_name,
        category: request.category_name,
      }),
      newValue: JSON.stringify({
        triageId: triage.id,
        exitStatus: triage.exitStatus,
        status: exitStatus.name,
      }),
      // `note` = justificativa interna (conclusão da triagem); o retorno
      // público só é persistido quando o status de saída é público.
      note: triage.conclusionJustification,
      lastTechnicalMessage: exitStatus.isPublic ? triage.lastTechnicalMessage : null,
      ipAddress,
      changeOrigin: hasAdministrativeAuditOrigin(actor.permissions) ? "admin" : "internal",
    });

    // Liberação automática do responsável na conclusão da triagem. Evento só
    // quando havia vínculo; `previousValue` segue a convenção de
    // `request.unassign` (user_id do responsável anterior). Origem `system`.
    if (request.professional_id !== null) {
      await recordAudit(trx, {
        entityType: "request",
        entityId: protocol,
        actionType: "request.unassign",
        userId: actor.id,
        previousValue: request.assignee_user_id === null ? null : String(request.assignee_user_id),
        newValue: null,
        ipAddress,
        changeOrigin: "system",
      });
    }

    const statusTarget: StatusTarget = {
      statusId: exitStatus.status_id,
      isPublic: exitStatus.isPublic,
      // A query de `resolveExitStatus` garante `is_restricted=false`; o valor
      // projetado evita que a regra de audiência dependa de um literal.
      isRestricted: exitStatus.isRestricted,
    };

    // A mudança efetiva e a elegibilidade (público e não restrito) são
    // decididas por `emitStatusChangedNotification`.
    return emitStatusChangedNotification(trx, {
      source: "triage_verdict",
      auditId: triageAuditId,
      requestId: request.request_id,
      protocol: request.protocol,
      title: request.title,
      newStatus: exitStatus.name,
      actorUserId: actor.id,
      requesterUserId: request.requester_user_id,
      previousStatusId: request.status_id,
      targetStatus: statusTarget,
    });
  });
}

export async function getTriage(
  protocol: string,
  actor: NamedPermissionActor,
  ipAddress?: string,
): Promise<TriageAssessment | null> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  const canAccess = hasTriageCustody(actor, "triage:read", request);
  if (!canAccess) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "sem Custódia para ler a Triagem", [
      "triage:read",
    ]);
    throw new AppError("Acesso negado a esta solicitação", 403);
  }

  return repository.findLatestTriage(protocol);
}

export async function createTriage(
  protocol: string,
  payload: CreateTriagePayload,
  actor: NamedPermissionActor,
  ipAddress?: string,
): Promise<TriageAssessment> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  // Status terminal não reabre o fluxo.
  if (request.status_is_terminal) {
    throw new AppError("Solicitação encerrada.", 422);
  }

  // O bypass administrativo vigente exige `request:status_override` global;
  // a Custódia de `triage:write` ainda é checada separadamente.
  if (request.status_is_restricted && !hasAdministrativeAuditOrigin(actor.permissions)) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "solicitação em Status restrito", [
      "request:status_override",
    ]);
    throw new AppError(
      "A Triagem não pode ser registrada enquanto a solicitação estiver em status restrito.",
      403,
      "INSUFFICIENT_ROLE_PERMISSIONS",
    );
  }

  const canAccess = hasTriageCustody(actor, "triage:write", request);
  if (!canAccess) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "sem Custódia da solicitação", [
      "triage:write",
    ]);
    throw new AppError(
      "Você não tem permissão ou Custódia para registrar a Triagem.",
      403,
      "INSUFFICIENT_ROLE_PERMISSIONS",
    );
  }

  // Regras condicionais (aderência/justificativa, categoria de destino,
  // complexidade, riscos, exitStatus não-vazio) já são validadas pelo
  // `superRefine` de `createTriagePayloadSchema` no controller. Aqui restam
  // apenas as resoluções contra o banco.

  const exitStatus = await repository.resolveExitStatus(payload.exitStatus);
  if (!exitStatus) {
    throw new ValidationError(
      {
        exitStatus:
          "Status de saída deve ser um status ativo com triageMode conclusion_only e isRestricted=false",
      },
      "Validação falhou",
    );
  }
  if (exitStatus.isPublic && payload.lastTechnicalMessage == null) {
    throw new ValidationError(
      {
        lastTechnicalMessage:
          "Retorno ao solicitante obrigatório para status público (1..4000 caracteres).",
      },
      "Validação falhou",
    );
  }

  let categoryId: number | null = null;
  let categoryName = "";
  if (payload.changeCategory === "Sim") {
    const newCategory = await repository.resolveCategoryId(payload.newCategory);
    if (!newCategory) {
      throw new ValidationError(
        { newCategory: "Categoria de destino inválida ou inativa" },
        "Validação falhou",
      );
    }
    categoryId = newCategory.category_id;
    // Persiste o nome canônico (contrato: name-string) mesmo quando o
    // cliente envia o id numérico (compat).
    categoryName = newCategory.name;
  }

  const triage: TriageAssessment = {
    id: randomUUID(),
    adherentToScope: payload.adherentToScope,
    adherentJustification:
      payload.adherentToScope === "Não" ? payload.adherentJustification.trim() : "",
    changeCategory: payload.changeCategory,
    newCategory: payload.changeCategory === "Sim" ? categoryName : "",
    preliminaryComplexity:
      payload.adherentToScope === "Sim" ? payload.preliminaryComplexity.trim() : "",
    perceivedRisks: payload.adherentToScope === "Sim" ? payload.perceivedRisks.trim() : "",
    suggestedResponsible: payload.suggestedResponsible.trim(),
    suggestedResponsibleJustification: payload.suggestedResponsibleJustification.trim(),
    exitStatus: exitStatus.status_id,
    result: payload.result.trim(),
    conclusionJustification: payload.conclusionJustification.trim(),
    assignee: { id: String(actor.id), name: actor.name, email: actor.email },
    lastTechnicalMessage:
      exitStatus.isPublic && payload.lastTechnicalMessage != null
        ? payload.lastTechnicalMessage.trim()
        : null,
  };

  const committedNotifications = await commitTriageDecision({
    protocol,
    request,
    triage,
    categoryId,
    exitStatus,
    actor,
    ipAddress,
  });

  publishCommittedNotifications(committedNotifications);

  return triage;
}
