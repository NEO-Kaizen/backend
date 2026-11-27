import type { PermissionActor } from "../../shared/access/requestAccess.ts";
import {
  custodyFor,
  hasResponsibleCustody,
  recordAccessDeniedAttempt,
  requireResponsibleCustody,
} from "../../shared/access/requestAccess.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import type {
  AuditHistoryQuery,
  AuditHistorySummary,
  AuditHistoryDetail,
  AuditHistoryListResponse,
} from "../DTOs/auditHistory/AuditHistory.dto.ts";
import * as repository from "./auditHistory.repository.ts";
import type { AuditAccessScope } from "./auditHistory.repository.ts";
import { auditCatalog, type AuditEntityName } from "../../shared/audit/auditCatalog.ts";
import { toActorProfileSnapshot } from "../../shared/types/profile.ts";
import { findRequestStatusContext } from "../requests/requests.repository.ts";

const entityLabels: Record<AuditEntityName, string> = Object.fromEntries(
  Object.entries(auditCatalog).map(([key, val]) => [key, val.label]),
) as Record<AuditEntityName, string>;

/** Recorte da Custódia `audit:read` para as consultas administrativas. */
function auditScopeFor(actor: PermissionActor): AuditAccessScope {
  const custody = custodyFor(actor, "audit:read");

  if (custody === "all") {
    return { responsibleUserId: null };
  }
  if (custody === "assigned") {
    return { responsibleUserId: actor.id };
  }

  throw new AppError("Acesso restrito à permissão audit:read", 403);
}

export async function listAuditHistoryLogs(
  filters: AuditHistoryQuery,
  actor: PermissionActor,
): Promise<AuditHistoryListResponse> {
  const { items, total } = await repository.listAuditHistory(filters, auditScopeFor(actor));

  const formatted: AuditHistorySummary[] = items.map((row) => ({
    audit_id: Number(row.audit_id),
    entity_type: row.entity_type,
    entity_type_label: entityLabels[row.entity_type as AuditEntityName] ?? row.entity_type,
    action_type: row.action_type,
    actor: {
      kind: row.user_id === null ? "system" : "user",
      userId: row.user_id,
      displayName: row.actor_name,
      profile: toActorProfileSnapshot(row.actor_profile_id, row.actor_profile_name),
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
      profile: toActorProfileSnapshot(row.actor_profile_id, row.actor_profile_name),
    },
    previous_value: row.previous_value,
    new_value: row.new_value,
    note: row.note,
    last_technical_message: row.last_technical_message ?? null,
    ip_address: row.ip_address ?? null,
    change_origin: row.change_origin,
    denied_permission_keys: row.denied_permission_keys ?? [],
    occurred_at: occurredAt,
  };
}

/**
 * Detalhe administrativo. Em `assigned`, o evento precisa pertencer a uma
 * solicitação sob a Custódia do ator; a recusa é o mesmo 404 do id inexistente.
 */
export async function getAuditHistoryDetail(
  auditId: number,
  actor: PermissionActor,
  ipAddress: string | undefined,
): Promise<AuditHistoryDetail> {
  const row = await repository.findAuditHistoryById(auditId);
  if (!row) {
    await recordAccessDeniedAttempt(
      `audit:${auditId}`,
      actor.id,
      ipAddress,
      "audit:read log inexistente",
    );
    throw new AppError("Log não encontrado", 404);
  }

  const scope = auditScopeFor(actor);
  if (scope.responsibleUserId !== null) {
    const protocol = await repository.findAuditTargetProtocol(row.entity_type, row.entity_id);
    const request = protocol ? await findRequestStatusContext(protocol) : undefined;
    const isVisible =
      request !== undefined && hasResponsibleCustody(actor, "audit:read", request.assignee_user_id);

    if (!isVisible) {
      await recordAccessDeniedAttempt(
        protocol ?? `audit:${row.audit_id}`,
        actor.id,
        ipAddress,
        "audit:read sem custódia",
        ["audit:read"],
      );
      throw new AppError("Log não encontrado", 404);
    }
  }

  return toDetail(row);
}

/**
 * Timeline de auditoria por protocolo (`GET /audit-logs/:protocol`, issue
 * #124). A chave `audit:read` é o gate da rota; a linha é resolvida pela
 * Custódia do Responsável corrente, sem revelar existência fora dela.
 */
export async function listAuditLogsByProtocol(
  protocol: string,
  actor: PermissionActor,
  ipAddress: string | undefined,
): Promise<AuditHistoryDetail[]> {
  const normalized = protocol.trim();

  const request = await requireResponsibleCustody(
    await findRequestStatusContext(normalized),
    actor,
    "audit:read",
    normalized,
    ipAddress,
    "audit:read sem custódia",
    (row) => row.assignee_user_id,
  );

  const rows = await repository.listAuditHistoryByProtocol(request.protocol);
  return rows.map((row) => toDetail(row));
}
