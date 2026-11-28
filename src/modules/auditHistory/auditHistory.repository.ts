import type { Knex } from "knex";
import db from "../../database/conection.ts";
import type { AuditHistoryQuery } from "../DTOs/auditHistory/AuditHistory.dto.ts";

/** Recorte de linhas da listagem administrativa; `null` = Custódia `all`. */
export interface AuditAccessScope {
  readonly responsibleUserId: number | null;
}

interface AuditSummaryRow {
  audit_id: number;
  entity_type: string;
  action_type: string;
  user_id: number | null;
  actor_name: string | null;
  actor_profile_id: number | null;
  actor_profile_name: string | null;
  occurred_at: Date;
}

interface AuditCountRow {
  total: number | string;
}

interface AuditHistoryDetailRow {
  audit_id: number | string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  user_id: number | string | null;
  actor_name: string | null;
  actor_profile_id: number | null;
  actor_profile_name: string | null;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  last_technical_message: string | null;
  previous_meeting: unknown;
  ip_address: string | null;
  change_origin: string | null;
  denied_permission_keys: string[] | null;
  occurred_at: Date | string;
}

/** Protocolos das solicitações em que o ator é o Responsável corrente. */
function responsibleProtocols(userId: number) {
  return db("requests as r")
    .join("details_professional as dp", "dp.professional_id", "r.professional_id")
    .where("dp.user_id", userId)
    .select("r.protocol");
}

/** `mapping_id` textual das solicitações sob a Custódia do ator. */
function responsibleMappingIds(userId: number) {
  return db("mappings as m")
    .join("requests as r", "r.request_id", "m.request_id")
    .join("details_professional as dp", "dp.professional_id", "r.professional_id")
    .where("dp.user_id", userId)
    .select(db.raw("m.mapping_id::text"));
}

/** `pending_item_id` textual das solicitações sob a Custódia do ator. */
function responsiblePendingItemIds(userId: number) {
  return db("pending_items as pi")
    .join("requests as r", "r.request_id", "pi.request_id")
    .join("details_professional as dp", "dp.professional_id", "r.professional_id")
    .where("dp.user_id", userId)
    .select(db.raw("pi.pending_item_id::text"));
}

/**
 * Aplica o recorte `assigned` à listagem. Eventos ligados a solicitações do
 * Responsável entram; entidades globais (`user`, `settings`) ficam fora. As
 * chaves de `pending_item` podem guardar o protocolo (criação) ou o id do item
 * (resposta/revisão), então as duas formas são aceitas.
 */
function applyAuditScope(builder: Knex.QueryBuilder, scope: AuditAccessScope): void {
  if (scope.responsibleUserId === null) return;

  const userId = scope.responsibleUserId;

  builder.where((where) => {
    where
      .where((requestScope) => {
        requestScope
          .whereIn("a.entity_type", ["request", "prioritization"])
          .whereIn("a.entity_id", responsibleProtocols(userId));
      })
      .orWhere((mappingScope) => {
        mappingScope
          .where("a.entity_type", "mapping")
          .whereIn("a.entity_id", responsibleMappingIds(userId));
      })
      .orWhere((pendingScope) => {
        pendingScope.where("a.entity_type", "pending_item").where((pendingTarget) => {
          pendingTarget
            .whereIn("a.entity_id", responsibleProtocols(userId))
            .orWhereIn("a.entity_id", responsiblePendingItemIds(userId));
        });
      });
  });
}

