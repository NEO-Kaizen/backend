import type { Knex } from "knex";
import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { generateProtocol } from "../../shared/protocol/generateProtocol.ts";
import type { SavedAttachment } from "../../shared/storage/fileStorage.ts";
import {
  normalizeIsoDate,
  normalizeIsoDateOnly,
  toSaoPauloDateOnly,
} from "../../shared/utils/date.ts";
import type {
  RequestPriority,
  RequestStatus,
  RequesterBlock,
  RequesterTable,
  YesNoDetail,
  AssignmentCandidateRow,
  AssignmentContextRow,
} from "../../shared/types/requests.ts";
import type {
  CreateRequestPayload,
  ListRequestsQuery,
} from "../DTOs/requests/RequestRequests.dto.ts";
import type { RequestDetail } from "../DTOs/requests/RequestResponse.dto.ts";
import type {
  AssigneeSummary,
  CreateRequestResponse,
  RequestSummary,
} from "../DTOs/requests/RequestResponse.dto.ts";
import type { PaginatedResponse } from "../../shared/types/pagination.ts";

const INITIAL_STATUS = "Solicitação enviada";

interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}

function yesNoDetail(value: YesNoDetail | undefined): YesNoDetailColumns {
  if (typeof value === "string") {
    return { flag: true, detail: value };
  }
  if (value === false) {
    return { flag: false, detail: null };
  }
  return { flag: null, detail: null };
}

async function findActiveCategoryId(name: string, trx: Knex.Transaction): Promise<number | null> {
  const row: { category_id: number } | undefined = await trx("categories")
    .where({ name, status: "active" })
    .first("category_id");

  return row?.category_id ?? null;
}

async function findStatusId(name: string, trx: Knex.Transaction): Promise<number> {
  const row: { status_id: number } | undefined = await trx("statuses")
    .where({ name })
    .first("status_id");

  if (!row) {
    throw new Error(`Status não encontrado: ${name}.`);
  }

  return row.status_id;
}

async function upsertRequester(requester: RequesterBlock, trx: Knex.Transaction): Promise<string> {
  const email = requester.corporateEmail.trim().toLowerCase();

  await trx("requesters")
    .insert({
      full_name: requester.fullName,
      corporate_email: email,
      area: requester.area,
      department: requester.department ?? null,
      manager_name: requester.manager,
      additional_contact: requester.additionalContact ?? null,
      created_at: trx.fn.now(),
    })
    .onConflict("corporate_email")
    .ignore();

  const row: RequesterTable | undefined = await trx("requesters")
    .where({ corporate_email: email })
    .first();

  if (!row) {
    throw new Error("Failed to save the requester.");
  }

  return row.requester_id;
}

interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}

async function nextRequestId(trx: Knex.Transaction): Promise<string> {
  const result = (await trx.raw("SELECT nextval('requests_request_seq') AS request_id")) as {
    rows: Array<{ request_id: string }>;
  };

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to allocate the request id.");
  }

  return row.request_id;
}

