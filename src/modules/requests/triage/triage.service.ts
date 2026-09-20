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

export async function getTriage(
  protocol: string,
  actor: Actor,
): Promise<TriageAssessment | null> {
  const request = await repository.findRequestContext(protocol);
  if (!request) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  const canAccess = isAdminOrAssignee(actor, request.assignee_user_id ?? null);
  if (!canAccess) {
    throw new AppError("Acesso negado a esta solicitação", 403);
  }

  return repository.findTriageByProtocol(protocol);
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

  const canAccess = isAdminOrAssignee(actor, request.assignee_user_id ?? null);
  if (!canAccess) {
    throw new AppError("Acesso negado a esta solicitação", 403);
  }

  if (payload.adherentToScope === "Não" && payload.adherentJustification.trim() === "") {
    throw new ValidationError(
      { adherentJustification: "Informe a justificativa quando não aderente ao escopo" },
      "Validação falhou",
    );
  }

  if (payload.adherentToScope === "Sim" && payload.preliminaryComplexity.trim() === "") {
    throw new ValidationError(
      { preliminaryComplexity: "Descreva a complexidade preliminar" },
      "Validação falhou",
    );
  }

  if (payload.adherentToScope === "Sim" && payload.perceivedRisks.trim() === "") {
    throw new ValidationError(
      { perceivedRisks: "Descreva os riscos percebidos" },
      "Validação falhou",
    );
  }

  if (payload.changeCategory === "Sim" && payload.newCategory.trim() === "") {
    throw new ValidationError(
      { newCategory: "Selecione a categoria de destino" },
      "Validação falhou",
    );
  }

  if (payload.exitStatus.trim() === "") {
    throw new ValidationError(
      { exitStatus: "Selecione o status de saída" },
      "Validação falhou",
    );
  }

  const exitStatus = await repository.resolveExitStatus(payload.exitStatus);
  if (!exitStatus) {
    throw new ValidationError(
      { exitStatus: "Status de saída deve ser um status ativo elegível para triagem" },
      "Validação falhou",
    );
  }

  let categoryId: number | null = null;
  if (payload.changeCategory === "Sim") {
    const newCategory = await repository.resolveCategoryId(payload.newCategory);
    if (!newCategory) {
      throw new ValidationError(
        { newCategory: "Categoria de destino inválida" },
        "Validação falhou",
      );
    }
    categoryId = newCategory.category_id;
  }

  const triage: TriageAssessment = {
    adherentToScope: payload.adherentToScope,
    adherentJustification: payload.adherentToScope === "Não" ? payload.adherentJustification.trim() : "",
    changeCategory: payload.changeCategory,
    newCategory: payload.changeCategory === "Sim" ? payload.newCategory.trim() : "",
    preliminaryComplexity: payload.adherentToScope === "Sim" ? payload.preliminaryComplexity.trim() : "",
    perceivedRisks: payload.adherentToScope === "Sim" ? payload.perceivedRisks.trim() : "",
    suggestedResponsible: payload.suggestedResponsible.trim(),
    suggestedResponsibleJustification: payload.suggestedResponsibleJustification.trim(),
    exitStatus: payload.exitStatus.trim(),
    result: payload.result.trim(),
    conclusionJustification: payload.conclusionJustification.trim(),
  };

  await repository.saveTriageDecision(
    protocol,
    triage,
    categoryId,
    exitStatus.status_id,
    actor.email,
  );

  return triage;
}