export async function listAuditHistory(
  filters: AuditHistoryQuery,
  scope: AuditAccessScope,
): Promise<{ items: AuditSummaryRow[]; total: number }> {
  const query = db("audit_history as a")
    .leftJoin("users as u", "u.user_id", "a.user_id")
    .select(
      "a.audit_id",
      "a.entity_type",
      "a.action_type",
      "a.user_id",
      "u.full_name as actor_name",
      "a.actor_profile_id",
      "a.actor_profile_name",
      "a.occurred_at",
    )
    .orderBy("a.occurred_at", "desc");

  if (filters.entityType) {
    query.where("a.entity_type", filters.entityType);
  }
  applyAuditScope(query, scope);

  const countQuery = db("audit_history as a");
  if (filters.entityType) {
    countQuery.where("a.entity_type", filters.entityType);
  }
  applyAuditScope(countQuery, scope);

  const totalRow = await countQuery.first<AuditCountRow>(db.raw("COUNT(*)::int AS total"));
  const total = Number(totalRow?.total ?? 0);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;
  const items = (await query.limit(limit).offset(offset)) as AuditSummaryRow[];

  return { items, total };
}

export async function findAuditHistoryById(
  auditId: number,
): Promise<AuditHistoryDetailRow | undefined> {
  return db("audit_history as a")
    .leftJoin("users as u", "u.user_id", "a.user_id")
    .select(
      "a.audit_id",
      "a.entity_type",
      "a.entity_id",
      "a.action_type",
      "a.user_id",
      "u.full_name as actor_name",
      "a.actor_profile_id",
      "a.actor_profile_name",
      "a.previous_value",
      "a.new_value",
      "a.note",
      "a.last_technical_message",
      "a.previous_meeting",
      "a.ip_address",
      "a.change_origin",
      "a.denied_permission_keys",
      "a.occurred_at",
    )
    .where("a.audit_id", auditId)
    .first<AuditHistoryDetailRow>();
}

/**
 * Resolve o protocolo da solicitação ligada ao evento. Entidades sem vínculo
 * de linha (`user`, `settings`) devolvem `null` — visíveis apenas em `all`.
 */
export async function findAuditTargetProtocol(
  entityType: string,
  entityId: string,
): Promise<string | null> {
  switch (entityType) {
    case "request":
    case "prioritization":
      return entityId;

    case "mapping": {
      const row = await db("mappings as m")
        .join("requests as r", "r.request_id", "m.request_id")
        .whereRaw("m.mapping_id::text = ?", [entityId])
        .first<{ protocol: string }>("r.protocol");
      return row?.protocol ?? null;
    }

    case "pending_item": {
      const byProtocol = await db("requests")
        .where({ protocol: entityId })
        .first<{ protocol: string }>("protocol");
      if (byProtocol) return byProtocol.protocol;

      const byItem = await db("pending_items as pi")
        .join("requests as r", "r.request_id", "pi.request_id")
        .whereRaw("pi.pending_item_id::text = ?", [entityId])
        .first<{ protocol: string }>("r.protocol");
      return byItem?.protocol ?? null;
    }

    default:
      return null;
  }
}

/**
 * Timeline de auditoria de uma solicitação (alias `GET /audit-logs/:protocol`,
 * issue #124): registros `request.*` cujo `entity_id` é o protocolo, do mais
 * recente ao mais antigo.
 */
export async function listAuditHistoryByProtocol(
  protocol: string,
): Promise<AuditHistoryDetailRow[]> {
  return db("audit_history as a")
    .leftJoin("users as u", "u.user_id", "a.user_id")
    .select(
      "a.audit_id",
      "a.entity_type",
      "a.entity_id",
      "a.action_type",
      "a.user_id",
      "u.full_name as actor_name",
      "a.actor_profile_id",
      "a.actor_profile_name",
      "a.previous_value",
      "a.new_value",
      "a.note",
      "a.last_technical_message",
      "a.previous_meeting",
      "a.ip_address",
      "a.change_origin",
      "a.denied_permission_keys",
      "a.occurred_at",
    )
    .where("a.entity_type", "request")
    .andWhere("a.entity_id", protocol)
    .orderBy("a.occurred_at", "desc")
    .orderBy("a.audit_id", "desc")
    .then((rows) => rows as AuditHistoryDetailRow[]);
}
