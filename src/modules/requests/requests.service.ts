import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type {
  RequestStatus,
  OperationalImpact,
  RequestPriority,
} from "../../shared/types/requests.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type {
  CreateRequestPayload,
  ListRequestsInput,
  UpdateInternalRequestPayload,
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
import { findUserById } from "../auth/auth.repository.ts";
import * as repository from "./requests.repository.ts";

import type {
  AssignAnalystPayload,
  AssignRequestPayload,
  UpdateRequestPayload,
} from "./requests.schema.ts";
import type { Role } from "../../shared/types/role.ts";

interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}

/**
 * Resolve a identidade do usuário autenticado direto do banco (fonte fresca):
 * `name`/`email` do payload do JWT podem estar obsoletos após uma edição de
 * perfil, então a lista/consulta e a criação usam o cadastro atual.
 */
async function resolveAuthenticatedIdentity(userId: number): Promise<AuthenticatedIdentity> {
  const user = await findUserById(userId);

  if (!user || !user.is_active || !user.profile_is_active) {
    throw new AppError("Sessão inválida", 401);
  }

  return { fullName: user.full_name, email: user.email };
}

export async function findRequest(
  protocol: string,
  authenticatedUserId?: number,
): Promise<RequestDetail> {
  const normalizedProtocol = protocol.trim();

  const found = await repository.findRequestByProtocolWithOwner(normalizedProtocol);

  if (!found) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  // No modo AUTHENTICATED só o dono enxerga a solicitação. Retornamos 404 (e
  // não 403) para não revelar a existência de um protocolo de terceiros.
  if (authenticatedUserId !== undefined) {
    const identity = await resolveAuthenticatedIdentity(authenticatedUserId);
    if (found.requesterEmail.trim().toLowerCase() !== identity.email.trim().toLowerCase()) {
      throw new AppError("Protocolo não encontrado", 404);
    }
  }

  return found.detail;
}

export async function registerRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
  authenticatedUserId?: number,
) {
  try {
    // No modo AUTHENTICATED a identidade vem do cadastro, não do payload —
    // evita que o solicitante se passe por outro e-mail/nome (spoofing).
    const payload =
      authenticatedUserId === undefined
        ? request
        : await withAuthenticatedIdentity(request, authenticatedUserId);

    return await repository.createRequest(payload, attachments, authenticatedUserId);
  } catch (err) {
    await removeFiles(attachments);
    throw err;
  }
}

async function withAuthenticatedIdentity(
  request: CreateRequestPayload,
  authenticatedUserId: number,
): Promise<CreateRequestPayload> {
  const identity = await resolveAuthenticatedIdentity(authenticatedUserId);

  return {
    ...request,
    requester: {
      ...request.requester,
      fullName: identity.fullName,
      corporateEmail: identity.email,
    },
  };
}

export async function listRequestsByEmail(
  input: ListRequestsInput,
  authenticatedUserId?: number,
): Promise<PaginatedResponse<RequestSummary>> {
  // No modo AUTHENTICATED o e-mail vem da sessão; em PUBLIC, da query.
  const email =
    authenticatedUserId === undefined
      ? input.email
      : (await resolveAuthenticatedIdentity(authenticatedUserId)).email;

  if (!email) {
    throw new AppError("Parâmetro obrigatório ausente: email", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (input.status && !(await repository.findStatusByName(input.status))) {
    throw new AppError("Status inválido.", 400);
  }

  return repository.findRequestsByRequesterEmail({
    email: normalizedEmail,
    status: input.status,
    page: input.page,
    pageSize: input.pageSize,
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
    internalObservations: extractInternalObservations(request["internal_notes"] as string | null),
  };
}

/**
 * Extrai as observações internas puras de `requests.internal_notes`,
 * descartando o wrapper reservado da triagem (`__triage`) quando presente.
 *
 * O módulo de triagem persiste seu assessment sob a chave `__triage` do mesmo
 * campo (decisão P4 do PR #92); o texto bruto restante — observações legadas
 * não-JSON (guardadas sob `observations`) ou qualquer outra chave customizada —
 * continua sendo o `internalObservations` do contrato.
 */
function extractInternalObservations(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        if (typeof record.observations === "string") {
          return record.observations;
        }
        const { __triage: _triage, observations: _obs, ...rest } = record;
        if (Object.keys(rest).length === 0) return null;
        return JSON.stringify(rest);
      }
    } catch {
      // Não-JSON: trata como texto comum de observação.
    }
  }

  return trimmed;
}

// --- Atualização interna dos blocos (issue #88) -----------------------------
// PATCH /requests/:protocol/internal. Semântica de SUBSTITUIÇÃO COMPLETA dos
// blocos editáveis (decisão de contrato): o payload descreve o estado final;
// chave ausente = campo limpo (NULL). `last_external_update_at` não é tocado.

