import { AppError } from "../../shared/errors/AppError.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type {
  CreateRequestPayload,
  ListRequestsQuery,
} from "../DTOs/requests/RequestRequests.dto.ts";
import type { RequestDetail, RequestSummary } from "../DTOs/requests/RequestResponse.dto.ts";
import type {
  ComplementaryBlock,
  RequestInternalDetailDTO,
  YesNoDetail,
} from "../DTOs/requests/RequestInternalDetail.dto.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";
import * as repository from "./requests.repository.ts";

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

// `desired_deadline` é DATE (sem timezone); o driver pg devolve um Date em
// componentes locais. Extraímos ano/mês/dia diretamente (sem passar por
// toISOString/UTC) para não arriscar deslocar o dia conforme o fuso do
// processo, e formatamos como "yyyy-mm-dd" (contrato documentado).
function toDateOnly(value: Date | string): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

// `scheduled_for` (request_time_preferences) é TIMESTAMP sem timezone —
// mesmo raciocínio de toDateOnly, mas preservando hora:minuto.
function toDateTimeMinutes(value: Date | string): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  return value.slice(0, 16);
}

function hasComplementaryData(block: ComplementaryBlock): boolean {
  return Object.values(block).some((value) => value !== undefined);
}

export async function findInternalByProtocol(protocol: string): Promise<RequestInternalDetailDTO> {
  const request = await repository.findInternalRequestByProtocol(protocol);

  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const [attachments, schedulePreferences] = await Promise.all([
    repository.findAttachmentsByRequestId(request.request_id),
    repository.findSchedulePreferencesByRequestId(request.request_id),
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

  return {
    protocol: request.protocol,
    status: request.status,
    priority: request.priority,
    prioritization: {
      score: request.priority_score,
      maxScore: 25,
      label: request.priority,
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
      hasManualControls: toYesNoDetail(
        request.has_manual_controls,
        request.manual_controls_detail,
      ) as YesNoDetail,
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
    mappingDate: meetingScheduledFor ? repository.toSaoPauloDateOnly(meetingScheduledFor) : null,
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
    openedAt: request.created_at,
    lastUpdate: request.updated_at ?? request.created_at,
    internalObservations: request.internal_notes,
  };
}
