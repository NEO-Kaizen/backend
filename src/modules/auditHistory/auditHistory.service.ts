import { AppError } from "../../shared/errors/AppError.ts";
import type { Role } from "../../shared/types/role.ts";
import type {
  AuditHistoryQuery,
  AuditHistorySummary,
  AuditHistoryDetail,
  AuditHistoryListResponse,
  StatusTimeResponse,
} from "../DTOs/auditHistory/AuditHistory.dto.ts";
import * as repository from "./auditHistory.repository.ts";
import { auditCatalog, type AuditEntityName } from "../../shared/audit/auditCatalog.ts";
import {
  findRequestStatusContext,
  type RequestStatusContext,
} from "../requests/requests.repository.ts";
import {
  calculateStatusTime,
  type StatusTimeSummary,
  type StatusTimeTransition,
} from "./statusTime.ts";

const entityLabels: Record<AuditEntityName, string> = Object.fromEntries(
  Object.entries(auditCatalog).map(([key, val]) => [key, val.label]),
) as Record<AuditEntityName, string>;

export async function listAuditHistoryLogs(
  filters: AuditHistoryQuery,
): Promise<AuditHistoryListResponse> {
  const { items, total } = await repository.listAuditHistory(filters);

  const formatted: AuditHistorySummary[] = items.map((row) => ({
    audit_id: Number(row.audit_id),
    entity_type: row.entity_type,
    entity_type_label: entityLabels[row.entity_type as AuditEntityName] ?? row.entity_type,
    action_type: row.action_type,
    actor: {
      kind: row.user_id === null ? "system" : "user",
      userId: row.user_id,
      displayName: row.actor_name,
    },
    occurred_at: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
  }));

  return {
    items: formatted,
    total,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  };
}

function toDetail(
  row: NonNullable<Awaited<ReturnType<typeof repository.findAuditHistoryById>>>,
): AuditHistoryDetail {
  const occurredAt =
    row.occurred_at instanceof Date ? row.occurred_at.toISOString() : String(row.occurred_at);
  const userId = row.user_id === null ? null : Number(row.user_id);
  return {
    audit_id: Number(row.audit_id),
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action_type: row.action_type,
    actor: {
      kind: userId === null ? "system" : "user",
      userId,
      displayName: row.actor_name,
    },
    previous_value: row.previous_value,
    new_value: row.new_value,
    note: row.note,
    last_technical_message: row.last_technical_message ?? null,
    ip_address: row.ip_address ?? null,
    change_origin: row.change_origin,
    occurred_at: occurredAt,
  };
}

export async function getAuditHistoryDetail(auditId: number): Promise<AuditHistoryDetail> {
  const row = await repository.findAuditHistoryById(auditId);
  if (!row) {
    throw new AppError("Log não encontrado", 404);
  }
  return toDetail(row);
}

function parseStatusValue(value: string | null): string | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "string") return parsed;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "status" in parsed &&
      typeof parsed.status === "string"
    ) {
      return parsed.status;
    }
  } catch {
    return value;
  }

  return null;
}

function parseStatusTransition(value: string | null): { status: string; statusId?: number } | null {
  if (!value) return null;
  const status = parseStatusValue(value);
  if (!status) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null && "status_id" in parsed) {
      const statusId = parsed.status_id;
      if (typeof statusId === "number" && Number.isInteger(statusId)) {
        return { status, statusId };
      }
    }
  } catch {
    // Plain status names remain valid for historical audit rows.
  }
  return { status };
}