async function insertRequest(
  request: CreateRequestPayload,
  requesterId: string,
  categoryId: number,
  statusId: number,
  trx: Knex.Transaction,
): Promise<RequestInsertReturning> {
  const email = request.requester.corporateEmail.trim().toLowerCase();
  const requestId = await nextRequestId(trx);

  const manualControls = yesNoDetail(request.operational.hasManualControls);
  const processDocumentation = yesNoDetail(request.complementary?.hasProcessDocumentation);
  const similarSolution = yesNoDetail(request.complementary?.hasSimilarSolution);
  const otherAreas = yesNoDetail(request.complementary?.dependsOnOtherAreas);
  const restrictedInfo = yesNoDetail(request.complementary?.handlesRestrictedInfo);

  const insertedRows = (await trx("requests")
    .insert({
      request_id: requestId,
      protocol: generateProtocol(requestId),
      requester_id: requesterId,
      category_id: categoryId,
      status_id: statusId,
      priority_id: null,
      professional_id: null,

      // Demand block
      title: request.demand.title,
      request_type: request.demand.requestType,
      process_name: request.demand.processName,
      need_description: request.demand.description,
      problem_opportunity: request.demand.problem,
      expected_result: request.demand.expectedResult,
      justification: request.demand.justification,

      // Operational block
      process_description: request.operational.processDescription,
      process_steps: request.operational.processSteps,
      systems_used: request.operational.systemsUsed,
      execution_frequency: request.operational.executionFrequency,
      approximate_volume: request.operational.volumetry,
      people_involved: request.operational.peopleInvolved,
      average_duration: request.operational.averageExecutionTime,
      estimated_monthly_effort: request.operational.monthlyEffortHours,
      has_manual_controls: manualControls.flag,
      manual_controls_detail: manualControls.detail,
      main_risks: request.operational.mainRisks,
      client_impact: request.operational.clientImpact,
      operational_impact: request.operational.operationalImpact,
      desired_deadline: request.operational.desiredDeadline,
      perceived_criticality: request.operational.perceivedCriticality,

      // Complementary block (optional)
      has_process_documentation: processDocumentation.flag,
      process_documentation_detail: processDocumentation.detail,
      has_similar_solution: similarSolution.flag,
      similar_solution_detail: similarSolution.detail,
      depends_on_other_areas: otherAreas.flag,
      other_areas_detail: otherAreas.detail,
      handles_restricted_info: restrictedInfo.flag,
      restricted_info_detail: restrictedInfo.detail,
      additional_notes: request.complementary?.additionalNotes ?? null,

      created_by: email,
      updated_by: email,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
      last_external_update_at: trx.fn.now(),
    })
    .returning(["request_id", "protocol", "created_at"])) as RequestInsertReturning[];

  const row = insertedRows[0];
  if (!row) {
    throw new Error("Failed to save the request.");
  }

  return row;
}

async function saveTimePreferences(
  requestId: string,
  preferences: string[] | undefined,
  trx: Knex.Transaction,
): Promise<void> {
  if (!preferences || preferences.length === 0) {
    return;
  }

  await trx("request_time_preferences").insert(
    preferences.map((scheduledFor) => ({
      request_id: requestId,
      scheduled_for: scheduledFor,
      created_at: trx.fn.now(),
    })),
  );
}

async function saveAttachments(
  requestId: string,
  attachments: SavedAttachment[],
  uploadedBy: string,
  trx: Knex.Transaction,
): Promise<void> {
  if (attachments.length === 0) {
    return;
  }

  await trx("attachments").insert(
    attachments.map((attachment) => ({
      request_id: requestId,
      file_name: attachment.fileName,
      file_path: attachment.storageKey,
      content_type: attachment.mimeType,
      size_bytes: attachment.sizeBytes,
      is_restricted: false,
      uploaded_by: uploadedBy,
      uploaded_at: trx.fn.now(),
    })),
  );
}

export async function createRequest(
  request: CreateRequestPayload,
  attachments: SavedAttachment[],
): Promise<CreateRequestResponse> {
  return db.transaction(async (trx) => {
    const categoryId = await findActiveCategoryId(request.demand.category, trx);
    if (categoryId === null) {
      throw new AppError("Categoria inválida — selecione uma opção da lista.", 400);
    }

    const statusId = await findStatusId(INITIAL_STATUS, trx);
    const requesterId = await upsertRequester(request.requester, trx);
    const saved = await insertRequest(request, requesterId, categoryId, statusId, trx);
    const email = request.requester.corporateEmail.trim().toLowerCase();

    await saveTimePreferences(saved.request_id, request.schedulePreferences, trx);
    await saveAttachments(saved.request_id, attachments, email, trx);

    return {
      protocol: saved.protocol,
      status: INITIAL_STATUS,
      createdAt: saved.created_at.toISOString(),
    } satisfies CreateRequestResponse;
  });
}

export async function findStatusByName(name: string): Promise<boolean> {
  const row = await db("statuses").where({ name }).first("status_id");

  return row !== undefined;
}

