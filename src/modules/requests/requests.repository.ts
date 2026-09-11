import db from "../../database/conection.ts";
import type { RequestDetail } from "../DTOs/requests/RequestResponse.dto.ts";

function normalizeIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function findRequestByProtocol(protocol: string): Promise<RequestDetail | null> {
  const response = await db("requests as r")
    .leftJoin("requesters as requester", "requester.requester_id", "r.requester_id")
    .leftJoin("professionals as professional", "professional.professional_id", "r.professional_id")
    .leftJoin("statuses as status", "status.status_id", "r.status_id")
    .select(
      "r.protocol as protocol",
      "r.title as demandTitle",
      "r.process_name as processName",
      "status.name as status",
      "professional.full_name as assigneeName",
      "r.created_at as openedAt",
      "r.desired_deadline as estimatedCompletion",
      "r.next_steps as nextSteps",
      "r.internal_notes as lastTechnicalMessage",
      "r.last_external_update_at as lastUpdate",
    )
    .where("r.protocol", protocol)
    .first();

  if (!response) return null;

  const meeting = null;
  const openedAt = normalizeIsoDate(response.openedAt) ?? new Date().toISOString();

  return {
    protocol: response.protocol,
    demandTitle: response.demandTitle ?? "",
    processName: response.processName ?? "",
    status: response.status,
    assigneeName: response.assigneeName ?? null,
    openedAt,
    estimatedCompletion: normalizeIsoDate(response.estimatedCompletion),
    mappingDate: null,
    meeting,
    pendingIssues: [],
    nextStep: response.nextSteps ?? "Aguarde o contato do analista",
    lastTechnicalMessage: response.lastTechnicalMessage ?? null,
    lastUpdate: normalizeIsoDate(response.lastUpdate) ?? openedAt,
    conclusion: null,
  } satisfies RequestDetail;
}
