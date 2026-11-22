import { AppError } from "../../shared/errors/AppError.ts";
import { recordAudit } from "../../shared/audit/auditLogger.ts";
import db from "../../database/conection.ts";
import type {
  RequestStatus,
  OperationalImpact,
  RequestPriority,
  RequesterBlock,
  DemandBlock,
  AssignmentCandidateRow,
} from "../../shared/types/requests.ts";
import type { AuthenticatedUser } from "../../shared/types/user.ts";
import type {
  Meeting,
  PublicOperationalImpacts,
  PublicRequestDetails,
  RequesterRequestDetails,
  TrackingDetailsResponse,
} from "../DTOs/requests/RequestTracking.dto.ts";
import { getSolicitationMode } from "../portalConfig/portalConfig.repository.ts";
import { normalizeEmail, normalizeName } from "../../shared/utils/normalizeIdentity.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import { removeFiles } from "../../shared/storage/fileStorage.ts";
import type {
  CreateRequestPayload,
  ListRequestsInput,
  UpdateInternalRequestPayload,
} from "../DTOs/requests/RequestRequests.dto.ts";
import * as pendingItemsRepo from "../pendingItems/pendingItems.repository.ts";
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
import { applyStatusTransition } from "./statusTransition.ts";

import type {
  AssignAnalystPayload,
  AssignRequestPayload,
  UpdateRequestPayload,
  UpdateStatusPayload,
} from "./requests.schema.ts";
import {
  custodyFor,
  denyRequestAccess,
  hasResponsibleCustody,
  isRequesterOwner,
  recordAccessDeniedAttempt,
  type PermissionActor,
} from "../../shared/access/requestAccess.ts";
import type { UpdateStatusResponse } from "../DTOs/requests/RequestRequests.dto.ts";

interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}

type RequestActor = PermissionActor;

interface RequestMutationAcknowledgement {
  readonly protocol: string;
  readonly updated: true;
}

