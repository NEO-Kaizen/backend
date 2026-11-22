import { randomUUID } from "node:crypto";
import db from "../../../database/conection.ts";
import { recordAudit } from "../../../shared/audit/auditLogger.ts";
import {
  custodyFor,
  hasAdministrativeAuditOrigin,
  hasCustody,
} from "../../../shared/access/custody.ts";
import type {
  EffectivePermission,
  PermissionKey,
} from "../../../shared/catalog/permissionCatalog.ts";
import { AppError } from "../../../shared/errors/AppError.ts";
import { ValidationError } from "../../../shared/errors/ValidationError.ts";
import type { CreateTriagePayload, TriageAssessment } from "./triage.schema.ts";
import * as repository from "./triage.repository.ts";

export interface TriageActor {
  readonly id: number;
  readonly email: string;
  readonly name: string;
  readonly permissions: readonly EffectivePermission[];
}

/** Custódia da triagem: `requests.responsible_id` (§ 5 do contrato RBAC). */
function hasTriageCustody(
  actor: TriageActor,
  key: PermissionKey,
  assigneeUserId: number | null,
): boolean {
  const custody = custodyFor(actor.permissions, key);
  if (!custody) return false;

  return hasCustody(
    custody,
    { userId: actor.id, email: actor.email },
    {
      responsibleIds:
        assigneeUserId === null || !Number.isInteger(assigneeUserId) ? [] : [assigneeUserId],
    },
  );
}

async function recordTriageAccessDenied(
  protocol: string,
  actor: TriageActor,
  ipAddress: string | undefined,
  detail: string,
): Promise<void> {
  await db.transaction(async (trx) => {
    await recordAudit(trx, {
      entityType: "request",
      actionType: "request.access_denied",
      entityId: protocol,
      userId: actor.id,
      previousValue: null,
      newValue: null,
      note: `Triagem negada: ${detail}`,
      ipAddress,
      changeOrigin: "system",
    });
  });
}

export async function getTriage(
  protocol: string,
  actor: TriageActor,
  ipAddress?: string,
): Promise<TriageAssessment | null> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  const canAccess = hasTriageCustody(actor, "triage:read", request.assignee_user_id ?? null);
  if (!canAccess) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "sem custódia para ler a triagem");
    throw new AppError("Acesso negado a esta solicitação", 403);
  }

  return repository.findLatestTriage(protocol);
}

export async function createTriage(
  protocol: string,
  payload: CreateTriagePayload,
  actor: TriageActor,
  ipAddress?: string,
): Promise<TriageAssessment> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  // Priorizado (isRestricted) bloqueia triagem de não-Admin — inclusive
  // assignee → movimentação de/r para Priorizado só via `PATCH /status` com
  // bypass Admin (delta §3.1). Fluxo encerrado (isTerminal) não reabre.
  if (request.status_is_terminal) {
    throw new AppError("Solicitação encerrada.", 422);
  }

  // `isRestricted` só é atravessado por quem tem `request:status_override`
  // global (o override libera o alvo protegido; a decisão continua na etapa).
  const hasStatusOverride = custodyFor(actor.permissions, "request:status_override") === "global";
  if (request.status_is_restricted && !hasStatusOverride) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "solicitação priorizada");
    throw new AppError(
      "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
      403,
      "INSUFFICIENT_ROLE_PERMISSIONS",
    );
  }

  const canAccess = hasTriageCustody(actor, "triage:write", request.assignee_user_id ?? null);
  if (!canAccess) {
    await recordTriageAccessDenied(protocol, actor, ipAddress, "sem custódia da solicitação");
    throw new AppError(
      "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
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
