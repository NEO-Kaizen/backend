import { AppError } from "../../shared/errors/AppError.ts";
import type { Role } from "../../shared/types/role.ts";
import type {
  AuditHistoryQuery,
  AuditHistorySummary,
  AuditHistoryDetail,
  AuditHistoryListResponse,
} from "../DTOs/auditHistory/AuditHistory.dto.ts";
import * as repository from "./auditHistory.repository.ts";
import { auditCatalog, type AuditEntityName } from "../../shared/audit/auditCatalog.ts";
import { findRequestStatusContext } from "../requests/requests.repository.ts";

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
  const isManagerLike = actor.role === "Administrador" || actor.role === "Gestor";

  const request = await findRequestStatusContext(normalized);
  if (!request) {
    // Sem vazar existência: não-custódia recebe 403 genérico; só perfis com
    // leitura ampla veem o 404 real.
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

  const rows = await repository.listAuditHistoryByProtocol(request.protocol);
  return rows.map((row) => toDetail(row));
}