async function requireRequestCustody<T>(
  request: T | null | undefined,
  actor: RequestActor,
  protocol: string,
  ipAddress: string | undefined,
  detail: string,
  canAccess: (request: T) => boolean,
): Promise<T> {
  if (request === null || request === undefined || !canAccess(request)) {
    return denyRequestAccess(protocol, actor.id, ipAddress, detail);
  }

  return request;
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
  // não 403) para não revelar a existência de um protocolo de terceiros. A
  // Posse usa o vínculo `requester_user_id` e, em linhas legadas, o e-mail.
  if (authenticatedUserId !== undefined) {
    const identity = await resolveAuthenticatedIdentity(authenticatedUserId);
    const isOwner = isRequesterOwner(
      { id: authenticatedUserId, email: identity.email },
      {
        requesterUserId: found.requesterUserId,
        requesterEmail: found.requesterEmail,
      },
    );

    if (!isOwner) {
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

export async function findInternalByProtocol(
  protocol: string,
  actor: RequestActor,
  ipAddress?: string,
): Promise<RequestInternalDetailDTO> {
  const request = await requireRequestCustody(
    (await repository.findInternalRequestByProtocol(protocol)) as unknown as Record<
      string,
      unknown
    > | null,
    actor,
    protocol,
    ipAddress,
    "request:read sem custódia",
    (row) => hasResponsibleCustody(actor, "request:read", row["assignee_user_id"]),
  );

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

  // Pendências (contract-pendencias_03): pendingSummary/unread/correctionAlert derivados sem tabela de leitura.
  const pendingSummary = await (async () => {
    try {
      const summary = await pendingItemsRepo.pendingSummaryByRequestId(requestId);
      const correctionAlert = await pendingItemsRepo.findCorrectionAlert(requestId);
      const unreadRaw = await pendingItemsRepo.unreadForInternal(requestId);
      return {
        summary,
        correctionAlert,
        unread: {
          count: unreadRaw.count,
          hasUnread: unreadRaw.count > 0,
          lastUnreadAt: unreadRaw.lastUnreadAt,
        },
      };
    } catch {
      return {
        summary: { total: 0, requested: 0, responded: 0, validated: 0 },
        correctionAlert: null,
        unread: { count: 0, hasUnread: false, lastUnreadAt: null as string | null },
      };
    }
  })();

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

    correctionAlert: pendingSummary.correctionAlert,
    pendingSummary: pendingSummary.summary,
    unread: pendingSummary.unread,
    requester: {
      fullName: request["requester_name"] as string,
      corporateEmail: request["requester_email"] as string,
      area: (request["requester_area"] as string | null) ?? "",
      department: (request["requester_department"] as string | null) ?? undefined,
      manager: (request["requester_manager"] as string | null) ?? "",
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
 * descartando o wrapper legado da triagem (`__triage`) quando presente.
 *
 * A partir da v2.0 a triagem vive na tabela `triages` (não escreve mais neste
 * campo); o strip de `__triage` permanece apenas defensivo para dados legados.
 * O texto bruto restante — observações não-JSON (guardadas sob `observations`)
 * ou qualquer outra chave customizada — continua sendo o `internalObservations`
 * do contrato.
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

// --- Acompanhamento do solicitante (GET /requests/:protocol/tracking) -------
// Contrato em `../DTOs/requests/RequestTracking.dto.ts` (espelho fiel de
// `frontend/src/lib/types/requester-tracking.ts`). O `mode` é decidido pela
// credencial resolvida no middleware dual: cookie de sessão do dono →
// `authenticated`; header `X-Requester-Identity` verificado em modo PUBLIC →
// `public`. Nunca devolve dados internos (triagem, priorização, anotações).

/** Credencial resolvida por `shared/middleware/dualAuth.ts`. */
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
}

const TRACKING_INVALID_IDENTITY = "Valide seus dados para acompanhar esta solicitação.";

function mapTrackingMeeting(row: Record<string, unknown>): Meeting | null {
  const scheduledFor = row["meeting_scheduled_for"]
    ? new Date(row["meeting_scheduled_for"] as string).toISOString()
    : null;

  if (!scheduledFor) return null;

  return { scheduledFor, link: (row["meeting_link"] as string | null) ?? null };
}

function mapTrackingRequester(row: Record<string, unknown>): RequesterBlock {
  return {
    fullName: (row["requester_name"] as string) ?? "",
    corporateEmail: (row["requester_email"] as string) ?? "",
    area: (row["requester_area"] as string | null) ?? "",
    department: (row["requester_department"] as string | null) ?? undefined,
    manager: (row["requester_manager"] as string | null) ?? "",
    additionalContact: (row["requester_additional_contact"] as string | null) ?? undefined,
  };
}

function mapTrackingDemand(row: Record<string, unknown>): DemandBlock {
  return {
    title: row["title"] as string,
    requestType: row["request_type"] as string,
    category: (row["category"] as string | null) ?? "",
    processName: row["process_name"] as string,
    description: row["need_description"] as string,
    problem: row["problem_opportunity"] as string,
    expectedResult: row["expected_result"] as string,
    justification: row["justification"] as string,
  };
}

function mapTrackingImpacts(row: Record<string, unknown>): PublicOperationalImpacts {
  return {
    mainRisks: row["main_risks"] as string,
    clientImpact: row["client_impact"] as string,
    operationalImpact: row["operational_impact"] as OperationalImpact,
    perceivedCriticality: row["perceived_criticality"] as RequestPriority,
    desiredDeadline: toDateOnly(row["desired_deadline"] as string | Date),
  };
}

function mapTrackingComplementary(row: Record<string, unknown>): ComplementaryBlock {
  return {
    hasProcessDocumentation: toYesNoDetail(
      row["has_process_documentation"] as boolean | null,
      row["process_documentation_detail"] as string | null,
    ),
    hasSimilarSolution: toYesNoDetail(
      row["has_similar_solution"] as boolean | null,
      row["similar_solution_detail"] as string | null,
    ),
    dependsOnOtherAreas: toYesNoDetail(
      row["depends_on_other_areas"] as boolean | null,
      row["other_areas_detail"] as string | null,
    ),
    handlesRestrictedInfo: toYesNoDetail(
      row["handles_restricted_info"] as boolean | null,
      row["restricted_info_detail"] as string | null,
    ),
    additionalNotes: (row["additional_notes"] as string | null) ?? undefined,
  };
}

function buildPublicDetails(row: Record<string, unknown>): PublicRequestDetails {
  const openedAt = normalizeIsoDate(row["created_at"]) ?? new Date().toISOString();

  return {
    protocol: row["protocol"] as string,
    status: (row["public_status"] as string | null) ?? "Solicitação enviada",
    openedAt,
    lastUpdate:
      normalizeIsoDate(row["last_external_update_at"]) ??
      normalizeIsoDate(row["updated_at"]) ??
      openedAt,
    lastTechnicalMessage: (row["last_technical_message"] as string | null) ?? null,
    meeting: mapTrackingMeeting(row),
    requester: mapTrackingRequester(row),
    demand: mapTrackingDemand(row),
    impacts: mapTrackingImpacts(row),
  };
}

async function buildAuthenticatedDetails(
  row: Record<string, unknown>,
): Promise<RequesterRequestDetails> {
  const requestId = row["request_id"] as string;
  const [attachments, schedulePreferences] = await Promise.all([
    repository.findAttachmentsByRequestId(requestId),
    repository.findSchedulePreferencesByRequestId(requestId),
  ]);

  const meeting = mapTrackingMeeting(row);
  const complementary = mapTrackingComplementary(row);
  // O modo autenticado não tem `impacts`: os mesmos campos vivem dentro de
  // `operational` (`RequesterOperational extends PublicOperationalImpacts`).
  const { impacts, ...base } = buildPublicDetails(row);

  return {
    ...base,
    operational: {
      ...impacts,
      processDescription: row["process_description"] as string,
      processSteps: row["process_steps"] as string,
      systemsUsed: row["systems_used"] as string,
      executionFrequency: row["execution_frequency"] as string,
      volumetry: row["approximate_volume"] as string,
      peopleInvolved: row["people_involved"] as number,
      averageExecutionTime: row["average_duration"] as string,
      monthlyEffortHours: Number(row["estimated_monthly_effort"]),
      hasManualControls: toRequiredYesNoDetail(
        row["has_manual_controls"] as boolean,
        row["manual_controls_detail"] as string | null,
      ),
    },
    complementary: hasComplementaryData(complementary) ? complementary : undefined,
    schedulePreferences:
      schedulePreferences.length > 0
        ? schedulePreferences.map((preference) => toDateTimeMinutes(preference.scheduled_for))
        : null,
    mappingDate: meeting ? toSaoPauloDateOnly(meeting.scheduledFor) : null,
    // Anexos do acompanhamento: metadados apenas; sem endpoint de download o
    // `downloadUrl` fica vazio e `canDownload` falso (mesma postura do /internal).
    attachments: attachments.map((attachment) => ({
      id: attachment.attachment_id as string,
      fileName: attachment.file_name as string,
      mimeType: attachment.content_type as string,
      sizeBytes: Number(attachment.size_bytes),
      downloadUrl: "",
      canDownload: false,
    })),
  };
}

/**
 * Dono da solicitação na sessão autenticada.
 *
 * A fonte primária é o vínculo direto `requests.requester_user_id` (gravado no
 * `POST /requests` em modo AUTHENTICATED), imune a uma troca posterior de
 * e-mail/nome no cadastro.
 */
function isTrackingOwner(row: Record<string, unknown>, user: AuthenticatedUser): boolean {
  return isRequesterOwner(
    { id: Number(user.id), email: user.email },
    {
      requesterUserId: row["requester_user_id"] as number | null | undefined,
      requesterEmail: row["requester_email"] as string | null | undefined,
    },
  );
}

async function getAuthenticatedTracking(
  protocol: string,
  user: AuthenticatedUser,
): Promise<TrackingDetailsResponse> {
  const row = (await repository.findInternalRequestByProtocol(protocol)) as unknown as Record<
    string,
    unknown
  > | null;

  // Protocolo inexistente ou de terceiro: mesma resposta (404), para não
  // revelar a existência de solicitações alheias (anti-enumeração). A chave
  // `request:track` é o gate da rota; a linha é resolvida pela Posse — qualquer
  // Perfil que abriu a solicitação recebe a projeção do Solicitante.
  if (!row || !isTrackingOwner(row, user)) {
    throw new AppError("Protocolo não encontrado", 404);
  }

  return { mode: "authenticated", details: await buildAuthenticatedDetails(row) };
}

async function getPublicTracking(
  protocol: string,
  identity: { name: string; email: string } | null,
): Promise<TrackingDetailsResponse> {
  const mode = await getSolicitationMode();

  if (mode !== "PUBLIC") {
    throw new AppError("Verificação indisponível no modo atual", 403);
  }

  // Sem cookie e sem header válido: exige validação prévia (anti-enumeração).
  if (!identity) {
    throw new AppError(TRACKING_INVALID_IDENTITY, 401);
  }

  const row = (await repository.findInternalRequestByProtocol(protocol)) as unknown as Record<
    string,
    unknown
  > | null;

  const nameOk =
    row !== null &&
    normalizeName((row["requester_name"] as string) ?? "") === normalizeName(identity.name);
  const emailOk =
    row !== null &&
    normalizeEmail((row["requester_email"] as string) ?? "") === normalizeEmail(identity.email);

  // Inexistente ou divergente → mesmo 401 genérico: não revela qual dado
  // divergiu nem se o protocolo existe.
  if (!row || !nameOk || !emailOk) {
    throw new AppError(TRACKING_INVALID_IDENTITY, 401);
  }

  return { mode: "public", details: buildPublicDetails(row) };
}

/**
 * `GET /requests/:protocol/tracking` — detalhe bimodal do acompanhamento.
 * O `mode` é decidido pela credencial: sessão do dono → `authenticated`;
 * identidade pública em modo PUBLIC → `public`.
 */
export async function getTracking(
  protocol: string,
  caller: TrackingCaller,
): Promise<TrackingDetailsResponse> {
  const normalizedProtocol = protocol.trim();

  if (normalizedProtocol === "") {
    throw new AppError("Protocolo é obrigatório", 400);
  }

  if (caller.user) {
    return getAuthenticatedTracking(normalizedProtocol, caller.user);
  }

  return getPublicTracking(normalizedProtocol, caller.requesterIdentity ?? null);
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
  requester_area: string | null;
  requester_department: string | null;
  requester_manager: string | null;
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
      area: request.requester_area ?? "",
      department: request.requester_department ?? undefined,
      manager: request.requester_manager ?? "",
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
  actor: RequestActor,
  ipAddress: string | undefined,
): Promise<RequestInternalDetailDTO | RequestMutationAcknowledgement> {
  const request = await requireRequestCustody(
    await repository.findInternalRequestByProtocol(protocol.trim()),
    actor,
    protocol.trim(),
    ipAddress,
    "request:write sem custódia",
    (row) => hasResponsibleCustody(actor, "request:write", row.assignee_user_id),
  );

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
      ipAddress,
      changeOrigin: "admin",
    });
  });

  // Quando o ator também tem request:read com custódia sobre a linha, devolve
  // o DTO completo. Caso contrário (ex.: request:write sem request:read), cumpre
  // o contrato com 200 { protocol, updated: true } sem exigir leitura da linha.
  const updatedRequest = await repository.findAssignmentContextByProtocol(protocol.trim());
  if (
    updatedRequest &&
    hasResponsibleCustody(actor, "request:read", updatedRequest.assignee_user_id)
  ) {
    return findInternalByProtocol(protocol.trim(), actor, ipAddress);
  }

  return { protocol: protocol.trim(), updated: true };
}