interface RequestSummaryRow {
  protocol: string;
  process_name: string;
  priority: RequestPriority | null;
  status: RequestStatus;
  assignee: string | null;
  requester_name: string;
  created_at: Date;
}

function baseSummaryQuery(query: ListRequestsQuery) {
  return db("requests")
    .join("requesters", "requesters.requester_id", "requests.requester_id")
    .join("statuses", "statuses.status_id", "requests.status_id")
    .leftJoin("priorities", "priorities.priority_id", "requests.priority_id")
    .leftJoin(
      "details_professional",
      "details_professional.professional_id",
      "requests.professional_id",
    )
    .leftJoin("users as assignee_user", "assignee_user.user_id", "details_professional.user_id")
    .where("requesters.corporate_email", query.email)
    .modify((builder) => {
      if (query.status) {
        builder.where("statuses.name", query.status);
      }
    });
}

export async function findRequestsByRequesterEmail(
  query: ListRequestsQuery,
): Promise<PaginatedResponse<RequestSummary>> {
  const countRows = (await baseSummaryQuery(query).count<{ count: string }[]>({
    count: "*",
  })) as { count: string }[];
  const total = Number(countRows[0]?.count ?? 0);

  const rows = (await baseSummaryQuery(query)
    .select({
      protocol: "requests.protocol",
      process_name: "requests.process_name",
      priority: "priorities.level",
      status: "statuses.name",
      assignee: "assignee_user.full_name",
      requester_name: "requesters.full_name",
      created_at: "requests.created_at",
    })
    .orderBy("requests.created_at", "desc")
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)) as RequestSummaryRow[];

  return {
    data: rows.map((row) => ({
      protocol: row.protocol,
      createdAt: row.created_at.toISOString(),
      processName: row.process_name,
      priority: row.priority,
      status: row.status,
      assignee: row.assignee,
      requesterName: row.requester_name,
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
  };
}

export async function findRequestByProtocol(protocol: string): Promise<RequestDetail | null> {
  const response = await db("requests as r")
    .leftJoin("requesters as requester", "requester.requester_id", "r.requester_id")
    .leftJoin(
      "details_professional as professional",
      "professional.professional_id",
      "r.professional_id",
    )
    .leftJoin("users as assignee_user", "assignee_user.user_id", "professional.user_id")
    .leftJoin("statuses as status", "status.status_id", "r.status_id")
    .select(
      "r.protocol as protocol",
      "r.title as demandTitle",
      "r.process_name as processName",
      "status.name as status",
      "assignee_user.full_name as assigneeName",
      "r.created_at as openedAt",
      "r.estimated_completion as estimatedCompletion",
      "r.next_steps as nextSteps",
      "r.last_technical_message as lastTechnicalMessage",
      "r.meeting_scheduled_for as meetingScheduledFor",
      "r.meeting_link as meetingLink",
      "r.last_external_update_at as lastUpdate",
    )
    .where("r.protocol", protocol)
    .first();

  if (!response) return null;

  const meetingScheduledFor = normalizeIsoDate(response.meetingScheduledFor);
  const meeting = meetingScheduledFor
    ? { scheduledFor: meetingScheduledFor, link: response.meetingLink ?? null }
    : null;
  const openedAt = normalizeIsoDate(response.openedAt) ?? new Date().toISOString();

  return {
    protocol: response.protocol,
    demandTitle: response.demandTitle ?? "",
    processName: response.processName ?? "",
    status: response.status,
    assigneeName: response.assigneeName ?? null,
    openedAt,
    estimatedCompletion: normalizeIsoDateOnly(response.estimatedCompletion),
    mappingDate: meetingScheduledFor ? toSaoPauloDateOnly(meetingScheduledFor) : null,
    meeting,
    pendingIssues: [],
    nextStep: response.nextSteps ?? "Aguarde o contato do analista",
    lastTechnicalMessage: response.lastTechnicalMessage ?? null,
    lastUpdate: normalizeIsoDate(response.lastUpdate) ?? openedAt,
    conclusion: null,
  } satisfies RequestDetail;
}

// --- Consulta administrativa/interna (issue #48 + contract-assign-action) ---

export async function findInternalRequestByProtocol(protocol: string) {
  const hasMapping = await db.schema.hasColumn("requests", "mapping_professional_id");

  let query = db("requests")
    .where({ "requests.protocol": protocol })
    .leftJoin("requesters", "requesters.requester_id", "requests.requester_id")
    .leftJoin("categories", "categories.category_id", "requests.category_id")
    .leftJoin("statuses", "statuses.status_id", "requests.status_id")
    .leftJoin("priorities", "priorities.priority_id", "requests.priority_id")
    .leftJoin(
      "details_professional as dp_assignee",
      "dp_assignee.professional_id",
      "requests.professional_id",
    )
    .leftJoin("users as assignee_user", "assignee_user.user_id", "dp_assignee.user_id");

  if (hasMapping) {
    query = query
      .leftJoin(
        "details_professional as dp_mapping",
        "dp_mapping.professional_id",
        "requests.mapping_professional_id",
      )
      .leftJoin("users as mapping_user", "mapping_user.user_id", "dp_mapping.user_id");
  }

  const baseSelect = [
    "requests.request_id",
    "requests.protocol",
    "requests.title",
    "requests.request_type",
    "requests.process_name",
    "requests.need_description",
    "requests.problem_opportunity",
    "requests.expected_result",
    "requests.justification",
    "requests.process_description",
    "requests.process_steps",
    "requests.systems_used",
    "requests.execution_frequency",
    "requests.approximate_volume",
    "requests.people_involved",
    "requests.average_duration",
    "requests.estimated_monthly_effort",
    "requests.has_manual_controls",
    "requests.manual_controls_detail",
    "requests.main_risks",
    "requests.client_impact",
    "requests.operational_impact",
    "requests.desired_deadline",
    "requests.perceived_criticality",
    "requests.has_process_documentation",
    "requests.process_documentation_detail",
    "requests.has_similar_solution",
    "requests.similar_solution_detail",
    "requests.depends_on_other_areas",
    "requests.other_areas_detail",
    "requests.handles_restricted_info",
    "requests.restricted_info_detail",
    "requests.additional_notes",
    "requests.internal_notes",
    "requests.meeting_scheduled_for",
    "requests.meeting_link",
    "requests.created_at",
    "requests.updated_at",
    "categories.name as category",
    "statuses.name as status",
    "priorities.level as priority",
    "assignee_user.user_id as assignee_user_id",
    "assignee_user.full_name as professional_name",
    "assignee_user.email as professional_email",
    "requesters.full_name as requester_name",
    "requesters.corporate_email as requester_email",
    "requesters.area as requester_area",
    "requesters.department as requester_department",
    "requesters.manager_name as requester_manager",
    "requesters.additional_contact as requester_additional_contact",
  ];

  const mappingSelect = hasMapping
    ? [
        "requests.mapping_professional_id",
        "mapping_user.user_id as mapping_user_id",
        "mapping_user.full_name as mapping_name",
        "mapping_user.email as mapping_email",
      ]
    : [
        db.raw("NULL::uuid as mapping_professional_id"),
        db.raw("NULL::int as mapping_user_id"),
        db.raw("NULL::text as mapping_name"),
        db.raw("NULL::text as mapping_email"),
      ];

  const request = await query.select([...baseSelect, ...mappingSelect]).first();

  return request ?? null;
}

export async function findAttachmentsByRequestId(requestId: string | number) {
  return db("attachments")
    .where({ request_id: requestId })
    .select("file_name", "content_type", "size_bytes")
    .orderBy("uploaded_at", "asc");
}

export async function findSchedulePreferencesByRequestId(requestId: string | number) {
  return db("request_time_preferences")
    .where({ request_id: requestId })
    .select("scheduled_for")
    .orderBy("scheduled_for", "asc");
}

export async function findEvaluationByProtocol(
  protocol: string,
): Promise<{ score: number; classification: string } | undefined> {
  const row = await db("prioritization_evaluations")
    .where({ protocol })
    .first("score", "classification");

  if (!row) return undefined;

  return { score: Number(row.score), classification: row.classification };
}

/** Perfil que pode ser responsável técnico — contrato contract-assign-action.md: só Analista. */
export const ASSIGNABLE_PROFILES = ["analista"] as const;

export async function findActiveAssignees(): Promise<AssigneeSummary[]> {
  return db("details_professional as dp")
    .join("users as u", "u.user_id", "dp.user_id")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("dp.status", "active")
    .andWhere("u.is_active", true)
    .whereIn("p.name", ASSIGNABLE_PROFILES)
    .select({
      id: "dp.professional_id",
      name: "u.full_name",
      email: "u.email",
      jobTitle: "dp.job_title",
      capacity: "dp.capacity",
    })
    .orderBy("u.full_name", "asc");
}

/** Candidato a responsável por user_id (contrato usa users.user_id string). */
export async function findAssignmentCandidateByUserId(
  userId: string,
): Promise<AssignmentCandidateRow | undefined> {
  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) return undefined;
  return db("details_professional as dp")
    .join("users as u", "u.user_id", "dp.user_id")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("u.user_id", numericId)
    .first({
      id: "u.user_id",
      professional_id: "dp.professional_id",
      user_id: "u.user_id",
      name: "u.full_name",
      email: "u.email",
      professional_status: "dp.status",
      user_is_active: "u.is_active",
      profile_name: "p.name",
    });
}

/** Legado: busca por professional_id (mantido para compat). */
export async function findAssignmentCandidateById(
  professionalId: string,
): Promise<AssignmentCandidateRow | undefined> {
  return db("details_professional as dp")
    .join("users as u", "u.user_id", "dp.user_id")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .where("dp.professional_id", professionalId)
    .first({
      id: "u.user_id",
      professional_id: "dp.professional_id",
      user_id: "u.user_id",
      name: "u.full_name",
      email: "u.email",
      professional_status: "dp.status",
      user_is_active: "u.is_active",
      profile_name: "p.name",
    });
}

export async function findAssignmentContextByProtocol(
  protocol: string,
): Promise<AssignmentContextRow | undefined> {
  const hasMapping = await db.schema.hasColumn("requests", "mapping_professional_id");
  const columns: Record<string, string> = {
    request_id: "requests.request_id",
    protocol: "requests.protocol",
    professional_id: "requests.professional_id",
    status: "statuses.name",
    screening_result: "requests.screening_result",
  };
  if (hasMapping) {
    columns["mapping_professional_id"] = "requests.mapping_professional_id";
  }
  const row = await db("requests")
    .join("statuses", "statuses.status_id", "requests.status_id")
    .where("requests.protocol", protocol)
    .first(columns);

  if (!row) return undefined;
  if (!hasMapping) (row as AssignmentContextRow).mapping_professional_id = null;
  return row as AssignmentContextRow;
}

export async function updateAssignee(
  trx: Knex.Transaction,
  requestId: string,
  professionalId: string | null,
  updatedBy: string,
): Promise<void> {
  await trx("requests")
    .where({ request_id: requestId })
    .update({ professional_id: professionalId, updated_by: updatedBy, updated_at: trx.fn.now() });
}

export async function updateMappingAssignee(
  trx: Knex.Transaction,
  requestId: string,
  professionalId: string | null,
  updatedBy: string,
): Promise<void> {
  await trx("requests").where({ request_id: requestId }).update({
    mapping_professional_id: professionalId,
    updated_by: updatedBy,
    updated_at: trx.fn.now(),
  });
}

export async function updateStatus(
  trx: Knex.Transaction,
  requestId: string,
  statusName: RequestStatus,
  updatedBy: string,
): Promise<void> {
  const statusId = await findStatusId(statusName, trx);

  await trx("requests")
    .where({ request_id: requestId })
    .update({ status_id: statusId, updated_by: updatedBy, updated_at: trx.fn.now() });
}
