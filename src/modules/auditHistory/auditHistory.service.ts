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
import { auditCatalog, isAuditEntityName } from "../../shared/audit/auditCatalog.ts";
import {
  isRequestStatusTransitionAction,
  parseAuditedStatusName,
} from "../../shared/audit/statusTransition.ts";
import {
  findRequestStatusContext,
  INITIAL_REQUEST_STATUS,
  type RequestStatusContext,
} from "../requests/requests.repository.ts";
import {
  calculateStatusTime,
  StatusTimeHistoryDivergenceError,
  type StatusTimeSummary,
  type StatusTimeTransition,
} from "./statusTime.ts";

/** Rótulo do catálogo; valores históricos fora dele caem no próprio nome persistido. */
function entityTypeLabel(entityType: string): string {
  return isAuditEntityName(entityType) ? auditCatalog[entityType].label : entityType;
}

export async function listAuditHistoryLogs(
  filters: AuditHistoryQuery,
): Promise<AuditHistoryListResponse> {
  const { items, total } = await repository.listAuditHistory(filters);

  const formatted: AuditHistorySummary[] = items.map((row) => ({
    audit_id: Number(row.audit_id),
    // Valores históricos podem estar fora do catálogo atual; o contrato expõe
    // o valor persistido e o label cai no fallback.
    entity_type: row.entity_type,
    entity_type_label: entityTypeLabel(row.entity_type),
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

function parseStatusTransition(
  value: string | null,
  snapshotStatusId: number | string | null,
  statusIdByName: ReadonlyMap<string, number>,
  statusNameById: ReadonlyMap<number, string>,
): { status: string | null; statusId: number | undefined } {
  const parsedStatusName = parseAuditedStatusName(value);
  if (parsedStatusName === null) return { status: null, statusId: undefined };

  const statusId = readStatusId(snapshotStatusId) ?? statusIdByName.get(parsedStatusName);
  return {
    status:
      statusId !== undefined
        ? (statusNameById.get(statusId) ?? parsedStatusName)
        : parsedStatusName,
    statusId,
  };
}

function readStatusId(value: number | string | null): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && Number.isInteger(Number(value))) return Number(value);
  return undefined;
}

async function calculateStatusTimeForRequest(
  request: NonNullable<Awaited<ReturnType<typeof findRequestStatusContext>>>,
  now: Date,
): Promise<StatusTimeSummary> {
  const [statuses, auditRows] = await Promise.all([
    repository.listStatuses(),
    repository.listAuditHistoryByProtocol(request.protocol),
  ]);
  const statusIdByName = new Map(statuses.map((status) => [status.name, status.status_id]));
  const statusNameById = new Map(statuses.map((status) => [status.status_id, status.name]));
  const pausedStatusIds = statuses
    .filter((status) => status.is_paused)
    .map((status) => status.status_id);
  const terminalStatusIds = statuses
    .filter((status) => status.is_terminal)
    .map((status) => status.status_id);

  const chronologicalRows = [...auditRows].reverse();
  const transitions: StatusTimeTransition[] = [];

  for (const row of chronologicalRows) {
    if (!isRequestStatusTransitionAction(row.action_type)) continue;

    const statusTransition = parseStatusTransition(
      row.new_value,
      row.status_id,
      statusIdByName,
      statusNameById,
    );
    if (!statusTransition.status) {
      throw new AppError(
        "A transição não contém um Status válido na auditoria.",
        409,
        "STATUS_HISTORY_DIVERGENCE",
      );
    }

    const occurredAt =
      row.occurred_at instanceof Date ? row.occurred_at : new Date(String(row.occurred_at));
    if (Number.isNaN(occurredAt.getTime())) {
      throw new AppError(
        "A transição contém uma data inválida na auditoria.",
        409,
        "STATUS_HISTORY_DIVERGENCE",
      );
    }

    transitions.push({
      status: statusTransition.status,
      statusId: statusTransition.statusId,
      occurredAt,
    });
  }

  const openedAt =
    request.created_at instanceof Date ? request.created_at : new Date(String(request.created_at));
  if (Number.isNaN(openedAt.getTime())) {
    throw new AppError("Data de abertura da solicitação inválida", 500);
  }

  const earliestAuditRow = chronologicalRows.find((row) =>
    isRequestStatusTransitionAction(row.action_type),
  );
  const previousStatus = parseStatusTransition(
    earliestAuditRow?.previous_value ?? null,
    earliestAuditRow?.previous_status_id ?? null,
    statusIdByName,
    statusNameById,
  );
  const currentStatus = request.current_status_name;
  if (!currentStatus) {
    throw new AppError("Status atual da solicitação inválido", 500);
  }
  const initialStatus = previousStatus.status ?? INITIAL_REQUEST_STATUS;
  if (!previousStatus.status && earliestAuditRow) {
    throw new AppError(
      "Não foi possível reconstruir o Status inicial a partir da auditoria.",
      409,
      "STATUS_HISTORY_DIVERGENCE",
    );
  }

  try {
    return calculateStatusTime({
      openedAt,
      initialStatus,
      initialStatusId: previousStatus.statusId ?? statusIdByName.get(INITIAL_REQUEST_STATUS),
      currentStatus,
      currentStatusId: request.current_status_id !== null ? request.current_status_id : undefined,
      currentIsTerminal: request.current_is_terminal,
      pausedStatusIds,
      terminalStatusIds,
      transitions,
      now,
    });
  } catch (error) {
    if (error instanceof StatusTimeHistoryDivergenceError) {
      throw new AppError(
        "A trilha de auditoria diverge do Status atual da solicitação.",
        409,
        "STATUS_HISTORY_DIVERGENCE",
      );
    }
    throw error;
  }
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

async function findCustodiedRequest(
  protocol: string,
  actor: { id: number; role: Role },
): Promise<RequestStatusContext> {
  return assertRequestCustody(await findRequestStatusContext(protocol.trim()), actor);
}

export async function getStatusTimesByProtocol(
  protocol: string,
  actor: { id: number; role: Role },
): Promise<StatusTimeResponse> {
  const request = await findCustodiedRequest(protocol, actor);

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
  const request = await findCustodiedRequest(protocol, actor);

  const rows = await repository.listAuditHistoryByProtocol(request.protocol);
  return rows.map((row) => toDetail(row));
}