export async function listAssignees(): Promise<AssigneeSummary[]> {
  return repository.findActiveAssignees();
}

// RN-010 — ao salvar o responsável de uma demanda em triagem já aprovada como
// elegível, o status avança automaticamente para "Aguardando mapeamento".
const RN010_FROM_STATUS: RequestStatus = "Em triagem";
const RN010_TO_STATUS: RequestStatus = "Aguardando mapeamento";
const RN010_ELIGIBLE_SCREENING = "elegivel";

async function validateAssigneeCandidate(
  candidate: AssignmentCandidateRow | undefined,
  stage: "triage" | "mapping",
): Promise<AssignmentCandidateRow> {
  const invalidTarget = () =>
    new AppError("O alvo não pode ser escolhido como Responsável.", 400, "assignee_not_assignable");

  if (
    !candidate ||
    !candidate.profile_is_active ||
    !candidate.user_is_active ||
    candidate.professional_status !== "active"
  ) {
    throw invalidTarget();
  }
  const flagEnabled =
    stage === "triage" ? candidate.is_assignable_triage : candidate.is_assignable_mapping;
  if (
    !flagEnabled ||
    !(await repository.profileHasAssignablePermissions(candidate.profile_id, stage))
  ) {
    throw invalidTarget();
  }

  return candidate;
}