async function calculateStatusTimeForRequest(
  request: NonNullable<Awaited<ReturnType<typeof findRequestStatusContext>>>,
  now: Date,
): Promise<StatusTimeSummary> {
  const [pausedStatuses, auditRows] = await Promise.all([
    repository.listPausedStatuses(),
    repository.listAuditHistoryByProtocol(request.protocol),
  ]);

  const chronologicalRows = [...auditRows].reverse();
  const transitions: StatusTimeTransition[] = [];

  for (const row of chronologicalRows) {
    if (
      row.action_type !== "request.status_change" &&
      row.action_type !== "request.override_status_admin" &&
      row.action_type !== "request.triage"
    ) {
      continue;
    }

    const statusTransition = parseStatusTransition(row.new_value);
    if (!statusTransition) continue;

    const occurredAt =
      row.occurred_at instanceof Date ? row.occurred_at : new Date(String(row.occurred_at));
    if (Number.isNaN(occurredAt.getTime())) continue;

    transitions.push({ ...statusTransition, occurredAt });
  }

  const openedAt =
    request.created_at instanceof Date ? request.created_at : new Date(String(request.created_at));
  if (Number.isNaN(openedAt.getTime())) {
    throw new AppError("Data de abertura da solicitação inválida", 500);
  }

  const firstTransition = transitions[0];
  const earliestAuditRow = chronologicalRows.find(
    (row) =>
      row.action_type === "request.status_change" ||
      row.action_type === "request.override_status_admin" ||
      row.action_type === "request.triage",
  );
  const previousStatus = parseStatusValue(earliestAuditRow?.previous_value ?? null);
  const currentStatus = request.current_status_name;
  if (!currentStatus) {
    throw new AppError("Status atual da solicitação inválido", 500);
  }
  const initialStatus = previousStatus ?? currentStatus;
  if (!previousStatus && firstTransition) {
    throw new AppError(
      "Não foi possível reconstruir o Status inicial a partir da auditoria.",
      409,
      "STATUS_HISTORY_DIVERGENCE",
    );
  }

  return calculateStatusTime({
    openedAt,
    initialStatus,
    currentStatus,
    pausedStatusNames: pausedStatuses.map((status) => status.name),
    pausedStatusIds: pausedStatuses.map((status) => status.status_id),
    transitions,
    now,
  });
}

function assertRequestCustody(
  request: RequestStatusContext | undefined,
  actor: { id: number; role: Role },
): RequestStatusContext {
  const isManagerLike = actor.role === "Administrador" || actor.role === "Gestor";
  if (!request) {
    if (!isManagerLike) {
      throw new AppError(
        "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
        403,
        "INSUFFICIENT_ROLE_PERMISSIONS",
      );
    }
    throw new AppError("Protocolo não encontrado", 404);
  }

  const isAssignee =
    request.assignee_user_id !== null && Number(request.assignee_user_id) === actor.id;
  const isMappingAssignee =
    request.mapping_assignee_user_id !== null &&
    Number(request.mapping_assignee_user_id) === actor.id;

  if (!isManagerLike && !isAssignee && !isMappingAssignee) {
    throw new AppError(
      "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
      403,
      "INSUFFICIENT_ROLE_PERMISSIONS",
    );
  }
  return request;
}

export async function getStatusTimesByProtocol(
  protocol: string,
  actor: { id: number; role: Role },
): Promise<StatusTimeResponse> {
  const normalized = protocol.trim();
  const request = assertRequestCustody(await findRequestStatusContext(normalized), actor);

  const calculatedAt = new Date();
  const summary = await calculateStatusTimeForRequest(request, calculatedAt);

  return {
    protocol: request.protocol,
    calculatedAt: calculatedAt.toISOString(),
    intervals: summary.intervals,
    totalsByStatus: summary.totalsByStatus,
    totalActiveMilliseconds: summary.totalActiveMilliseconds,
    totalPausedMilliseconds: summary.totalPausedMilliseconds,
  };
}

/**
 * Timeline de auditoria por protocolo (`GET /audit-logs/:protocol`, issue
 * #124). Acesso: Administrador/Gestor (admin-like) ou ANALYST_ASSIGNEE da
 * solicitação (responsável da triagem ou designado do mapeamento).
 */
export async function listAuditLogsByProtocol(
  protocol: string,
  actor: { id: number; role: Role },
): Promise<AuditHistoryDetail[]> {
  const normalized = protocol.trim();
  const request = assertRequestCustody(await findRequestStatusContext(normalized), actor);

  const rows = await repository.listAuditHistoryByProtocol(request.protocol);
  return rows.map((row) => toDetail(row));
}
