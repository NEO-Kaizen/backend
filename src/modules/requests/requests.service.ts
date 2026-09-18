import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type { RequestStatus } from "../../shared/types/requests.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type {
  CreateRequestPayload,
  ListRequestsQuery,
} from "../DTOs/requests/RequestRequests.dto.ts";
import type {
  AssignRequestResponse,
  AssigneeSummary,
  RequestDetail,
  RequestSummary,
} from "../DTOs/requests/RequestResponse.dto.ts";
import type {
  ComplementaryBlock,
  RequestInternalDetailDTO,
  YesNoDetail,
} from "../DTOs/requests/RequestInternalDetail.dto.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import {
  normalizeIsoDate,
  toDateOnly,
  toDateTimeMinutes,
  toSaoPauloDateOnly,
} from "../../shared/utils/date.ts";
import * as repository from "./requests.repository.ts";
import type { AssignRequestPayload } from "./requests.schema.ts";

export async function findRequest(protocol: string): Promise<RequestDetail> {
  const normalizedProtocol = protocol.trim();

  const response = await repository.findRequestByProtocol(normalizedProtocol);

  if (!response) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  return response;
}

export async function registerRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
) {
  try {
    return await repository.createRequest(request, attachments);
  } catch (err) {
    await removeFiles(attachments);
    throw err;
  }
}

export async function listRequestsByEmail(
  query: ListRequestsQuery,
): Promise<PaginatedResponse<RequestSummary>> {
  const normalizedEmail = query.email.trim().toLowerCase();

  if (query.status && !(await repository.findStatusByName(query.status))) {
    throw new AppError("Status inválido.", 400);
  }

  return repository.findRequestsByRequesterEmail({
    email: normalizedEmail,
    status: query.status,
    page: query.page,
    pageSize: query.pageSize,
  });
}

// --- Consulta administrativa/interna (issue #48) ---------------------------
// Difere de findRequest (pública, issue #34): retorna o DTO interno completo,
// nunca o público. Ver docs/requests-internal-query-contract.md.

// Resposta "Sim/Não (+ detalhamento)": undefined quando o campo não foi
// respondido (Bloco 4 é opcional — o contrato espera a chave ausente, não
// null; res.json/JSON.stringify já removem chaves com valor undefined),
// false para "Não", string com o detalhe para "Sim".
function toYesNoDetail(hasFlag: boolean | null, detail: string | null): YesNoDetail | undefined {
  if (hasFlag === null || hasFlag === undefined) return undefined;
  if (hasFlag === false) return false;
  return detail ?? "";
}

// Variante para o Bloco 3, cujo campo é obrigatório (NOT NULL no schema):
// a flag nunca é null e o retorno nunca é undefined — dispensa o `as`.
function toRequiredYesNoDetail(flag: boolean, detail: string | null): YesNoDetail {
  if (flag === false) return false;
  return detail ?? "";
}

function hasComplementaryData(block: ComplementaryBlock): boolean {
  return Object.values(block).some((value) => value !== undefined);
}

export async function findInternalByProtocol(protocol: string): Promise<RequestInternalDetailDTO> {
  const request = await repository.findInternalRequestByProtocol(protocol);

  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const [attachments, schedulePreferences, evaluation] = await Promise.all([
    repository.findAttachmentsByRequestId(request.request_id),
    repository.findSchedulePreferencesByRequestId(request.request_id),
    // Score/classificação da priorização (RN-007/RN-008, issue #51) —
    // fonte única, escala 10–50; null até existir avaliação.
    repository.findEvaluationByProtocol(protocol),
  ]);

  const meetingScheduledFor: string | null = request.meeting_scheduled_for
    ? new Date(request.meeting_scheduled_for).toISOString()
    : null;
  const meeting = meetingScheduledFor
    ? { scheduledFor: meetingScheduledFor, link: request.meeting_link ?? null }
    : null;

  const complementary: ComplementaryBlock = {
    hasProcessDocumentation: toYesNoDetail(
      request.has_process_documentation,
      request.process_documentation_detail,
    ),
    hasSimilarSolution: toYesNoDetail(
      request.has_similar_solution,
      request.similar_solution_detail,
    ),
    dependsOnOtherAreas: toYesNoDetail(request.depends_on_other_areas, request.other_areas_detail),
    handlesRestrictedInfo: toYesNoDetail(
      request.handles_restricted_info,
      request.restricted_info_detail,
    ),
    additionalNotes: request.additional_notes ?? undefined,
  };

  // Timestamps normalizados no formato ISO do contrato (fallback defensivo
  // caso a leitura venha nula — mesmo padrão da consulta pública).
  const openedAt = normalizeIsoDate(request.created_at) ?? new Date().toISOString();
  const lastUpdate = normalizeIsoDate(request.updated_at) ?? openedAt;

  return {
    protocol: request.protocol,
    status: request.status,
    priority: request.priority,
    prioritization: {
      // Escala 10–50 (RN-007/RN-008 — issue #51). `score` e `label` (a
      // classificação da avaliação) vêm de prioritization_evaluations; ambos
      // null enquanto a solicitação não for avaliada.
      score: evaluation ? evaluation.score : null,
      maxScore: 50,
      label: evaluation ? evaluation.classification : null,
    },
    assignee: request.professional_name
      ? { name: request.professional_name, email: request.professional_email }
      : null,
    // Sem fonte de dados no schema atual (nenhuma tabela de correção
    // pendente equivalente) — sempre null até uma issue futura modelar isso.
    correctionAlert: null,
    requester: {
      fullName: request.requester_name,
      corporateEmail: request.requester_email,
      area: request.requester_area,
      department: request.requester_department ?? undefined,
      manager: request.requester_manager,
      additionalContact: request.requester_additional_contact ?? undefined,
    },
    demand: {
      title: request.title,
      requestType: request.request_type,
      category: request.category,
      processName: request.process_name,
      description: request.need_description,
      problem: request.problem_opportunity,
      expectedResult: request.expected_result,
      justification: request.justification,
    },
    operational: {
      processDescription: request.process_description,
      processSteps: request.process_steps,
      systemsUsed: request.systems_used,
      executionFrequency: request.execution_frequency,
      volumetry: request.approximate_volume,
      peopleInvolved: request.people_involved,
      averageExecutionTime: request.average_duration,
      monthlyEffortHours: Number(request.estimated_monthly_effort),
      hasManualControls: toRequiredYesNoDetail(
        request.has_manual_controls,
        request.manual_controls_detail,
      ),
      mainRisks: request.main_risks,
      clientImpact: request.client_impact,
      operationalImpact: request.operational_impact,
      desiredDeadline: toDateOnly(request.desired_deadline),
      perceivedCriticality: request.perceived_criticality,
    },
    // Bloco 4 é opcional por inteiro (Especificação 3.0 §1.5): se nenhum dos
    // 5 campos foi respondido, a chave `complementary` some da resposta em
    // vez de mandar um objeto todo com valores ausentes.
    complementary: hasComplementaryData(complementary) ? complementary : undefined,
    schedulePreferences:
      schedulePreferences.length > 0
        ? schedulePreferences.map((row) => toDateTimeMinutes(row.scheduled_for))
        : null,
    // Mesma fonte da consulta pública: requests.meeting_scheduled_for
    // (America/Sao_Paulo) — os dois nunca divergem (Especificação 3.0 §6.1).
    mappingDate: meetingScheduledFor ? toSaoPauloDateOnly(meetingScheduledFor) : null,
    meeting,
    attachments: attachments.map((attachment) => ({
      fileName: attachment.file_name,
      mimeType: attachment.content_type,
      // size_bytes é BIGINT — o driver pg devolve como string por padrão
      // (evita perda de precisão); convertido aqui pois o contrato exige number
      // e o limite de 10MB do anexo nunca chega perto do teto seguro de um Number.
      sizeBytes: Number(attachment.size_bytes),
      // Sem endpoint de download implementado ainda — nunca oferece um link
      // que não funciona.
      downloadUrl: null,
      canDownload: false,
    })),
    openedAt,
    lastUpdate,
    internalObservations: request.internal_notes,
  };
}

