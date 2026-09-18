import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type {
  OperationalImpact,
  RequestPriority,
  RequestStatus,
} from "../../shared/types/requests.ts";
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
import type { AssignAnalystPayload, AssignRequestPayload } from "./requests.schema.ts";

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
  const request = (await repository.findInternalRequestByProtocol(protocol)) as unknown as Record<
    string,
    unknown
  > | null;

  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const requestId = request["request_id"] as string;
  const [attachments, schedulePreferences, evaluation] = await Promise.all([
    repository.findAttachmentsByRequestId(requestId),
    repository.findSchedulePreferencesByRequestId(requestId),
    repository.findEvaluationByProtocol(protocol),
  ]);

  const meetingScheduledFor: string | null = request["meeting_scheduled_for"]
    ? new Date(request["meeting_scheduled_for"] as string).toISOString()
    : null;
  const meeting = meetingScheduledFor
    ? {
        scheduledFor: meetingScheduledFor,
        link: (request["meeting_link"] as string | null) ?? null,
      }
    : null;

  const complementary: ComplementaryBlock = {
    hasProcessDocumentation: toYesNoDetail(
      request["has_process_documentation"] as boolean | null,
      request["process_documentation_detail"] as string | null,
    ),
    hasSimilarSolution: toYesNoDetail(
      request["has_similar_solution"] as boolean | null,
      request["similar_solution_detail"] as string | null,
    ),
    dependsOnOtherAreas: toYesNoDetail(
      request["depends_on_other_areas"] as boolean | null,
      request["other_areas_detail"] as string | null,
    ),
    handlesRestrictedInfo: toYesNoDetail(
      request["handles_restricted_info"] as boolean | null,
      request["restricted_info_detail"] as string | null,
    ),
    additionalNotes: (request["additional_notes"] as string | null) ?? undefined,
  };

  const openedAt = normalizeIsoDate(request["created_at"]) ?? new Date().toISOString();
  const lastUpdate = normalizeIsoDate(request["updated_at"]) ?? openedAt;

  const assigneeUserId = request["assignee_user_id"] as number | null;
  const mappingUserId = request["mapping_user_id"] as number | null;

  const assignee =
    assigneeUserId !== null && assigneeUserId !== undefined && request["professional_name"]
      ? {
          id: String(assigneeUserId),
          name: request["professional_name"] as string,
          email: (request["professional_email"] as string | null) ?? null,
        }
      : null;

  const mappingAssignee =
    mappingUserId !== null && mappingUserId !== undefined && request["mapping_name"]
      ? {
          id: String(mappingUserId),
          name: request["mapping_name"] as string,
          email: (request["mapping_email"] as string | null) ?? null,
        }
      : null;

  return {
    protocol: request["protocol"] as string,
    status: request["status"] as string,
    priority: (request["priority"] as string | null) ?? null,
    prioritization: {
      score: evaluation ? evaluation.score : null,
      maxScore: 50,
      label: evaluation ? evaluation.classification : null,
    },
    assignee,
    mappingAssignee: mappingAssignee ?? null,
    correctionAlert: null,
    requester: {
      fullName: request["requester_name"] as string,
      corporateEmail: request["requester_email"] as string,
      area: request["requester_area"] as string,
      department: (request["requester_department"] as string | null) ?? undefined,
      manager: request["requester_manager"] as string,
      additionalContact: (request["requester_additional_contact"] as string | null) ?? undefined,
    },
    demand: {
      title: request["title"] as string,
      requestType: request["request_type"] as string,
      category: request["category"] as string,
      processName: request["process_name"] as string,
      description: request["need_description"] as string,
      problem: request["problem_opportunity"] as string,
      expectedResult: request["expected_result"] as string,
      justification: request["justification"] as string,
    },
    operational: {
      processDescription: request["process_description"] as string,
      processSteps: request["process_steps"] as string,
      systemsUsed: request["systems_used"] as string,
      executionFrequency: request["execution_frequency"] as string,
      volumetry: request["approximate_volume"] as string,
      peopleInvolved: request["people_involved"] as number,
      averageExecutionTime: request["average_duration"] as string,
      monthlyEffortHours: Number(request["estimated_monthly_effort"]),
      hasManualControls: toRequiredYesNoDetail(
        request["has_manual_controls"] as boolean,
        request["manual_controls_detail"] as string | null,
      ),
      mainRisks: request["main_risks"] as string,
      clientImpact: request["client_impact"] as string,
      operationalImpact: request["operational_impact"] as OperationalImpact,
      desiredDeadline: toDateOnly(request["desired_deadline"] as string | Date),
      perceivedCriticality: request["perceived_criticality"] as RequestPriority,
    },
    complementary: hasComplementaryData(complementary) ? complementary : undefined,
    schedulePreferences:
      schedulePreferences.length > 0
        ? schedulePreferences.map((row) => toDateTimeMinutes(row.scheduled_for))
        : null,
    mappingDate: meetingScheduledFor ? toSaoPauloDateOnly(meetingScheduledFor) : null,
    meeting,
    attachments: attachments.map((attachment) => ({
      fileName: attachment.file_name,
      mimeType: attachment.content_type,
      sizeBytes: Number(attachment.size_bytes),
      downloadUrl: null,
      canDownload: false,
    })),
    openedAt,
    lastUpdate,
    internalObservations: (request["internal_notes"] as string | null) ?? null,
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

async function resolveAnalystByUserId(
  userId: string,
): Promise<{ professionalId: string; id: string; name: string; email: string }> {
  if (userId.trim() === "") {
    throw new AppError("analystId vazio", 400);
  }
  const candidate = await repository.findAssignmentCandidateByUserId(userId);
  if (!candidate) {
    throw new AppError("Analista não encontrado", 404);
  }
  if (candidate.professional_status !== "active" || !candidate.user_is_active) {
    throw new AppError("Responsável inativo.", 400);
  }
  if (!(repository.ASSIGNABLE_PROFILES as readonly string[]).includes(candidate.profile_name)) {
    throw new AppError("Perfil do responsável não permite atribuição.", 400);
  }
  return {
    professionalId: candidate.professional_id,
    id: String(candidate.user_id),
    name: candidate.name,
    email: candidate.email,
  };
}

// Legado: resolve por professionalId (mantido p/ rota antiga até remoção total)
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

  return { id: String(candidate.user_id), name: candidate.name, email: candidate.email };
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
    payload.professionalId === null || payload.professionalId === undefined
      ? null
      : await resolveAssignee(payload.professionalId);

  const previousId = request.professional_id;
  const nextId = assignee
    ? await repository
        .findAssignmentCandidateByUserId(assignee.id)
        .then((c) => c?.professional_id ?? null)
    : null;
  // Para legado mantemos professional_id como valor de auditoria
  const auditNext = assignee?.id ?? null;
  const auditPrev = previousId
    ? ((await repository.findAssignmentCandidateById(previousId))?.user_id ?? null)
    : null;
  const action = auditNext === null ? "unassign" : auditPrev === null ? "assign" : "reassign";

  const shouldAdvanceStatus =
    auditNext !== null &&
    request.status === RN010_FROM_STATUS &&
    request.screening_result === RN010_ELIGIBLE_SCREENING;

  await db.transaction(async (trx) => {
    await repository.updateAssignee(trx, request.request_id, nextId, actor.email);

    await recordAudit(trx, {
      entityType: "request",
      entityId: request.protocol,
      actionType: `request.${action}`,
      userId: actor.id,
      previousValue: auditPrev ? String(auditPrev) : null,
      newValue: auditNext ? String(auditNext) : null,
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

  return {
    protocol: request.protocol,
    assignee,
    status: shouldAdvanceStatus ? RN010_TO_STATUS : request.status,
  };
}

export async function assignAnalyst(
  protocol: string,
  payload: AssignAnalystPayload,
  actor: { id: number; email: string },
  ipAddress: string | undefined,
): Promise<RequestInternalDetailDTO> {
  const request = await repository.findAssignmentContextByProtocol(protocol.trim());
  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  const hasAssignee = Object.prototype.hasOwnProperty.call(payload, "assigneeId");
  const hasMapping = Object.prototype.hasOwnProperty.call(payload, "mappingAssigneeId");

  if (hasAssignee) {
    const raw = payload.assigneeId as string | null | undefined;
    if (raw === null) {
      const previous = request.professional_id;
      const auditPrev = previous
        ? ((await repository.findAssignmentCandidateById(previous))?.user_id ?? null)
        : null;
      await db.transaction(async (trx) => {
        await repository.updateAssignee(trx, request.request_id, null, actor.email);
        await recordAudit(trx, {
          entityType: "request",
          entityId: request.protocol,
          actionType: "request.unassign",
          userId: actor.id,
          previousValue: auditPrev ? String(auditPrev) : null,
          newValue: null,
          note: ipAddress,
          changeOrigin: "admin",
        });
      });
    } else {
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        throw new AppError("analystId vazio", 400);
      }
      const resolved = await resolveAnalystByUserId(String(raw));
      const previous = request.professional_id;
      const auditPrev = previous
        ? ((await repository.findAssignmentCandidateById(previous))?.user_id ?? null)
        : null;
      const action = auditPrev === null ? "assign" : "reassign";
      const shouldAdvance =
        request.status === RN010_FROM_STATUS &&
        request.screening_result === RN010_ELIGIBLE_SCREENING;
      await db.transaction(async (trx) => {
        await repository.updateAssignee(
          trx,
          request.request_id,
          resolved.professionalId,
          actor.email,
        );
        await recordAudit(trx, {
          entityType: "request",
          entityId: request.protocol,
          actionType: `request.${action}`,
          userId: actor.id,
          previousValue: auditPrev ? String(auditPrev) : null,
          newValue: resolved.id,
          note: ipAddress,
          changeOrigin: "admin",
        });
        if (shouldAdvance) {
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
    }
  } else if (hasMapping) {
    const raw = payload.mappingAssigneeId as string | null | undefined;
    if (raw === null) {
      const previous = request.mapping_professional_id;
      const auditPrev = previous
        ? ((await repository.findAssignmentCandidateById(previous))?.user_id ?? null)
        : null;
      await db.transaction(async (trx) => {
        await repository.updateMappingAssignee(trx, request.request_id, null, actor.email);
        await recordAudit(trx, {
          entityType: "request",
          entityId: request.protocol,
          actionType: "request.unassign",
          userId: actor.id,
          previousValue: auditPrev ? String(auditPrev) : null,
          newValue: null,
          note: ipAddress,
          changeOrigin: "admin",
        });
      });
    } else {
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        throw new AppError("analystId vazio", 400);
      }
      const resolved = await resolveAnalystByUserId(String(raw));
      const previous = request.mapping_professional_id;
      const auditPrev = previous
        ? ((await repository.findAssignmentCandidateById(previous))?.user_id ?? null)
        : null;
      const action = auditPrev === null ? "assign" : "reassign";
      await db.transaction(async (trx) => {
        await repository.updateMappingAssignee(
          trx,
          request.request_id,
          resolved.professionalId,
          actor.email,
        );
        await recordAudit(trx, {
          entityType: "request",
          entityId: request.protocol,
          actionType: `request.${action}`,
          userId: actor.id,
          previousValue: auditPrev ? String(auditPrev) : null,
          newValue: resolved.id,
          note: ipAddress,
          changeOrigin: "admin",
        });
      });
    }
  }

  return findInternalByProtocol(protocol.trim());
}