async function resolveAssigneeByUserId(
  userId: string,
  stage: "triage" | "mapping",
): Promise<{ professionalId: string; id: string; name: string; email: string }> {
  const candidate = await repository.findAssignmentCandidateByUserId(userId);
  const assignable = await validateAssigneeCandidate(candidate, stage);
  return {
    professionalId: assignable.professional_id,
    id: String(assignable.user_id),
    name: assignable.name,
    email: assignable.email,
  };
}

async function resolveAssignee(
  professionalId: string,
  stage: "triage" | "mapping",
): Promise<{ professionalId: string; id: string; name: string; email: string }> {
  const candidate = await repository.findAssignmentCandidateById(professionalId);
  const assignable = await validateAssigneeCandidate(candidate, stage);
  return {
    professionalId: assignable.professional_id,
    id: String(assignable.user_id),
    name: assignable.name,
    email: assignable.email,
  };
}

async function validateAssignmentTarget<T>(
  protocol: string,
  actor: RequestActor,
  ipAddress: string | undefined,
  resolve: () => Promise<T>,
): Promise<T> {
  try {
    return await resolve();
  } catch (error) {
    if (error instanceof AppError && error.code === "assignee_not_assignable") {
      await recordAccessDeniedAttempt(protocol, actor.id, ipAddress, "alvo de atribuição inválido");
    }
    throw error;
  }
}

