import db from "../../database/conection.ts";
import { generateTempProtocol } from "../../shared/protocol/generateProtocol.ts";
import {
  requestCategoryToIdMAP,
  type RequesterBlock,
  type RequesterTable,
} from "../../shared/types/requests.ts";
import type { CreateRequestPayload } from "../DTOs/requests/RequestRequests.dto.ts";
import type { CreateRequestResponse } from "../DTOs/requests/RequestResponse.dto.ts";

export async function findRequesterByEmail(email: RequesterBlock["corporateEmail"]) {
  const row: RequesterTable | undefined = await db("requesters")
    .where({ corporate_email: email })
    .first();

  if (!row) {
    return null;
  }

  return row;
}

export async function saveRequester(requester: RequesterBlock) {
  const rows = (await db("requesters")
    .insert({
      full_name: requester.fullName,
      corporate_email: requester.corporateEmail,
      role: "Solicitante",
      area: requester.area,
      department: requester.department,
      manager_name: requester.manager,
      additional_contact: requester.additionalContact,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("requester_id")) as Array<{ requester_id: number }>;

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to save the requester.");
  }

  return row.requester_id;
}

interface RequestInsertReturning {
  protocol: string;
  status: CreateRequestResponse["status"];
  created_at: Date;
}

export async function saveRequest(request: CreateRequestPayload, requesterId: number) {
  const insertedRows = (await db("request")
    .insert({
      protocol: generateTempProtocol(),
      requester_id: requesterId,
      category_id: requestCategoryToIdMAP[request.demand.category],
      current_process_name: request.demand.processName,
      title: request.demand.title,
      necessity_description: request.demand.description,
      result_justification: request.demand.justification,
      monthly_approximated_volumetry: request.operational.volumetry,
      item_average_execution_time: request.operational.averageExecutionTime,
      perceived_operational_impact: request.operational.operationalImpact,
      desired_deadline: request.operational.desiredDeadline,
      prefarable_schedule_mapping: request.schedulePreferences ?? null,
      status: "Solicitação enviada",
      analist_id: null,
      total_score: null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(["protocol", "status", "created_at"])) as RequestInsertReturning[];

  const row = insertedRows[0];
  if (!row) {
    throw new Error("Failed to save the request.");
  }

  return {
    protocol: row.protocol,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  } satisfies CreateRequestResponse;
}