export async function listAssignees(): Promise<AssigneeSummary[]> {
  return repository.findActiveAssignees();
}

// RN-010 — ao salvar o responsável de uma demanda em triagem já aprovada como
// elegível, o status avança automaticamente para "Aguardando mapeamento".
const RN010_FROM_STATUS: RequestStatus = "Em triagem";
const RN010_TO_STATUS: RequestStatus = "Aguardando mapeamento";
const RN010_ELIGIBLE_SCREENING = "elegivel";

async function resolveAssignee(
  professionalId: string,
): Promise<{ id: string; name: string; email: string }> {
  const candidate = await repository.findAssignmentCandidateById(professionalId);

  if (!candidate) {
    throw new AppError("Responsável não encontrado.", 400);
  }
  if (candidate.professional_status !== "active" || !candidate.user_is_active) {
    throw new AppError("Responsável inativo.", 400);
  }
  if (!(repository.ASSIGNABLE_PROFILES as readonly string[]).includes(candidate.profile_name)) {
    throw new AppError("Perfil do responsável não permite atribuição.", 400);
  }

  return { id: candidate.id, name: candidate.name, email: candidate.email };
}

export async function assignResponsible(
  protocol: string,
  payload: AssignRequestPayload,
  actor: { id: number; email: string },
  ipAddress: string | undefined,
): Promise<AssignRequestResponse> {
  const request = await repository.findAssignmentContextByProtocol(protocol.trim());
  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const assignee =
    payload.professionalId === null ? null : await resolveAssignee(payload.professionalId);

  const previousId = request.professional_id;
  const nextId = assignee?.id ?? null;
  const action = nextId === null ? "unassign" : previousId === null ? "assign" : "reassign";

  const shouldAdvanceStatus =
    nextId !== null &&
    request.status === RN010_FROM_STATUS &&
    request.screening_result === RN010_ELIGIBLE_SCREENING;
  const finalStatus = shouldAdvanceStatus ? RN010_TO_STATUS : request.status;

  // Atribuição, gatilho RN-010 e auditoria na MESMA transação: nada fica
  // parcialmente aplicado nem sem histórico.
  await db.transaction(async (trx) => {
    await repository.updateAssignee(trx, request.request_id, nextId, actor.email);

    await recordAudit(trx, {
      entityType: "request",
      entityId: request.protocol,
      actionType: `request.${action}`,
      userId: actor.id,
      previousValue: previousId,
      newValue: nextId,
      note: ipAddress,
      changeOrigin: "admin",
    });

    if (shouldAdvanceStatus) {
      await repository.updateStatus(trx, request.request_id, RN010_TO_STATUS, actor.email);

      await recordAudit(trx, {
        entityType: "request",
        entityId: request.protocol,
        actionType: "request.status_change",
        userId: actor.id,
        previousValue: RN010_FROM_STATUS,
        newValue: RN010_TO_STATUS,
        note: "RN-010",
        changeOrigin: "system",
      });
    }
  });

  return { protocol: request.protocol, assignee, status: finalStatus };
}