export async function assignResponsible(
  protocol: string,
  payload: AssignRequestPayload,
  actor: RequestActor,
  ipAddress: string | undefined,
): Promise<AssignRequestResponse> {
  const request = await requireRequestCustody(
    await repository.findAssignmentContextByProtocol(protocol.trim()),
    actor,
    protocol.trim(),
    ipAddress,
    "request:assign sem custódia",
    (row) => hasResponsibleCustody(actor, "request:assign", row.assignee_user_id),
  );

  // A atribuição é autorizada por request:assign e Custódia, sem decisão por
  // Perfil. A validação do alvo ocorre no service para definir ou reatribuir.
  const assignee =
    payload.professionalId === null || payload.professionalId === undefined
      ? null
      : await validateAssignmentTarget(protocol.trim(), actor, ipAddress, () =>
          resolveAssignee(payload.professionalId as string, "triage"),
        );

  const previousId = request.professional_id;
  const nextId = assignee?.professionalId ?? null;
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
      ipAddress,
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
  actor: RequestActor,
  ipAddress: string | undefined,
): Promise<RequestInternalDetailDTO | RequestMutationAcknowledgement> {
  const request = await requireRequestCustody(
    await repository.findAssignmentContextByProtocol(protocol.trim()),
    actor,
    protocol.trim(),
    ipAddress,
    "request:assign sem custódia",
    (row) => hasResponsibleCustody(actor, "request:assign", row.assignee_user_id),
  );

  // A atribuição é autorizada por request:assign e Custódia, sem decisão por
  // Perfil. A validação do alvo ocorre no service para definir ou reatribuir.
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
          ipAddress,
          changeOrigin: "admin",
        });
      });
    } else {
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        throw new AppError("analystId vazio", 400);
      }
      const resolved = await validateAssignmentTarget(protocol.trim(), actor, ipAddress, () =>
        resolveAssigneeByUserId(String(raw), "triage"),
      );
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
          ipAddress,
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
            ipAddress,
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
          ipAddress,
          changeOrigin: "admin",
        });
      });
    } else {
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        throw new AppError("analystId vazio", 400);
      }
      const resolved = await validateAssignmentTarget(protocol.trim(), actor, ipAddress, () =>
        resolveAssigneeByUserId(String(raw), "mapping"),
      );
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
          ipAddress,
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
            ipAddress,
            changeOrigin: "admin",
          });
        } else {
          await repository.updateAssignee(trx, request.request_id, null, actor.email);
        }
      });
    }
  }

  const updatedRequest = await repository.findAssignmentContextByProtocol(protocol.trim());
  if (
    updatedRequest &&
    hasResponsibleCustody(actor, "request:read", updatedRequest.assignee_user_id)
  ) {
    return findInternalByProtocol(protocol.trim(), actor, ipAddress);
  }

  return { protocol: protocol.trim(), updated: true };
}