/** Linha crua dos blocos de uma solicitação — mesmo shape de
 * `findInternalRequestByProtocol` (repository), usado pelo PATCH interno. */
interface InternalRequestRow {
  request_id: string;
  requester_id: string;
  professional_id: string | null;
  title: string;
  request_type: string;
  category: string;
  process_name: string;
  need_description: string;
  problem_opportunity: string;
  expected_result: string;
  justification: string;
  process_description: string;
  process_steps: string;
  systems_used: string;
  execution_frequency: string;
  approximate_volume: string;
  people_involved: number;
  average_duration: string;
  estimated_monthly_effort: string | number;
  has_manual_controls: boolean;
  manual_controls_detail: string | null;
  main_risks: string;
  client_impact: string;
  operational_impact: OperationalImpact;
  desired_deadline: Date | string;
  perceived_criticality: RequestPriority;
  has_process_documentation: boolean | null;
  process_documentation_detail: string | null;
  has_similar_solution: boolean | null;
  similar_solution_detail: string | null;
  depends_on_other_areas: boolean | null;
  other_areas_detail: string | null;
  handles_restricted_info: boolean | null;
  restricted_info_detail: string | null;
  additional_notes: string | null;
  requester_area: string;
  requester_department: string | null;
  requester_manager: string;
  requester_additional_contact: string | null;
}

/** Blocos editáveis no estado atual — usado como `previousValue` da auditoria. */
function editableBlocksFromRow(request: InternalRequestRow): UpdateInternalRequestPayload {
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
    requester: {
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
    complementary: hasComplementaryData(complementary) ? complementary : undefined,
  };
}

export async function updateInternalRequest(
  protocol: string,
  payload: UpdateRequestPayload,
  actor: { id: number; email: string; role: Role },
  ipAddress: string | undefined,
): Promise<RequestInternalDetailDTO> {
  const request = await repository.findInternalRequestByProtocol(protocol.trim());

  if (!request) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  // Autorização por perfil (issue #121): Administrador e Gestor editam qualquer
  // solicitação; Analista apenas as atribuídas a ele (requests.professional_id
  // = seu details_professional.professional_id). Solicitação sem responsável
  // não é de nenhum analista.
  if (actor.role === "Analista") {
    const professional = await repository.findProfessionalByUserId(actor.id);
    const canEdit =
      professional !== undefined && request.professional_id === professional.professional_id;
    if (!canEdit) {
      throw new AppError("Acesso restrito às solicitações atribuídas a você", 403);
    }
  }

  await db.transaction(async (trx) => {
    await repository.updateRequestBlocks(trx, request.request_id, payload, actor.email);
    await repository.updateRequesterEditable(trx, request.requester_id, payload.requester);

    await recordAudit(trx, {
      entityType: "request",
      actionType: "request.update",
      entityId: protocol.trim(),
      userId: actor.id,
      previousValue: JSON.stringify(editableBlocksFromRow(request)),
      newValue: JSON.stringify(payload),
      note: ipAddress,
      changeOrigin: "admin",
    });
  });

  // A resposta reutiliza o mapeador do GET interno — formato idêntico ao
  // contrato `RequestInternalDetailDTO`.
  return findInternalByProtocol(protocol.trim());
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
      const previousMapping = request.mapping_professional_id;
      const auditPrevMapping = previousMapping
        ? ((await repository.findAssignmentCandidateById(previousMapping))?.user_id ?? null)
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
        // Exclusividade: atribuir triagem desatribui mapeamento
        if (previousMapping) {
          await repository.updateMappingAssignee(trx, request.request_id, null, actor.email);
          await recordAudit(trx, {
            entityType: "request",
            entityId: request.protocol,
            actionType: "request.unassign",
            userId: actor.id,
            previousValue: auditPrevMapping ? String(auditPrevMapping) : null,
            newValue: null,
            note: ipAddress,
            changeOrigin: "admin",
          });
        } else {
          await repository.updateMappingAssignee(trx, request.request_id, null, actor.email);
        }
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
      const previousAssignee = request.professional_id;
      const auditPrevAssignee = previousAssignee
        ? ((await repository.findAssignmentCandidateById(previousAssignee))?.user_id ?? null)
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
        // Exclusividade: atribuir mapeamento desatribui triagem
        if (previousAssignee) {
          await repository.updateAssignee(trx, request.request_id, null, actor.email);
          await recordAudit(trx, {
            entityType: "request",
            entityId: request.protocol,
            actionType: "request.unassign",
            userId: actor.id,
            previousValue: auditPrevAssignee ? String(auditPrevAssignee) : null,
            newValue: null,
            note: ipAddress,
            changeOrigin: "admin",
          });
        } else {
          await repository.updateAssignee(trx, request.request_id, null, actor.email);
        }
      });
    }
  }

  return findInternalByProtocol(protocol.trim());
}
