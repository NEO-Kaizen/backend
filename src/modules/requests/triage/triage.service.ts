import { randomUUID } from "node:crypto";
import { recordAccessDeniedAttempt } from "../../../shared/audit/accessDenied.ts";
import {
  hasAdministrativeAuditOrigin,
  hasPermissionCustody,
} from "../../../shared/access/custody.ts";
import type { PermissionKey } from "../../../shared/catalog/permissionCatalog.ts";
import { AppError } from "../../../shared/errors/AppError.ts";
import { ValidationError } from "../../../shared/errors/ValidationError.ts";
import type { CreateTriagePayload, TriageAssessment } from "./triage.schema.ts";
import type { NamedPermissionActor } from "../../../shared/access/permissionActor.ts";
import * as repository from "./triage.repository.ts";

/** Custódia da Triagem: user_id ligado a `requests.professional_id` (§5 RBAC). */
function hasTriageCustody(
  actor: NamedPermissionActor,
  key: PermissionKey,
  assigneeUserId: number | null,
): boolean {
  return hasPermissionCustody(actor.permissions, key, { userId: actor.id, email: actor.email }, [
    assigneeUserId,
  ]);
}

function recordTriageAccessDenied(
  protocol: string,
  actor: NamedPermissionActor,
  ipAddress: string | undefined,
  detail: string,
): Promise<void> {
  return recordAccessDeniedAttempt({
    entityType: "request",
    entityId: protocol,
    userId: actor.id,
    note: `Triagem negada: ${detail}`,
    ipAddress,
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

  const canAccess = hasTriageCustody(actor, "triage:read", request.assignee_user_id ?? null);
  if (!canAccess) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "sem Custódia para ler a Triagem");
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
    await recordTriageAccessDenied(protocol, actor, ipAddress, "solicitação em Status restrito");
    throw new AppError(
      "A Triagem não pode ser registrada enquanto a solicitação estiver em status restrito.",
      403,
      "INSUFFICIENT_ROLE_PERMISSIONS",
    );
  }

  const canAccess = hasTriageCustody(actor, "triage:write", request.assignee_user_id ?? null);
  if (!canAccess) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "sem Custódia da solicitação");
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

  await repository.saveTriageDecision(
    protocol,
    request.request_id,
    triage,
    categoryId,
    exitStatus.status_id,
    exitStatus.isPublic,
    triage.lastTechnicalMessage,
    request.status_id,
    actor.email,
    { professionalId: request.professional_id, userId: request.assignee_user_id },
    {
      actorId: actor.id,
      previousStatus: request.status_name,
      previousCategory: request.category_name,
      nextStatus: exitStatus.name,
      justification: triage.conclusionJustification,
      ipAddress,
      changeOrigin: hasAdministrativeAuditOrigin(actor.permissions) ? "admin" : "internal",
    },
  );

  return triage;
}