// --- PATCH /requests/:protocol/status (Motor de Status v4) -------------------
// request:status_change + Custódia libera alvos ativos não restritos no modo
// free. Alvos restritos ou fora desse modo exigem request:status_override
// global. As recusas são auditadas sem revelar solicitações fora da Custódia.

export async function updateRequestStatus(
  protocol: string,
  payload: UpdateStatusPayload,
  actor: RequestActor,
  ipAddress: string | undefined,
): Promise<UpdateStatusResponse> {
  const request = await requireRequestCustody(
    await repository.findRequestStatusContext(protocol.trim()),
    actor,
    protocol.trim(),
    ipAddress,
    "request:status_change sem custódia",
    (row) => hasResponsibleCustody(actor, "request:status_change", row.assignee_user_id),
  );

  const target = await repository.findRequestStatusTarget(payload.targetStatus);
  if (!target) {
    throw new AppError("Status de destino não encontrado", 404);
  }

  if (request.current_status_id !== null && request.current_status_id === target.status_id) {
    throw new AppError("A solicitação já está neste status.", 422);
  }

  if (!target.is_active) {
    await recordAccessDeniedAttempt(
      request.protocol,
      actor.id,
      ipAddress,
      `tentativa de definir status inativo (id ${target.status_id})`,
    );
    throw new AppError("Status inativo não pode ser alvo.", 409);
  }

  const requiresOverride =
    target.is_restricted || (target.triage_mode !== "free" && target.mapping_mode !== "free");
  const hasStatusOverride = custodyFor(actor, "request:status_override") === "global";
  if (requiresOverride && !hasStatusOverride) {
    await recordAccessDeniedAttempt(
      request.protocol,
      actor.id,
      ipAddress,
      "alvo de status exige request:status_override",
    );
    throw new AppError(
      "O status de destino exige permissão de override.",
      403,
      "request_status_override_required",
    );
  }

  if (target.isPublic && payload.lastTechnicalMessage == null) {
    throw new AppError("Retorno ao solicitante obrigatório para status público.", 400);
  }

  const actionType: "request.status_change" | "request.status_override" = requiresOverride
    ? "request.status_override"
    : "request.status_change";
  const changeOrigin = "internal";

  const lastUpdate = await db.transaction(async (trx) => {
    const persistedAt = await applyStatusTransition(trx, {
      requestId: request.request_id,
      target: {
        status_id: target.status_id,
        name: target.name,
        isPublic: target.isPublic,
      },
      updatedBy: actor.email,
      lastTechnicalMessage: payload.lastTechnicalMessage,
      expectedStatusId: request.current_status_id,
    });

    await recordAudit(trx, {
      entityType: "request",
      entityId: request.protocol,
      actionType,
      userId: actor.id,
      previousValue: request.current_status_name,
      newValue: target.name,
      // `note` = justificativa interna; o retorno público é snapshot próprio
      // (nunca concatenado), persistido apenas quando o destino é público.
      note: payload.justification ?? null,
      lastTechnicalMessage: target.isPublic ? (payload.lastTechnicalMessage ?? null) : null,
      ipAddress,
      changeOrigin,
    });

    return persistedAt;
  });

  return {
    protocol: request.protocol,
    status: target.name,
    previous: request.current_status_name ?? "",
    next: target.name,
    lastUpdate,
  };
}
