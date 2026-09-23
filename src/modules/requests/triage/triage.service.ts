import { randomUUID } from "node:crypto";
import { AppError } from "../../../shared/errors/AppError.ts";
import { ValidationError } from "../../../shared/errors/ValidationError.ts";
import type { CreateTriagePayload, TriageAssessment } from "./triage.schema.ts";
import * as repository from "./triage.repository.ts";

interface Actor {
  id: number;
  email: string;
  role: string;
}

function isAdminOrAssignee(actor: Actor, assigneeUserId: number | null): boolean {
  if (actor.role === "Administrador") return true;
  if (assigneeUserId === null) return false;
  return assigneeUserId === actor.id;
}

export async function getTriage(protocol: string, actor: Actor): Promise<TriageAssessment | null> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  // Leitura: Gestor é read-only e pode consultar qualquer triagem; escrita
  // (createTriage) segue restrita a Admin ou assignee.
  const canAccess =
    actor.role === "Gestor" || isAdminOrAssignee(actor, request.assignee_user_id ?? null);
  if (!canAccess) {
    throw new AppError("Acesso negado a esta solicitação", 403);
  }

  return repository.findLatestTriage(protocol);
}

export async function createTriage(
  protocol: string,
  payload: CreateTriagePayload,
  actor: Actor,
): Promise<TriageAssessment> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  // Priorizado (isRestricted) bloqueia triagem de qualquer perfil — inclusive
  // assignee → só via `PATCH /status` com bypass Admin (delta §3.1).
  if (request.status_is_restricted) {
    throw new AppError(
      "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
      403,
      "INSUFFICIENT_ROLE_PERMISSIONS",
    );
  }

  const canAccess = isAdminOrAssignee(actor, request.assignee_user_id ?? null);
  if (!canAccess) {
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
          "Status de saída deve ser um status ativo com triageMode free ou conclusion_only e isRestricted=false",
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
  };

  await repository.saveTriageDecision(
    protocol,
    request.request_id,
    triage,
    categoryId,
    exitStatus.status_id,
    actor.email,
    {
      actorId: actor.id,
      previousStatus: request.status_name,
      previousCategory: request.category_name,
      nextStatus: exitStatus.name,
    },
  );

  return triage;
}
